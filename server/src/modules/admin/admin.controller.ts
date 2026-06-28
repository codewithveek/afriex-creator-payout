import type { FastifyRequest, FastifyReply } from 'fastify';
import { adminService } from './admin.service';

// Rewritten to call the service layer instead of touching the DB directly,
// per the architecture guide's layer contract: controllers parse the
// request, call the service, and map to an HTTP response — nothing more.
export const adminController = {
  async listCreators(_request: FastifyRequest, reply: FastifyReply) {
    const rows = await adminService.listCreators();
    return reply.code(200).send({ data: rows });
  },

  async listWithdrawals(_request: FastifyRequest, reply: FastifyReply) {
    const rows = await adminService.listWithdrawals();
    return reply.code(200).send({ data: rows });
  },

  async listSales(_request: FastifyRequest, reply: FastifyReply) {
    const rows = await adminService.listSales();
    return reply.code(200).send({ data: rows });
  },

  async listPoolAccounts(_request: FastifyRequest, reply: FastifyReply) {
    const rows = await adminService.listPoolAccounts();
    return reply.code(200).send({ data: rows });
  },

  async triggerScheduledSweep(_request: FastifyRequest, reply: FastifyReply) {
    const result = await adminService.triggerScheduledSweep();
    return reply.code(200).send({ data: result });
  },
};
