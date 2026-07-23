import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { creators } from '../../infra/database/schema';
import {
  creatorBalancesRepository,
  type CurrencyCode,
} from './creator-balances.repository';
import {
  encryptPii,
  decryptPii,
  blindIndex,
  isEncryptedPii,
} from '../../shared/utils/encryption';

export type Creator = typeof creators.$inferSelect;

function decryptCreatorPhone(row: Creator): Creator {
  return { ...row, phone: decryptPii(row.phone) };
}

export const creatorsRepository = {
  async findById(creatorId: string): Promise<Creator | undefined> {
    const row = await db.query.creators.findFirst({ where: eq(creators.id, creatorId) });
    return row ? decryptCreatorPhone(row) : undefined;
  },

  async findByUserId(userId: string): Promise<Creator | undefined> {
    const row = await db.query.creators.findFirst({ where: eq(creators.userId, userId) });
    return row ? decryptCreatorPhone(row) : undefined;
  },

  async create(userId: string, phone: string, country: string): Promise<Creator> {
    const phonePlain = phone.trim();
    const [row] = await db
      .insert(creators)
      .values({
        userId,
        phone: phonePlain ? encryptPii(phonePlain) : '',
        phoneHash: phonePlain ? blindIndex(phonePlain, 'phone') : null,
        country,
      })
      .returning();
    if (row) {
      await creatorBalancesRepository.ensureRow(row.id, row.payoutCurrency as CurrencyCode);
    }
    return row ? decryptCreatorPhone(row) : row!;
  },

  /**
   * Credits balance in the given currency (sale currency).
   * Prefer this over the legacy single-currency helpers.
   */
  async incrementBalance(
    creatorId: string,
    amount: string,
    currency: CurrencyCode,
  ): Promise<void> {
    await creatorBalancesRepository.increment(creatorId, currency, amount);
  },

  async decrementBalance(
    creatorId: string,
    amount: string,
    currency: CurrencyCode,
  ): Promise<void> {
    await creatorBalancesRepository.decrement(creatorId, currency, amount);
  },

  async getBalance(creatorId: string, currency: CurrencyCode): Promise<string> {
    return creatorBalancesRepository.getBalance(creatorId, currency);
  },

  async listBalances(creatorId: string) {
    return creatorBalancesRepository.listForCreator(creatorId);
  },

  async setPayoutEligible(creatorId: string, eligible: boolean): Promise<void> {
    await db
      .update(creators)
      .set({ payoutEligible: eligible, updatedAt: new Date() })
      .where(eq(creators.id, creatorId));
  },

  async setLastWithdrawalAt(creatorId: string, when: Date): Promise<void> {
    await db
      .update(creators)
      .set({ lastWithdrawalAt: when, updatedAt: new Date() })
      .where(eq(creators.id, creatorId));
  },

  async update(
    creatorId: string,
    input: Partial<Pick<Creator, 'payoutCurrency' | 'phone' | 'country'>>,
  ): Promise<Creator | undefined> {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.country !== undefined) patch.country = input.country;
    if (input.payoutCurrency !== undefined) patch.payoutCurrency = input.payoutCurrency;
    if (input.phone !== undefined) {
      const phonePlain = input.phone.trim();
      patch.phone = phonePlain ? encryptPii(phonePlain) : '';
      patch.phoneHash = phonePlain ? blindIndex(phonePlain, 'phone') : null;
    }

    const [row] = await db
      .update(creators)
      .set(patch)
      .where(eq(creators.id, creatorId))
      .returning();

    if (row && input.payoutCurrency) {
      await creatorBalancesRepository.ensureRow(creatorId, input.payoutCurrency as CurrencyCode);
      const bal = await creatorBalancesRepository.getBalance(
        creatorId,
        input.payoutCurrency as CurrencyCode,
      );
      const [synced] = await db
        .update(creators)
        .set({ availableBalance: bal, updatedAt: new Date() })
        .where(eq(creators.id, creatorId))
        .returning();
      return synced ? decryptCreatorPhone(synced) : decryptCreatorPhone(row);
    }

    // Opportunistic upgrade of legacy plaintext phone
    if (row && input.phone === undefined && row.phone && !isEncryptedPii(row.phone)) {
      await this.update(creatorId, { phone: row.phone });
      return this.findById(creatorId);
    }

    return row ? decryptCreatorPhone(row) : undefined;
  },

  /**
   * Creators eligible for the scheduled disbursement sweep:
   * payout-eligible with a positive balance in their payout currency.
   */
  async findEligibleForScheduledSweep(): Promise<Creator[]> {
    const eligible = await db.query.creators.findMany({
      where: eq(creators.payoutEligible, true),
    });

    const result: Creator[] = [];
    for (const creator of eligible) {
      const bal = await creatorBalancesRepository.getBalance(
        creator.id,
        creator.payoutCurrency as CurrencyCode,
      );
      if (gtNumeric(bal, '0')) {
        // Reflect ledger into legacy field so callers reading availableBalance are correct
        if (creator.availableBalance !== bal) {
          await db
            .update(creators)
            .set({ availableBalance: bal })
            .where(eq(creators.id, creator.id));
          result.push({ ...creator, availableBalance: bal });
        } else {
          result.push(creator);
        }
      }
    }
    return result;
  },
};

function gtNumeric(a: string, b: string): boolean {
  return Math.round(Number(a) * 100) > Math.round(Number(b) * 100);
}
