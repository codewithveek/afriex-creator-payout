import type { FastifyRequest, FastifyReply } from 'fastify';
import { withdrawalsService } from './withdrawals.service';
import { creatorsService } from '../creators/creators.service';
import type { RequestWithdrawalInput } from './withdrawals.schema';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';

export const withdrawalsController = {
  async requestWithdrawal(
    request: FastifyRequest<{ Body: RequestWithdrawalInput }>,
    reply: FastifyReply,
  ) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const withdrawal = await withdrawalsService.requestOnDemandWithdrawal(
      creator.id,
      request.body.amount,
      request.body.currency,
    );
    return reply.code(202).send({ data: withdrawal });
  },

  async listMyWithdrawals(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await withdrawalsService.listForCreator(
      creator.id,
      (pag.page - 1) * pag.pageSize,
      pag.pageSize,
    );
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },
};
