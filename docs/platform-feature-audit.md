# Creator Platform Feature Audit

> **Date**: 2026-06-29
> **Scope**: Feature comparison between the Afriex Creator Payout App and major creator platforms (Gumroad, Selar, Ko-fi, Patreon, Shopify)

---

## 1. Executive Summary

The **Afriex Creator Payout App** is currently a **payout infrastructure backend** with a basic creator dashboard frontend. It handles:

- Authentication & session management
- Stripe payment ingestion (webhooks)
- Sales/earnings tracking & fee computation
- Payout method management (bank accounts via Afriex)
- Withdrawal requests & automated disbursements
- Admin oversight

**It is NOT yet a full creator platform.** The critical missing piece is the **customer-facing storefront** — customers cannot browse products, check out, or pay. The app manages what happens *after* a sale is made but provides no way to make the sale in the first place.

---

## 2. Platform Feature Matrix

### Legend

| Icon | Meaning |
|------|---------|
| ✅ | Fully implemented |
| 🟡 | Partial / basic implementation |
| ❌ | Not implemented |
| — | Not applicable to this app's scope |

---

### 2.1 Payments & Payouts

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| Payment ingestion | ✅ (Stripe) | ✅ (Cards, USSD, mobile money) | 🟡 Stripe webhooks only | Can accept payments but has no hosted checkout page |
| Payout to bank | ✅ | ✅ (14 countries) | ✅ (via Afriex) | — |
| Payout to mobile money | ❌ | ✅ (M-Pesa etc.) | ❌ | Afriex supports this but app hardcodes bank transfer |
| Multi-currency support | ✅ | ✅ (8+ currencies) | 🟡 USD/NGN/GHS/KES defined but payout flow is USD-centric | Pool accounts exist per currency but most tests only cover USD |
| Payout scheduling | Weekly/Daily | T+1 to 10 days | ✅ On-demand + scheduled sweep | — |
| Minimum payout | $100 | No minimum | ✅ $5.00 (configurable) | — |
| Payment methods accepted | Cards, PayPal | Cards, USSD, mobile money, bank | ❌ No customer-facing payment UI | Customers have no way to pay |
| Instant payouts | ✅ US only | ⚠️ Coming | ❌ | — |
| Payout method management | ✅ | ✅ | 🟡 Can add, cannot edit/delete from UI | Missing edit/delete/revoke UI; API supports it |
| Fee model | 10% + $0.50 | 4%+₦50 to 10% | ✅ 10% (configurable) | — |

### 2.2 Products & Selling

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| Digital downloads | ✅ | ✅ | ❌ No product concept at all | **Critical gap** |
| Physical goods | ✅ | ✅ | ❌ | — |
| Memberships / Subscriptions | ✅ | ✅ | ❌ | — |
| Online courses | ✅ | ✅ (native) | ❌ | — |
| Coaching / Bookings | ❌ | ✅ (Selar Bookings) | ❌ | — |
| Event tickets | ❌ | ✅ | ❌ | — |
| Product variants | ⚠️ | ❌ | ❌ | — |
| Bundles | ❌ | ✅ | ❌ | — |
| Product management UI | ✅ (dashboard) | ✅ (dashboard) | ❌ | **Critical gap** — no products table, no add/edit/delete |
| File upload / hosting | ✅ | ✅ (DRM) | ❌ | — |

### 2.3 Storefront & Customer Experience

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| Hosted storefront | ✅ | ✅ | ❌ | **Critical gap** — no public-facing page at all |
| Custom domain | ✅ | $ | ❌ | — |
| Checkout page | ✅ | ✅ | ❌ | **Critical gap** — customers have no checkout flow |
| Customer account | ✅ | ✅ | ❌ | No customer accounts, no order history |
| Receipt / Invoice | ✅ | ✅ | ❌ | — |
| Custom branding | ✅ | ✅ | ❌ | — |
| Embeddable widgets | ✅ | ✅ | ❌ | — |

### 2.4 Creator Dashboard

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| Sales overview | ✅ | ✅ | ✅ | — |
| Earnings breakdown | ✅ | ✅ | 🟡 Gross/Paid/Pending | Missing platform fee breakdown per transaction |
| Payout history | ✅ | ✅ | ✅ | — |
| Payout method management | ✅ | ✅ | 🟡 Missing edit/delete | — |
| Product management | ✅ | ✅ | ❌ | **Critical gap** |
| Customer management | ✅ | 🟡 | ❌ | — |
| Analytics / charts | ✅ | ✅ ($) | ❌ | — |
| Date range filtering | ✅ | ✅ | ❌ | — |
| Export (CSV) | ✅ | ✅ | ❌ | — |
| Refund management | ✅ | ✅ | 🟡 Refund handled via Stripe webhook | Creator cannot initiate refunds from dashboard |
| Mobile responsive | ✅ | ✅ | 🟡 Static sidebar, no mobile nav | — |

### 2.5 Marketing & Sales

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| Discount codes | ✅ | ✅ | ❌ | — |
| Affiliate program | ✅ | ✅ | ❌ | — |
| Email marketing | ⚠️ | ✅ | ❌ | Resend configured but unused |
| Order bumps / Upsells | ❌ | $ | ❌ | — |
| SEO tools | ✅ | ⚠️ | ❌ | — |
| Social selling | ✅ | ✅ | ❌ | — |

### 2.6 Customer Management

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| Email collection | ✅ | ✅ | ❌ | — |
| Customer list | ✅ | 🟡 | ❌ | No concept of customers in the app |
| Customer communication | ⚠️ | ✅ | ❌ | — |
| Abandoned cart recovery | ❌ | ✅ | ❌ | — |

### 2.7 Tax & Compliance

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| Sales tax / VAT handling | ✅ (Merchant of Record) | ❌ (creator responsible) | ❌ | — |
| 1099 forms | ⚠️ | ❌ | ❌ | — |
| DAC7 / UK reporting | ❌ | ❌ | ❌ | — |
| Receipt generation | ✅ | ✅ | ❌ | — |

### 2.8 Admin Features

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| Admin dashboard | ✅ | ✅ | 🟡 Backend API exists, no frontend | 4 admin endpoints unused |
| User management | ✅ | ✅ | 🟡 Via API only | — |
| Dispute management | ✅ | ❌ | ❌ | — |
| Manual payout trigger | ✅ | ✅ | ✅ (sweep trigger) | — |
| Pool account management | — | — | 🟡 API only | No frontend for pool accounts |

### 2.9 Technical

| Feature | Gumroad | Selar | This App | Gap |
|---------|---------|-------|----------|-----|
| REST API | ✅ | ⚠️ | ✅ (16 endpoints) | — |
| Webhooks | ✅ | ❌ | ✅ (Stripe + Afriex) | — |
| Email service | ✅ | ✅ | ❌ Resend configured, never called | **Notable gap** |
| Webhook security | ✅ | — | ✅ (Stripe sig + Afriex RSA) | — |
| Rate limiting | ✅ | ✅ | 🟡 Global only (100/min) | No per-route limits |
| Pagination | ✅ | ✅ | ❌ | All endpoints return unlimited results |
| Caching | ✅ | ✅ | ❌ | Empty `infra/cache/` directory |
| Database migrations | ✅ | ✅ | ❌ | Empty `migrations/` directory |

---

## 3. Critical Gaps for Basic Usability

For the app to be usable as a creator platform, these gaps must be closed:

### Must-Have (MVP)

| # | Gap | Why It Blocks Usability | Effort | Notes |
|---|-----|------------------------|--------|-------|
| 1 | **No product catalog** | Creators cannot define what they sell. No products table in schema. Without this, no storefront, no checkout, no sales. | **High** | New DB table, CRUD API, UI pages, file upload |
| 2 | **No public storefront / checkout** | Customers have no way to discover or purchase products. The entire revenue generation side of the platform is missing. | **High** | Public pages, Stripe Checkout integration, customer order flow |
| 3 | **No email notifications** | Withdrawal confirmations, failures, sale confirmations — all silent. Resend is configured but never called. | **Medium** | Transactional email templates using React Email |
| 4 | **No withdrawal amount selection** | Creator cannot choose how much to withdraw — the API pays out the full available balance. | **Low** | Add amount input to withdrawal request |
| 5 | **No payout method delete/edit** | Creator can add but cannot remove or edit payout methods. API supports `DELETE` but UI is missing. | **Low** | Add delete/revoke button + confirmation dialog |
| 6 | **No password reset** | If a creator forgets their password, there is no recovery flow. | **Medium** | Better Auth supports it; needs UI and email template |
| 7 | **No admin frontend** | Admin API endpoints exist but cannot be used without curl. | **Medium** | Basic admin dashboard for managing creators/withdrawals |

### Should-Have (Post-MVP)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 8 | Pagination on list endpoints | Large datasets break the UI | Low |
| 9 | Mobile-responsive sidebar | Current sidebar is fixed-width, no collapse | Medium |
| 10 | Loading skeletons vs spinner | Better UX during data loading | Low |
| 11 | Date range filtering on earnings | Creators need to see period-specific data | Low |
| 12 | Creator profile/settings page | Update name, email, notification prefs | Low |
| 13 | Email verification flow | Security best practice | Medium |
| 14 | Refund initiation from dashboard | Creator cannot refund without Stripe dashboard | Medium |

### Nice-to-Have (Future)

| # | Gap | Notes |
|---|------|-------|
| 15 | Charts & analytics (earnings over time) | Line/bar charts for revenue trends |
| 16 | CSV/PDF export | Creator wants to file taxes |
| 17 | Discount codes & promotions | Marketing feature |
| 18 | Affiliate / referral tracking | Growth feature |
| 19 | Customer management UI | See who bought what |
| 20 | Multi-tenant / team accounts | Multiple users per creator account |
| 21 | Webhook logs & replays | Developer debugging tool |
| 22 | Reconciliation tooling | Verify pool balances against Afriex |

---

## 4. Architecture Gaps (Non-Functional)

| Area | Current State | Recommended Improvement | Priority |
|------|---------------|------------------------|----------|
| **DB Migrations** | `infra/database/migrations/` is empty | Generate initial Drizzle migration + automate in CI | High |
| **Better Auth migration** | CLI command undocumented | Add to README or automate in setup script | High |
| **Health checks** | `/health` returns static `{ status: 'ok' }` | Check DB, Redis, Stripe, Afriex connectivity | Medium |
| **Rate limiting** | 100 req/min global | Per-route limits (auth: stricter, webhooks: burst) | Medium |
| **Caching** | `infra/cache/` empty | Cache session lookups, rarely-changing data | Low |
| **Tests** | 15 tests pass but coverage gaps exist (see below) | Add integration tests for withdrawal flow, webhooks | Medium |
| **Idempotency in worker** | BullMQ deduplicates at queue level, but Afriex transfer could be called twice if worker crashes post-Afriex pre-save | Add idempotency key on Afriex SDK call | High |
| **Concurrency safety** | No database-level locking around withdrawal creation | Use `SELECT ... FOR UPDATE` or serializable isolation | Medium |
| **Currency mismatch guard** | Pool account currency vs creator payout currency not validated | Add validation in withdrawal creation | Low |

---

## 5. Frontend-Specific Gaps

| Gap | File(s) | Description |
|-----|---------|-------------|
| No error boundary | `layout.tsx` (root) | Whole app crashes if a server component throws |
| No mobile sidebar | `sidebar.tsx` | Sidebar is fixed 64px, no hamburger menu |
| No loading skeletons | `page.tsx` (dashboard) | Uses simple spinner; could use skeleton placeholders |
| No pagination controls | `dashboard/page.tsx`, `earnings/page.tsx`, etc. | Tables render unlimited rows |
| No withdrawal amount input | `withdrawals/client.tsx` | Sends empty body; no amount/payout-method selection |
| No payout method delete button | `payout-methods/page.tsx` + `client.tsx` | API `DELETE` endpoint exists but no UI |
| No "forgot password?" link | `login-form.tsx` | No password reset flow |
| No email verification banner | `signup-form.tsx` | No prompt after signup |
| No admin pages | (missing) | `/dashboard/admin` directory doesn't exist |
| No creator profile page | (missing) | No settings/profile page |
| No refund UI | (missing) | Refund only possible via Stripe dashboard |
| No product management pages | (missing) | No products concept at all |

---

## 6. Platform Positioning

### What This App Is

A **payout orchestration layer** that:

- Ingests payments from Stripe
- Tracks earnings with automatic fee computation
- Provides on-demand and scheduled payouts to creators in multiple currencies via Afriex
- Manages bank account payout methods with encryption
- Maintains pool accounts as a ledger of funds by currency

### What This App Is NOT (Yet)

- A storefront / marketplace where customers browse and buy products
- A digital product delivery system
- A subscription/membership management system
- A customer relationship management (CRM) tool
- An email marketing or communication platform
- A tax compliance / reporting engine

### Comparison to Competitors

| Dimension | Gumroad | Selar | This App |
|-----------|---------|-------|----------|
| **Best for** | Selling digital products globally | African creators selling digital products | **Payout management for platforms that already have customers** |
| **Core value** | Merchant of Record + storefront | African payment methods + affordable plans | **Payout infrastructure + fee computation** |
| **Front office** | ✅ Full storefront | ✅ Full storefront | ❌ Missing |
| **Back office** | Basic | Basic | **✅ Excellent payout pipeline** |
| **Geographic focus** | Global | Africa (14 countries) | Africa (via Afriex) |
| **Target user** | Individual creators | African creators | **Platforms / aggregators who need to pay creators** |

---

## 7. Recommendations

### Short-Term (MVP + 2 weeks)

1. **Add withdrawal amount input** — Let creators choose how much to withdraw instead of draining their entire balance
2. **Add payout method delete** — Wire up the existing `DELETE /api/payout-methods/:id` endpoint to the UI
3. **Add password reset flow** — Better Auth supports it; add "Forgot password?" link, reset page, and email template via Resend
4. **Add basic admin dashboard** — List creators, withdrawals, and sales using the existing admin API endpoints
5. **Enable email notifications** — Withdrawal confirmation + failure emails via Resend

### Medium-Term (MVP + 2 months)

6. **Product catalog system** — New DB table (`products`), CRUD API, upload UI, product listing page
7. **Public storefront + checkout** — Customer-facing product pages, Stripe Checkout integration, order management
8. **Customer accounts** — Customer signup/login, order history, digital download access
9. **Digital delivery** — File upload, secure download links, access control per purchase

### Long-Term (Future)

10. Subscriptions / memberships
11. Discount codes & promotions
12. Affiliate program
13. Analytics & charts
14. Mobile app
15. Tax compliance (VAT, 1099)
16. Multi-tenant platform (allow other platforms to white-label this payout infrastructure)

---

## 8. Appendix: Current Data Schema vs. Required Schema

### Existing Tables (8)
- `users` — auth
- `creators` — creator profiles & balances
- `payout_methods` — bank accounts
- `sales` — Stripe payment records
- `earnings` — fee computations
- `pool_accounts` — currency ledger
- `withdrawals` — disbursement records
- (3 better-auth tables: session, account, verification)

### Tables Needed for Basic Usability
| Table | Purpose | Priority |
|-------|---------|----------|
| `products` | Creator's sellable items (name, description, price, currency, file_url, type) | Critical |
| `orders` | Customer purchase records (product_id, customer_email, status, amount) | Critical |
| `customers` | Customer accounts (email, name, password hash) | Medium |

### Tables Needed for Full Platform
| Table | Purpose |
|-------|---------|
| `subscriptions` | Recurring billing plans |
| `discount_codes` | Promotional pricing |
| `affiliates` | Referral tracking |
| `affiliate_commissions` | Payouts to affiliates |
| `refunds` | Refund tracking |
| `notifications` | In-app notification log |
| `audit_log` | Admin action trail |

---

## 9. Appendix: Environment & Config Gaps

| Variable | Status | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_API_URL` | ✅ Set | `http://localhost:4000` |
| `STRIPE_PUBLISHABLE_KEY` | ❌ Missing | Needed for client-side Stripe Checkout |
| `SITE_URL` | ❌ Missing | Needed for public storefront domain |
| `RESEND_API_KEY` | ✅ Configured | Never used in code |
| `RESEND_FROM_EMAIL` | ✅ Configured | Never used in code |
| `BETTER_AUTH_URL` | ✅ Set | Currently points to API, should also handle frontend redirects |

---

*Generated from full codebase audit + competitive analysis of Gumroad, Selar, Paystack, Ko-fi, Patreon, and Shopify.*
