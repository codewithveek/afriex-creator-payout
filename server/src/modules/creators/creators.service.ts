import { creatorsRepository, type Creator } from './creators.repository';
import { NotFoundError } from '../../shared/errors';

export type UpdateCreatorProfile = {
  payoutCurrency?: 'USD' | 'NGN' | 'GHS' | 'KES';
};

export const creatorsService = {
  /**
   * Idempotently ensures a `creators` row exists for the given user.
   * Called right after signup. Safe to call again (e.g. a retried request)
   * since it checks for an existing row first rather than relying on a
   * unique-constraint catch, which keeps the happy path free of exception
   *-driven control flow.
   */
  async ensureCreatorRecord(userId: string): Promise<Creator> {
    const existing = await creatorsRepository.findByUserId(userId);
    if (existing) return existing;
    return creatorsRepository.create(userId);
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

  async updateProfile(userId: string, input: UpdateCreatorProfile): Promise<Creator> {
    const creator = await this.getByUserId(userId);
    const updated = await creatorsRepository.update(creator.id, input);
    if (!updated) throw new NotFoundError('Creator not found');
    return updated;
  },
};
