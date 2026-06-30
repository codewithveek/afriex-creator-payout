import { adminRepository } from './admin.repository';
import { withdrawalsService } from '../withdrawals/withdrawals.service';

export const adminService = {
  async listCreators(offset: number, limit: number) {
    return adminRepository.listCreatorsWithUser(offset, limit);
  },

  async listWithdrawals(offset: number, limit: number) {
    return adminRepository.listRecentWithdrawals(offset, limit);
  },

  async listSales(offset: number, limit: number) {
    return adminRepository.listRecentSales(offset, limit);
  },

  async listPoolAccounts(offset: number, limit: number) {
    return adminRepository.listPoolAccounts(offset, limit);
  },

  /** Manually triggers the scheduled sweep ahead of its cron cadence — useful for ops/testing. */
  async triggerScheduledSweep() {
    return withdrawalsService.runScheduledSweep();
  },
};
