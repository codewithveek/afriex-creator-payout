import type { FastifyRequest, FastifyReply } from 'fastify';
import { withdrawalsService } from './withdrawals.service';
import { creatorsService } from '../creators/creators.service';
import type { RequestWithdrawalInput } from './withdrawals.schema';

export const withdrawalsController = {
  async requestWithdrawal(
    request: FastifyRequest<{ Body: RequestWithdrawalInput }>,
    reply: FastifyReply,
  ) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const withdrawal = await withdrawalsService.requestOnDemandWithdrawal(
      creator.id,
      request.body.amount,
    );
    return reply.code(202).send({ data: withdrawal });
  },

  async listMyWithdrawals(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const withdrawals = await withdrawalsService.listForCreator(creator.id);
    return reply.code(200).send({ data: withdrawals });
  },
};
