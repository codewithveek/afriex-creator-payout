import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { customers } from '../../infra/database/schema';

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export const customersRepository = {
  async create(input: NewCustomer): Promise<Customer> {
    const [row] = await db.insert(customers).values(input).returning();
    return row!;
  },

  async findByEmail(email: string): Promise<Customer | undefined> {
    return db.query.customers.findFirst({ where: eq(customers.email, email) });
  },

  async findById(id: string): Promise<Customer | undefined> {
    return db.query.customers.findFirst({ where: eq(customers.id, id) });
  },
};
