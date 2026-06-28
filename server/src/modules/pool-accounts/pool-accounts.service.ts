import { poolAccountsRepository, type PoolAccount } from './pool-accounts.repository';
import { NotFoundError } from '../../shared/errors';

export const poolAccountsService = {
  async getByCurrencyOrThrow(currency: string): Promise<PoolAccount> {
    const account = await poolAccountsRepository.findByCurrency(currency);
    if (!account) {
      // This is a platform setup error, not a user-facing one — it means an
      // admin has not provisioned a pool account for this currency yet.
      throw new NotFoundError(`No pool account configured for currency ${currency}`);
    }
    return account;
  },

  async settleSaleIntoPool(poolAccountId: string, amount: string): Promise<void> {
    await poolAccountsRepository.incrementBalance(poolAccountId, amount);
  },

  async debitForWithdrawal(poolAccountId: string, amount: string): Promise<void> {
    await poolAccountsRepository.decrementBalance(poolAccountId, amount);
  },

  async creditBackFailedWithdrawal(poolAccountId: string, amount: string): Promise<void> {
    await poolAccountsRepository.incrementBalance(poolAccountId, amount);
  },
};
