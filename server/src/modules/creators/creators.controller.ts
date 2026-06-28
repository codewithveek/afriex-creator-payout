import type { FastifyRequest, FastifyReply } from 'fastify';
import { creatorsService } from './creators.service';

export const creatorsController = {
  // 4 lines. Parses request, calls service, maps to response — nothing more.
  async getMyProfile(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    return reply.code(200).send({ data: creator });
  },
};
