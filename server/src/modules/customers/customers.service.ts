import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { customersRepository, type Customer } from './customers.repository';
import { ordersService } from '../orders/orders.service';
import { customers } from '../../infra/database/schema';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const computed = crypto.pbkdf2Sync(password, salt!, 100000, 64, 'sha512').toString('hex');
  return computed === hash;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const customersService = {
  async signup(input: { email: string; name: string; password: string }): Promise<Customer> {
    const existing = await customersRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    return customersRepository.create({
      email: input.email,
      name: input.name,
      passwordHash: hashPassword(input.password),
    });
  },

  async login(input: { email: string; password: string }): Promise<Customer & { token: string }> {
    const customer = await customersRepository.findByEmail(input.email);
    if (!customer || !customer.passwordHash) {
      throw new Error('Invalid email or password');
    }

    if (!verifyPassword(input.password, customer.passwordHash)) {
      throw new Error('Invalid email or password');
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db
      .update(customers)
      .set({ sessionToken: token, sessionExpiresAt: expiresAt })
      .where(eq(customers.id, customer.id));

    return { ...customer, token };
  },

  async validateSessionToken(token: string): Promise<Customer | null> {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.sessionToken, token),
    });

    if (!customer || !customer.sessionExpiresAt || customer.sessionExpiresAt < new Date()) {
      return null;
    }

    return customer;
  },

  async getOrders(email: string, offset: number, limit: number) {
    return ordersService.listForCustomer(email, offset, limit);
  },
};
