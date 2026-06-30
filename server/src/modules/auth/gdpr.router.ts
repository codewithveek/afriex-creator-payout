import type { FastifyInstance } from 'fastify';
import { auth } from './auth.config';
import { db } from '../../config/db';
import { creators, earnings, payoutMethods, sales, withdrawals } from '../../infra/database/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../config/logger';
import { sendDataExport } from '../../infra/email/email.service';

export async function gdprRoutes(fastify: FastifyInstance) {
  fastify.delete('/api/account', async (request, reply) => {
    const session = await auth.api.getSession({ headers: request.headers as unknown as Headers });
    if (!session?.user) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Not signed in' } });
    }

    const userId = session.user.id;

    await db.transaction(async (tx) => {
      const creator = await tx.query.creators.findFirst({
        where: (table, { eq: eqOp }) => eqOp(table.userId, userId),
      });

      if (creator) {
        await tx.delete(withdrawals).where(eq(withdrawals.creatorId, creator.id));
        await tx.delete(earnings).where(eq(earnings.creatorId, creator.id));
        await tx.delete(sales).where(eq(sales.creatorId, creator.id));
        await tx.delete(payoutMethods).where(eq(payoutMethods.creatorId, creator.id));
        await tx.delete(creators).where(eq(creators.userId, userId));
      }

      await tx.delete(sales).where(eq(sales.creatorId, userId));
    });

    logger.info({ userId }, 'Account deleted per GDPR right to erasure');
    return reply.code(200).send({ data: { message: 'Account deleted successfully' } });
  });

  fastify.get('/api/account/export', async (request, reply) => {
    const session = await auth.api.getSession({ headers: request.headers as unknown as Headers });
    if (!session?.user) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Not signed in' } });
    }

    const userId = session.user.id;
    const creator = await db.query.creators.findFirst({
      where: (table, { eq: eqOp }) => eqOp(table.userId, userId),
    });

    const data: Record<string, unknown> = {
      user: {
        id: userId,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as unknown as { role: string }).role,
      },
    };

    if (creator) {
      data.creator = creator;
      data.payoutMethods = await db.query.payoutMethods.findMany({
        where: (table, { eq: eqOp }) => eqOp(table.creatorId, creator.id),
      });
      data.sales = await db.query.sales.findMany({
        where: (table, { eq: eqOp }) => eqOp(table.creatorId, creator.id),
      });
      data.earnings = await db.query.earnings.findMany({
        where: (table, { eq: eqOp }) => eqOp(table.creatorId, creator.id),
      });
      data.withdrawals = await db.query.withdrawals.findMany({
        where: (table, { eq: eqOp }) => eqOp(table.creatorId, creator.id),
      });
    }

    await sendDataExport({
      user: { id: userId, email: session.user.email, name: session.user.name },
      data,
    });

    logger.info({ userId }, 'Data export sent per GDPR right to data portability');
    return reply.code(200).send({ data: { message: 'Data export sent to your email' } });
  });
}
