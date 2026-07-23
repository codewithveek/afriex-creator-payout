import { eq, sql } from 'drizzle-orm';
import { db } from '../../config/db';
import { customers } from '../../infra/database/schema';

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export const customersRepository = {
  async create(input: NewCustomer): Promise<Customer> {
    const [row] = await db
      .insert(customers)
      .values({
        ...input,
        email: input.email.trim().toLowerCase(),
      })
      .returning();
    return row!;
  },

  async findByEmail(email: string): Promise<Customer | undefined> {
    const normalized = email.trim().toLowerCase();
    return db.query.customers.findFirst({
      where: sql`lower(${customers.email}) = ${normalized}`,
    });
  },

  async findById(id: string): Promise<Customer | undefined> {
    return db.query.customers.findFirst({ where: eq(customers.id, id) });
  },
};
