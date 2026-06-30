import { payoutMethodsRepository, type PayoutMethod } from './payout-methods.repository';
import type { AddPayoutMethodServiceInput } from './payout-methods.schema';
import { afriexClient } from '../../infra/afriex/afriex-client';
import { encryptSecret, maskAccountNumber } from '../../shared/utils/encryption';
import { creatorsRepository } from '../creators/creators.repository';
import { NotFoundError } from '../../shared/errors';
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

export const payoutMethodsService = {
  async addPayoutMethod(creatorId: string, input: AddPayoutMethodServiceInput): Promise<PayoutMethod> {
    const { ciphertextBase64, ivBase64 } = encryptSecret(input.accountNumber);
    const countryCode = getCountryCode(input.currency);

    const afriexResult = await afriexClient.registerRecipient({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone || input.email,
      countryCode,
      accountNumber: input.accountNumber,
      bankCode: input.bankCode,
      bankName: input.bankName,
    });

    const payoutMethod = await payoutMethodsRepository.create({
      creatorId,
      afriexCustomerId: afriexResult.afriexCustomerId,
      afriexPaymentMethodId: afriexResult.afriexPaymentMethodId,
      currency: input.currency,
      maskedAccountNumber: maskAccountNumber(input.accountNumber),
      bankName: input.bankName,
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

  async listForCreator(creatorId: string): Promise<PayoutMethod[]> {
    return payoutMethodsRepository.findByCreatorId(creatorId);
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
    await payoutMethodsRepository.markRevoked(payoutMethodId);

    const stillHasVerified = await payoutMethodsRepository.findVerifiedByCreatorId(creatorId);
    if (!stillHasVerified) {
      await creatorsRepository.setPayoutEligible(creatorId, false);
    }
  },
};
