import { eq, and } from 'drizzle-orm';
import { db } from '../../config/db';
import { products } from '../../infra/database/schema';

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export const productsRepository = {
  async create(input: NewProduct): Promise<Product> {
    const [row] = await db.insert(products).values(input).returning();
    return row!;
  },

  async findById(id: string): Promise<Product | undefined> {
    return db.query.products.findFirst({ where: eq(products.id, id) });
  },

  async findByCreatorId(creatorId: string, offset: number, limit: number): Promise<{ rows: Product[]; total: number }> {
    const rows = await db.query.products.findMany({
      where: eq(products.creatorId, creatorId),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      offset,
      limit,
    });
    const total = await db.$count(products, eq(products.creatorId, creatorId));
    return { rows, total };
  },

  async findPublished(offset: number, limit: number): Promise<{ rows: Product[]; total: number }> {
    const rows = await db.query.products.findMany({
      where: eq(products.published, true),
      orderBy: (p, { desc }) => [desc(p.createdAt)],
      with: { creator: { columns: { id: true } } },
      offset,
      limit,
    });
    const total = await db.$count(products, eq(products.published, true));
    return { rows, total };
  },

  async findPublishedById(id: string): Promise<Product | undefined> {
    return db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.published, true)),
    });
  },

  async update(id: string, input: Partial<NewProduct>): Promise<Product | undefined> {
    const [row] = await db
      .update(products)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return row;
  },

  async delete(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  },
};
