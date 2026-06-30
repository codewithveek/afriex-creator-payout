import type { FastifyRequest, FastifyReply } from 'fastify';
import { creatorsService, type UpdateCreatorProfile } from './creators.service';
import { UpdateCreatorProfileSchema } from './creators.schema';

export const creatorsController = {
  async getMyProfile(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    return reply.code(200).send({ data: creator });
  },

  async updateMyProfile(request: FastifyRequest<{ Body: UpdateCreatorProfile }>, reply: FastifyReply) {
    const data = UpdateCreatorProfileSchema.parse(request.body);
    const creator = await creatorsService.updateProfile(request.user!.id, data);
    return reply.code(200).send({ data: creator });
  },
};
