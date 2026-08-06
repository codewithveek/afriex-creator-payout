import { pgEnum } from 'drizzle-orm/pg-core';

// --- Identity & access ---
export const userRoleEnum = pgEnum('user_role', ['CREATOR', 'ADMIN']);

// --- Payout method lifecycle ---
// A creator is only eligible for scheduled disbursement once a payout method
// reaches VERIFIED. PENDING = added but not yet confirmed with Afriex.
// REVOKED = creator removed it or Afriex flagged it; disbursement must stop.
export const payoutMethodStatusEnum = pgEnum('payout_method_status', [
  'PENDING',
  'VERIFIED',
  'REVOKED',
]);

// --- Sale lifecycle (from the payment provider) ---
export const saleStatusEnum = pgEnum('sale_status', [
  'PENDING', // payment intent created, not yet confirmed
  'PAID', // captured and settled
  'REFUNDED', // buyer refunded after payment — earnings must be reversed
  'FAILED', // payment never completed
]);

// --- Earnings lifecycle ---
// Earnings are accrual records only (per the locked model: balance is a
// running counter, earnings rows are historical, not individually "spent").
// CONFIRMED = counted in the creator's available balance.
// REVERSED = sale was refunded after the earning was confirmed; balance was
// debited back. Kept as a row (not deleted) for audit trail.
export const earningStatusEnum = pgEnum('earning_status', [
  'CONFIRMED',
  'REVERSED',
]);

// --- Withdrawal lifecycle ---
export const withdrawalStatusEnum = pgEnum('withdrawal_status', [
  'QUEUED', // created, balance reserved, waiting for worker to pick up
  'PROCESSING', // worker has called Afriex, awaiting webhook confirmation
  'PAID', // Afriex confirmed disbursement complete
  'FAILED', // Afriex rejected the transfer outright — balance credited back
  'UNKNOWN', // Afriex call errored ambiguously (timeout/5xx/network) — the
  // transfer may or may not have gone through. Balance is NOT credited back
  // until an operator reconciles this against Afriex by the withdrawal id
  // (used as the idempotency key on every transfer we create).
]);

// What triggered this withdrawal — kept distinct from status for reporting.
export const withdrawalTriggerEnum = pgEnum('withdrawal_trigger', [
  'ON_DEMAND',
  'SCHEDULED',
]);

// --- Order lifecycle ---
export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'COMPLETED',
  'REFUNDED',
  'FAILED',
]);

// --- Supported currencies ---
// Kept as an enum (not free text) because pool accounts, payout methods, and
// balances are all currency-scoped and must agree on a fixed vocabulary.
export const currencyEnum = pgEnum('currency', ['USD', 'NGN', 'GHS', 'KES']);
