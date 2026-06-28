# Afriex Creator Payout Platform

Backend for a creator marketplace: buyers pay creators for products via
Stripe, the platform takes a fee, and the net amount accrues to each
creator's balance. Creators withdraw on demand or get swept automatically
on a schedule. All actual money movement to creators goes through Afriex.

This is the backend only (v1 scope). Admin and creator-facing frontends are
a separate phase.

## Domain model

```
Buyer pays (Stripe webhook)
        |
        v
   sales (gross amount, currency)
        |
        v  EarningsService.processSale()
   earnings (fee breakdown frozen at processing time)
        |
        +--> creators.available_balance (+= net amount)
        +--> pool_accounts.balance (+= gross amount, per currency)

Creator balance > 0 -----+
                          |
  ON_DEMAND (creator clicks "withdraw")
  SCHEDULED (weekly/biweekly/monthly cron sweep)
                          |
                          v
                    withdrawals (status: QUEUED -> PROCESSING -> PAID|FAILED)
                          |
                          v  BullMQ job -> disbursement worker
                    Afriex transfer API
                          |
                          v
              Afriex webhook confirms PAID or FAILED
              (FAILED credits creator + pool balance back)
```

Key decisions locked in during scoping (see inline code comments for the
full rationale on each):

- **Earnings are accrual records only.** `creators.available_balance` is
  the sole authoritative running counter. A withdrawal does not trace back
  to specific earnings rows -- this was an explicit simplification over a
  fully ledger-accurate model.
- **One pool account per currency**, not one global account and not one per
  creator. Sales settle their gross amount into the pool account matching
  their currency; withdrawals draw down the same pool account.
- **The platform fee percentage is stored on every earnings row**, not just
  the computed amounts -- so historical earnings stay accurate even after
  the fee schedule changes later.
- **On-demand withdrawals have a minimum amount and a cooldown** (defaults:
  $5 minimum, 24h cooldown) to stop a creator hammering Afriex with tiny
  repeated payouts. The scheduled sweep has neither restriction -- it pays
  out any positive balance for any payout-eligible creator on the
  platform's own cadence.
- **No approval gate on disbursement.** Once a withdrawal is created
  (on-demand or scheduled), it goes straight to the queue. There is no
  admin-approval step in v1.

## Project layout

Follows the codebase architecture guide: domain-first modules under
`src/modules/`, each with router -> controller -> service -> repository
layers; `src/shared/` for cross-cutting errors/middleware/types/utils;
`src/infra/` for framework-aware external adapters (database, queue,
Afriex client).

```
src/
├── config/              env validation, db client, logger
├── modules/
│   ├── auth/             better-auth config + signup hook
│   ├── creators/         creator profile + balance
│   ├── payout-methods/   bank/payout destination registration with Afriex
│   ├── sales/             Stripe webhook -> sale records
│   ├── earnings/          sale -> fee breakdown -> balance credit
│   ├── pool-accounts/    per-currency Afriex virtual account balances
│   ├── withdrawals/      on-demand + scheduled disbursement creation
│   └── admin/            read-only oversight + manual sweep trigger
├── shared/
│   ├── errors/           AppError hierarchy
│   ├── middleware/       authenticate, authorize, validate, error handler
│   ├── types/            ApiResponse, Role, pagination
│   └── utils/            currency math, fee math, encryption (pure functions)
└── infra/
    ├── database/schema/  Drizzle schema, one file per table
    ├── queue/            BullMQ queue, worker, cron scheduler
    └── afriex/           Afriex API client + inbound webhook handler
```

## Running locally

Requires Postgres and Redis running locally (or update `.env` to point at
remote instances).

```bash
cp .env.example .env
# fill in real values -- see comments in .env.example for what each is for

npm install

# Generate and run migrations from the Drizzle schema
npm run db:generate
npm run db:migrate

# better-auth manages its own auth tables separately -- run its own
# migration step too (see better-auth docs for the exact CLI command for
# your installed version)

# Provision pool accounts (USD/NGN/GHS/KES) -- required before any sale can
# be processed
npm run db:seed

# Start the API server
npm run dev

# In a separate process: start the disbursement worker + scheduled sweep cron
npm run worker:dev
```

## Testing

```bash
npm test
```

Covers fee computation (rounding correctness, no floating-point drift),
currency comparison utilities, and the withdrawal cooldown guard.

## What's intentionally not built in v1

- Frontend (admin dashboard, creator-facing app) -- next phase.
- Admin approval workflow for withdrawals -- the locked model has none.
- Per-creator configurable disbursement cadence -- cadence is platform-wide
  via `SCHEDULED_DISBURSEMENT_CADENCE`.
- Ledger-accurate earnings-to-withdrawal tracing -- balance is a running
  counter by design.
