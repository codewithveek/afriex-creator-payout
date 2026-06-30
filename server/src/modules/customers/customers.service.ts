import crypto from 'node:crypto';
import { customersRepository, type Customer } from './customers.repository';
import { ordersService } from '../orders/orders.service';

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

  async login(input: { email: string; password: string }): Promise<Customer> {
    const customer = await customersRepository.findByEmail(input.email);
    if (!customer || !customer.passwordHash) {
      throw new Error('Invalid email or password');
    }

    if (!verifyPassword(input.password, customer.passwordHash)) {
      throw new Error('Invalid email or password');
    }

    return customer;
  },

  async getOrders(email: string) {
    return ordersService.listForCustomer(email);
  },
};
