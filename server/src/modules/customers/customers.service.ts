import crypto from 'node:crypto';
import { customersRepository, type DecryptedCustomer } from './customers.repository';
import { ordersService } from '../orders/orders.service';
import { ConflictError, UnauthorizedError } from '../../shared/errors';
import { normalizeEmail } from '../../shared/utils/encryption';

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
  async signup(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<DecryptedCustomer> {
    const email = normalizeEmail(input.email);
    const existing = await customersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const customer = await customersRepository.create({
      email,
      name: input.name,
      passwordHash: hashPassword(input.password),
    });

    await ordersService.linkGuestOrders(email, customer.id);
    return customer;
  },

  async login(input: {
    email: string;
    password: string;
  }): Promise<DecryptedCustomer & { token: string; linkedOrders: number }> {
    const email = normalizeEmail(input.email);
    const customer = await customersRepository.findByEmail(email);
    if (!customer || !customer.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!verifyPassword(input.password, customer.passwordHash)) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await customersRepository.setSession(customer.id, token, expiresAt);

    const linkedOrders = await ordersService.linkGuestOrders(email, customer.id);

    return { ...customer, token, linkedOrders };
  },

  async validateSessionToken(token: string): Promise<DecryptedCustomer | null> {
    const customer = await customersRepository.findBySessionToken(token);
    if (!customer || !customer.sessionExpiresAt || customer.sessionExpiresAt < new Date()) {
      return null;
    }
    return customer;
  },

  async getOrders(customerId: string, email: string, offset: number, limit: number) {
    return ordersService.listForCustomerAccount(customerId, email, offset, limit);
  },

  async renewDownload(customerId: string, email: string, orderId: string) {
    return ordersService.renewDownloadForCustomer(orderId, customerId, email);
  },
};
