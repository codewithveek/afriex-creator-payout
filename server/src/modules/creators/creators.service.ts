import { creatorsRepository, type Creator } from './creators.repository';
import { creatorBalancesRepository } from './creator-balances.repository';
import { NotFoundError } from '../../shared/errors';

export type UpdateCreatorProfile = {
  payoutCurrency?: 'USD' | 'NGN' | 'GHS' | 'KES';
  phone?: string;
  country?: string;
};

export type CreatorProfile = Creator & {
  balances: Array<{ currency: string; availableBalance: string }>;
};

export const creatorsService = {
  async ensureCreatorRecord(userId: string, phone?: string, country?: string): Promise<Creator> {
    const existing = await creatorsRepository.findByUserId(userId);
    if (existing) {
      if (phone && existing.phone !== phone) {
        await creatorsRepository.update(existing.id, { phone });
      }
      if (country && existing.country !== country) {
        await creatorsRepository.update(existing.id, { country });
      }
      return existing;
    }
    return creatorsRepository.create(userId, phone ?? '', country ?? 'NG');
  },

  async getByUserId(userId: string): Promise<Creator> {
    const creator = await creatorsRepository.findByUserId(userId);
    if (!creator) throw new NotFoundError('Creator profile not found');
    return creator;
  },

  async getById(creatorId: string): Promise<Creator> {
    const creator = await creatorsRepository.findById(creatorId);
    if (!creator) throw new NotFoundError('Creator not found');
    return creator;
  },

  async getProfileWithBalances(userId: string): Promise<CreatorProfile> {
    const creator = await this.getByUserId(userId);
    const balances = await creatorBalancesRepository.listForCreator(creator.id);

    // Ensure payout currency always appears even at zero
    const hasPayout = balances.some((b) => b.currency === creator.payoutCurrency);
    if (!hasPayout) {
      await creatorBalancesRepository.ensureRow(
        creator.id,
        creator.payoutCurrency as 'USD' | 'NGN' | 'GHS' | 'KES',
      );
    }

    const refreshed = await creatorBalancesRepository.listForCreator(creator.id);
    const payoutBal =
      refreshed.find((b) => b.currency === creator.payoutCurrency)?.availableBalance ?? '0.00';

    return {
      ...creator,
      availableBalance: payoutBal,
      balances: refreshed.map((b) => ({
        currency: b.currency,
        availableBalance: b.availableBalance,
      })),
    };
  },

  async updateProfile(userId: string, input: UpdateCreatorProfile): Promise<CreatorProfile> {
    const creator = await this.getByUserId(userId);
    const updated = await creatorsRepository.update(creator.id, input);
    if (!updated) throw new NotFoundError('Creator not found');
    return this.getProfileWithBalances(userId);
  },
};
