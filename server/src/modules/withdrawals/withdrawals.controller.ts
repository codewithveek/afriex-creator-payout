import type { FastifyRequest, FastifyReply } from 'fastify';
import { withdrawalsService } from './withdrawals.service';
import { creatorsService } from '../creators/creators.service';

export const withdrawalsController = {
  async requestWithdrawal(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const withdrawal = await withdrawalsService.requestOnDemandWithdrawal(creator.id);
    return reply.code(202).send({ data: withdrawal });
  },

  async listMyWithdrawals(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const withdrawals = await withdrawalsService.listForCreator(creator.id);
    return reply.code(200).send({ data: withdrawals });
  },
};
