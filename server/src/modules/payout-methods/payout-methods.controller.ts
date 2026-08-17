import type { FastifyRequest, FastifyReply } from 'fastify';
import { payoutMethodsService } from './payout-methods.service';
import { creatorsService } from '../creators/creators.service';
import type {
  AddPayoutMethodInput,
  ListInstitutionsInput,
  ResolveAccountInput,
} from './payout-methods.schema';
import { db } from '../../config/db';
import { users } from '../../infra/database/schema';
import { eq } from 'drizzle-orm';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';

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
      phone: creator.phone,
    });
    return reply.code(201).send({ data: method });
  },

  async listInstitutions(
    request: FastifyRequest<{ Querystring: ListInstitutionsInput }>,
    reply: FastifyReply,
  ) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const institutions = await payoutMethodsService.listInstitutions(
      creator.id,
      request.query.channel,
    );
    return reply.code(200).send({ data: institutions });
  },

  async resolveAccount(
    request: FastifyRequest<{ Body: ResolveAccountInput }>,
    reply: FastifyReply,
  ) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const result = await payoutMethodsService.resolveAccount(creator.id, request.body);
    return reply.code(200).send({ data: result });
  },

  async listMyPayoutMethods(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await payoutMethodsService.listForCreator(creator.id, (pag.page - 1) * pag.pageSize, pag.pageSize);
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },

  async revoke(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    await payoutMethodsService.revoke(creator.id, request.params.id);
    return reply.code(204).send();
  },
};
