import { eq, or } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { db } from '../../config/db';
import { customers } from '../../infra/database/schema';
import {
  blindIndex,
  encryptPii,
  decryptPii,
  hashToken,
  isEncryptedPii,
  normalizeEmail,
} from '../../shared/utils/encryption';

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type DecryptedCustomer = Omit<Customer, 'email' | 'name'> & {
  email: string;
  name: string;
};

/** Migration-era hash used in SQL backfill before HMAC blind indexes existed. */
function legacyEmailSha(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function toDecrypted(row: Customer): DecryptedCustomer {
  return {
    ...row,
    email: decryptPii(row.email),
    name: decryptPii(row.name),
  };
}

export const customersRepository = {
  async create(input: {
    email: string;
    name: string;
    passwordHash?: string | null;
  }): Promise<DecryptedCustomer> {
    const email = normalizeEmail(input.email);
    const [row] = await db
      .insert(customers)
      .values({
        email: encryptPii(email),
        emailHash: blindIndex(email, 'email'),
        name: encryptPii(input.name.trim()),
        passwordHash: input.passwordHash ?? null,
      })
      .returning();
    return toDecrypted(row!);
  },

  async findByEmail(email: string): Promise<DecryptedCustomer | undefined> {
    const normalized = normalizeEmail(email);
    const hash = blindIndex(normalized, 'email');
    const legacy = legacyEmailSha(normalized);

    const row = await db.query.customers.findFirst({
      where: or(eq(customers.emailHash, hash), eq(customers.emailHash, legacy)),
    });
    if (!row) return undefined;

    const decrypted = toDecrypted(row);

    // Opportunistic upgrade: re-encrypt + HMAC hash if still legacy
    if (!isEncryptedPii(row.email) || row.emailHash === legacy) {
      await this.upgradePii(row.id, decrypted.email, decrypted.name);
    }

    return decrypted;
  },

  async findById(id: string): Promise<DecryptedCustomer | undefined> {
    const row = await db.query.customers.findFirst({ where: eq(customers.id, id) });
    return row ? toDecrypted(row) : undefined;
  },

  async findBySessionToken(token: string): Promise<DecryptedCustomer | undefined> {
    const tokenHash = hashToken(token);
    const row = await db.query.customers.findFirst({
      where: eq(customers.sessionTokenHash, tokenHash),
    });
    return row ? toDecrypted(row) : undefined;
  },

  async setSession(customerId: string, rawToken: string, expiresAt: Date): Promise<void> {
    await db
      .update(customers)
      .set({
        sessionTokenHash: hashToken(rawToken),
        sessionExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));
  },

  async clearSession(customerId: string): Promise<void> {
    await db
      .update(customers)
      .set({
        sessionTokenHash: null,
        sessionExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));
  },

  async upgradePii(customerId: string, email: string, name: string): Promise<void> {
    await db
      .update(customers)
      .set({
        email: encryptPii(normalizeEmail(email)),
        emailHash: blindIndex(email, 'email'),
        name: encryptPii(name),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));
  },
};
