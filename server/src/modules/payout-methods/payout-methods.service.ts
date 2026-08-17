import { payoutMethodsRepository, type PayoutMethod } from './payout-methods.repository';
import type {
  AddPayoutMethodServiceInput,
  PayoutChannel,
  ResolveAccountInput,
} from './payout-methods.schema';
import { afriexClient, type AfriexInstitution } from '../../infra/afriex/afriex-client';
import { encryptSecret, maskAccountNumber } from '../../shared/utils/encryption';
import { creatorsRepository } from '../creators/creators.repository';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../config/logger';

const COUNTRY_MAP: Record<string, string> = {
  USD: 'US',
  NGN: 'NG',
  GHS: 'GH',
  KES: 'KE',
};

function getCountryCode(currency: string): string {
  return COUNTRY_MAP[currency] ?? 'US';
}

/**
 * Resolves a submitted institution code against the list Afriex serves for
 * that country. A code that is not on the list is rejected rather than passed
 * through, so a malformed or stale selection fails here instead of surfacing
 * as a failed disbursement days later.
 */
async function findInstitution(
  countryCode: string,
  channel: PayoutChannel,
  institutionCode: string,
): Promise<AfriexInstitution> {
  const institutions = await afriexClient.getInstitutions(channel, countryCode);
  const match = institutions.find((i) => i.institutionCode === institutionCode);
  if (!match) {
    throw new ValidationError('That institution is not available for your country. Pick one from the list.');
  }
  return match;
}

async function countryForCreator(creatorId: string, fallbackCurrency = 'USD'): Promise<string> {
  const creator = await creatorsRepository.findById(creatorId);
  if (!creator) throw new NotFoundError('Creator profile not found');
  return creator.country || getCountryCode(fallbackCurrency);
}

export const payoutMethodsService = {
  /** Banks / mobile-money providers available in the creator's own country. */
  async listInstitutions(creatorId: string, channel: PayoutChannel): Promise<AfriexInstitution[]> {
    const countryCode = await countryForCreator(creatorId);
    return afriexClient.getInstitutions(channel, countryCode);
  },

  /**
   * Looks up the account holder's name so the creator can confirm the account
   * is theirs before saving it.
   */
  async resolveAccount(
    creatorId: string,
    input: ResolveAccountInput,
  ): Promise<{ accountName: string | null; institutionName: string }> {
    const countryCode = await countryForCreator(creatorId);
    const institution = await findInstitution(countryCode, input.channel, input.institutionCode);

    const { accountName } = await afriexClient.resolveAccount({
      channel: input.channel,
      accountNumber: input.accountNumber,
      institutionCode: input.institutionCode,
      countryCode,
    });

    return { accountName, institutionName: institution.institutionName };
  },

  async addPayoutMethod(creatorId: string, input: AddPayoutMethodServiceInput): Promise<PayoutMethod> {
    const { ciphertextBase64, ivBase64 } = encryptSecret(input.accountNumber);

    const countryCode = await countryForCreator(creatorId, input.currency);
    const institution = await findInstitution(countryCode, input.channel, input.institutionCode);

    const afriexResult = await afriexClient.registerRecipient({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      countryCode,
      accountNumber: input.accountNumber,
      bankCode: institution.institutionCode,
      bankName: institution.institutionName,
      channel: input.channel,
    });

    const payoutMethod = await payoutMethodsRepository.create({
      creatorId,
      afriexCustomerId: afriexResult.afriexCustomerId,
      afriexPaymentMethodId: afriexResult.afriexPaymentMethodId,
      currency: input.currency,
      maskedAccountNumber: maskAccountNumber(input.accountNumber),
      bankName: institution.institutionName,
      encryptedDetailsBlob: ciphertextBase64,
      ivBase64,
      status: afriexResult.verified ? 'VERIFIED' : 'PENDING',
    });

    if (payoutMethod.status === 'VERIFIED') {
      await creatorsRepository.setPayoutEligible(creatorId, true);
      logger.info({ creatorId, payoutMethodId: payoutMethod.id }, 'Payout method verified and creator marked eligible');
    }

    return payoutMethod;
  },

  async listForCreator(creatorId: string, offset: number, limit: number) {
    return payoutMethodsRepository.findByCreatorId(creatorId, offset, limit);
  },

  async getVerifiedMethodOrThrow(creatorId: string): Promise<PayoutMethod> {
    const method = await payoutMethodsRepository.findVerifiedByCreatorId(creatorId);
    if (!method) {
      throw new NotFoundError('No verified payout method found for this creator');
    }
    return method;
  },

  /**
   * Revokes a payout method. If it was the creator's only VERIFIED method,
   * flips `payoutEligible` back to false so the scheduled sweep stops
   * trying to pay them out — there is no fallback method to redirect to.
   */
  async revoke(creatorId: string, payoutMethodId: string): Promise<void> {
    const method = await payoutMethodsRepository.findById(payoutMethodId);
    if (!method || method.creatorId !== creatorId) {
      throw new NotFoundError('Payout method not found');
    }

    await payoutMethodsRepository.markRevoked(payoutMethodId);

    const stillHasVerified = await payoutMethodsRepository.findVerifiedByCreatorId(creatorId);
    if (!stillHasVerified) {
      await creatorsRepository.setPayoutEligible(creatorId, false);
    }
  },
};
