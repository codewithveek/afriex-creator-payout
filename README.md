# Afriex Creator Payout Platform

A digital marketplace where creators list digital products, buyers pay through a hosted checkout, the platform takes a fee, and creators withdraw their earnings to real bank accounts through the [Afriex Business API](https://docs.afriex.com).

This repo is the companion code for a two-part series:

- **Part 1: The Data Model and the Storefront.** Creators, products, customers, orders, and the Fastify module structure that serves them.
- **Part 2: Checkout and Payouts.** Afriex Checkout collects the buyer's money; Afriex Payouts sends creators theirs.

## What's inside

```
client/   Next.js storefront and dashboards (creator, customer, admin)
server/   Fastify + Postgres API, BullMQ disbursement worker
docker-compose.yml   Postgres 16 + Redis 7 for local development
```

## How money moves

```
Buyer pays (checkout provider webhook; Afriex Checkout by default)
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

The collection layer is pluggable. `PAYMENT_PROVIDER` in `.env` selects `afriex-checkout` (default), `stripe`, `paystack`, or `flutterwave`; the webhook handler and order flow are provider-agnostic. Disbursement always goes through Afriex.

## Design decisions

Key decisions locked in during scoping (see inline code comments for the full rationale on each):

- **Earnings are accrual records only.** `creators.available_balance` is the sole authoritative running counter. A withdrawal does not trace back to specific earnings rows; this was an explicit simplification over a fully ledger-accurate model.
- **One pool account per currency**, not one global account and not one per creator. Sales settle their gross amount into the pool account matching their currency; withdrawals draw down the same pool account.
- **The platform fee percentage is stored on every earnings row**, not just the computed amounts, so historical earnings stay accurate even after the fee schedule changes later.
- **On-demand withdrawals have a minimum amount and a cooldown** (defaults: $5 minimum, 24h cooldown) to stop a creator hammering Afriex with tiny repeated payouts. The scheduled sweep has neither restriction; it pays out any positive balance for any payout-eligible creator on the platform's own cadence.
- **No approval gate on disbursement.** Once a withdrawal is created (on-demand or scheduled), it goes straight to the queue. There is no admin-approval step in v1.
- **A withdrawal whose outcome is uncertain is never guessed at.** A definite rejection from Afriex fails the withdrawal and credits the balance back; a timeout or 5xx parks it as `UNKNOWN` for manual reconciliation, because refunding a transfer that actually went through would pay the creator twice.

## Project layout

Domain-first modules under `server/src/modules/`, each with router -> controller -> service -> repository layers. `shared/` holds cross-cutting errors, middleware, types, and pure utility functions; `infra/` holds framework-aware external adapters.

```
server/src/
├── config/              env validation, db client, logger
├── modules/
│   ├── auth/             better-auth config + signup hook
│   ├── creators/         creator profile + balance
│   ├── products/         product CRUD + public storefront feed
│   ├── customers/        customer accounts, guest-order linking
│   ├── orders/           checkout session creation, order lifecycle, downloads
│   ├── uploads/          product file upload (Cloudflare R2)
│   ├── sales/             payment webhook -> sale records
│   ├── earnings/          sale -> fee breakdown -> balance credit
│   ├── payout-methods/   bank/payout destination registration with Afriex
│   ├── pool-accounts/    per-currency pool balances
│   ├── withdrawals/      on-demand + scheduled disbursement creation
│   └── admin/            read-only oversight + manual sweep trigger
├── shared/
│   ├── errors/           AppError hierarchy
│   ├── middleware/       authenticate, authorize, validate, error handler
│   ├── types/            ApiResponse, Role, pagination
│   └── utils/            currency math, fee math, encryption (pure functions)
└── infra/
    ├── database/schema/  Drizzle schema, one file per table
    ├── payment/          checkout provider abstraction (Afriex, Stripe, ...)
    ├── queue/            BullMQ queue, worker, cron scheduler
    ├── afriex/           Afriex API client + inbound webhook handler
    ├── email/            transactional email (Resend)
    └── media/            Cloudflare R2 storage client
```

## Running locally

You need Node 20+, pnpm, and Docker.

```bash
# From the repo root: start Postgres and Redis
docker compose up -d
```

```bash
# Backend
cd server
cp .env.example .env
# Fill in real values; see the comments in .env.example for what each is for.
# DATABASE_URL matching the compose credentials:
# postgresql://afriex:afriex_dev_password@localhost:5432/afriex_creator_payout

pnpm install

# Generate and run migrations from the Drizzle schema
pnpm db:generate
pnpm db:migrate

# better-auth manages its own auth tables separately; run its migration
# step too (see the better-auth docs for the exact CLI command for your
# installed version)

# Provision pool accounts (USD/NGN/GHS/KES); required before any sale can
# be processed
pnpm db:seed

# Start the API server (http://localhost:4000)
pnpm dev

# In a separate terminal: the disbursement worker + scheduled sweep cron
pnpm worker:dev
```

```bash
# Frontend
cd client
pnpm install
pnpm dev
```

## Testing

```bash
cd server
pnpm test
```

Covers fee computation (rounding correctness, no floating-point drift), currency comparison utilities, and the withdrawal cooldown guard.

## What's intentionally not built in v1

- Admin approval workflow for withdrawals; the locked model has none.
- Per-creator configurable disbursement cadence; cadence is platform-wide via `SCHEDULED_DISBURSEMENT_CADENCE`.
- Ledger-accurate earnings-to-withdrawal tracing; the balance is a running counter by design.
