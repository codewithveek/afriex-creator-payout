import { adminRepository } from './admin.repository';
import { withdrawalsService } from '../withdrawals/withdrawals.service';

export const adminService = {
  async listCreators() {
    return adminRepository.listCreatorsWithUser();
  },

  async listWithdrawals() {
    return adminRepository.listRecentWithdrawals();
  },

  async listSales() {
    return adminRepository.listRecentSales();
  },

  async listPoolAccounts() {
    return adminRepository.listPoolAccounts();
  },

  /** Manually triggers the scheduled sweep ahead of its cron cadence — useful for ops/testing. */
  async triggerScheduledSweep() {
    return withdrawalsService.runScheduledSweep();
  },
};
