import type { FastifyRequest, FastifyReply } from 'fastify';
import { customersService } from './customers.service';
import type { CustomerSignupInput, CustomerLoginInput } from './customers.schema';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';

function sanitizeOrder(order: Record<string, unknown>) {
  const product = order.product as Record<string, unknown> | undefined;
  if (!product) return order;
  // Never leak permanent file storage URLs to the client
  const { fileUrl: _f, ...safeProduct } = product;
  return { ...order, product: safeProduct };
}

export const customersController = {
  async signup(request: FastifyRequest<{ Body: CustomerSignupInput }>, reply: FastifyReply) {
    const customer = await customersService.signup(request.body);
    return reply.code(201).send({
      data: { id: customer.id, email: customer.email, name: customer.name },
    });
  },

  async login(request: FastifyRequest<{ Body: CustomerLoginInput }>, reply: FastifyReply) {
    const result = await customersService.login(request.body);
    return reply.code(200).send({
      data: {
        id: result.id,
        email: result.email,
        name: result.name,
        token: result.token,
        linkedOrders: result.linkedOrders,
      },
    });
  },

  async myOrders(request: FastifyRequest, reply: FastifyReply) {
    const customer = request.customer!;
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await customersService.getOrders(
      customer.id,
      customer.email,
      (pag.page - 1) * pag.pageSize,
      pag.pageSize,
    );

    const data = rows.map((row) => {
      const sanitized = sanitizeOrder(row as unknown as Record<string, unknown>);
      const expiresAt = row.downloadTokenExpiresAt;
      const expired = expiresAt ? expiresAt < new Date() : false;
      return {
        ...sanitized,
        downloadToken: expired ? null : row.downloadToken,
        downloadExpired: expired,
        downloadTokenExpiresAt: expiresAt,
      };
    });

    return reply.code(200).send({ data, meta: buildPaginationMeta(pag, total) });
  },

  async renewDownload(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    const customer = request.customer!;
    const result = await customersService.renewDownload(
      customer.id,
      customer.email,
      request.params.orderId,
    );
    return reply.code(200).send({
      data: {
        downloadToken: result.downloadToken,
        expiresAt: result.expiresAt,
      },
    });
  },
};
