import type { FastifyRequest, FastifyReply } from 'fastify';
import { adminService } from './admin.service';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';

// Rewritten to call the service layer instead of touching the DB directly,
// per the architecture guide's layer contract: controllers parse the
// request, call the service, and map to an HTTP response — nothing more.
export const adminController = {
  async listCreators(request: FastifyRequest, reply: FastifyReply) {
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await adminService.listCreators((pag.page - 1) * pag.pageSize, pag.pageSize);
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },

  async listWithdrawals(request: FastifyRequest, reply: FastifyReply) {
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await adminService.listWithdrawals((pag.page - 1) * pag.pageSize, pag.pageSize);
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },

  async listSales(request: FastifyRequest, reply: FastifyReply) {
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await adminService.listSales((pag.page - 1) * pag.pageSize, pag.pageSize);
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },

  async listPoolAccounts(request: FastifyRequest, reply: FastifyReply) {
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await adminService.listPoolAccounts((pag.page - 1) * pag.pageSize, pag.pageSize);
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },

  async triggerScheduledSweep(_request: FastifyRequest, reply: FastifyReply) {
    const result = await adminService.triggerScheduledSweep();
    return reply.code(200).send({ data: result });
  },
};
