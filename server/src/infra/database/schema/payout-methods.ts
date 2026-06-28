import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { payoutMethodStatusEnum, currencyEnum } from './enums';
import { creators } from './creators';

// A creator's bank/mobile-money/wallet destination registered with Afriex.
// `afriexCustomerId` and `afriexPaymentMethodId` are the IDs Afriex returns
// after creating the customer and payment method — we never need to re-send
// raw account numbers for subsequent disbursements once this exists.
//
// `encryptedDetailsBlob` holds AES-256-GCM ciphertext of any raw details we
// must retain transiently (e.g. for display/masking in the UI, like "****1234").
// Per the schema-engineer skill's compliance callout: this is a sensitive
// field. It is NEVER stored or logged in plaintext. Encryption/decryption
// happens exclusively in the service layer via shared/utils, using
// PAYOUT_SECRETS_ENCRYPTION_KEY. The IV is stored alongside the ciphertext
// (ivBase64) since GCM requires a unique IV per encryption operation.
export const payoutMethods = pgTable(
  'payout_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => creators.id, { onDelete: 'cascade' }),

    afriexCustomerId: varchar('afriex_customer_id', { length: 255 }).notNull(),
    afriexPaymentMethodId: varchar('afriex_payment_method_id', { length: 255 }).notNull(),
    currency: currencyEnum('currency').notNull(),

    // Last 4 digits only, for display. Plaintext-safe by design (not
    // sufficient on its own to reconstruct the account).
    maskedAccountNumber: varchar('masked_account_number', { length: 8 }).notNull(),
    bankName: varchar('bank_name', { length: 150 }),

    encryptedDetailsBlob: text('encrypted_details_blob'),
    ivBase64: varchar('iv_base64', { length: 64 }),

    status: payoutMethodStatusEnum('status').notNull().default('PENDING'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_payout_methods_creator').on(table.creatorId),
    // The disbursement worker looks up "does this creator have a VERIFIED
    // method" — equality on both columns, hence composite over two singles.
    index('idx_payout_methods_creator_status').on(table.creatorId, table.status),
  ],
);

export const payoutMethodsRelations = relations(payoutMethods, ({ one }) => ({
  creator: one(creators, {
    fields: [payoutMethods.creatorId],
    references: [creators.id],
  }),
}));
