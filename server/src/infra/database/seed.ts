import { db } from '../../config/db';
import { poolAccounts } from './schema';
import { logger } from '../../config/logger';

// Pool accounts are platform infrastructure, not user data — they must
// exist before the first sale ever lands, or EarningsService.processSale()
// has nowhere to settle the gross amount. Run via: tsx src/infra/database/seed.ts
//
// In a real deployment, afriexAccountId values come from actually
// provisioning virtual accounts via the Afriex dashboard/API ahead of time
// — they are NOT created by this script. This script only creates the
// local mirror row once those external accounts exist.
const SEED_POOL_ACCOUNTS = [
  { currency: 'USD' as const, afriexAccountId: 'afx_pool_usd_REPLACE_ME' },
  { currency: 'NGN' as const, afriexAccountId: 'afx_pool_ngn_REPLACE_ME' },
  { currency: 'GHS' as const, afriexAccountId: 'afx_pool_ghs_REPLACE_ME' },
  { currency: 'KES' as const, afriexAccountId: 'afx_pool_kes_REPLACE_ME' },
];

async function seed() {
  for (const account of SEED_POOL_ACCOUNTS) {
    const existing = await db.query.poolAccounts.findFirst({
      where: (table, { eq }) => eq(table.currency, account.currency),
    });

    if (existing) {
      logger.info({ currency: account.currency }, 'Pool account already exists, skipping');
      continue;
    }

    await db.insert(poolAccounts).values({
      currency: account.currency,
      afriexAccountId: account.afriexAccountId,
      balance: '0.00',
    });
    logger.info({ currency: account.currency }, 'Pool account created');
  }

  logger.info('Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
