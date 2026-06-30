import type { FastifyRequest, FastifyReply } from 'fastify';
import { payoutMethodsService } from './payout-methods.service';
import { creatorsService } from '../creators/creators.service';
import type { AddPayoutMethodInput } from './payout-methods.schema';
import { db } from '../../config/db';
import { users } from '../../infra/database/schema';
import { eq } from 'drizzle-orm';

export const payoutMethodsController = {
  async addPayoutMethod(
    request: FastifyRequest<{ Body: AddPayoutMethodInput }>,
    reply: FastifyReply,
  ) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const [user] = await db.select().from(users).where(eq(users.id, request.user!.id));
    const method = await payoutMethodsService.addPayoutMethod(creator.id, {
      ...request.body,
      fullName: user?.name ?? request.user!.email,
      email: request.user!.email,
      phone: request.body.phone ?? '',
    });
    return reply.code(201).send({ data: method });
  },

  async listMyPayoutMethods(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const methods = await payoutMethodsService.listForCreator(creator.id);
    return reply.code(200).send({ data: methods });
  },

  async revoke(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    await payoutMethodsService.revoke(creator.id, request.params.id);
    return reply.code(204).send();
  },
};
