import type { FastifyRequest, FastifyReply } from 'fastify';
import { customersService } from './customers.service';
import type { CustomerSignupInput, CustomerLoginInput } from './customers.schema';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';
import { ordersService } from '../orders/orders.service';

function sanitizeProduct(product: Record<string, unknown> | undefined) {
  if (!product) return undefined;
  const { fileUrl: _f, ...safe } = product;
  return safe;
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

  /** Lets the browser check whether a stored buyer token is still good. */
  async me(request: FastifyRequest, reply: FastifyReply) {
    const customer = request.customer!;
    return reply.code(200).send({
      data: { id: customer.id, email: customer.email, name: customer.name },
    });
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    await customersService.logout(request.customer!.id);
    return reply.code(204).send();
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
      const expired =
        row.downloadTokenExpiresAt != null && row.downloadTokenExpiresAt < new Date();
      const rawToken =
        row.status === 'COMPLETED' && !expired
          ? ordersService.getRawDownloadToken(row)
          : null;
      const product = (row as { product?: Record<string, unknown> }).product;

      return {
        id: row.id,
        productId: row.productId,
        creatorId: row.creatorId,
        customerId: row.customerId,
        customerEmail: row.customerEmailPlain,
        customerName: row.customerNamePlain,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        paymentSessionId: row.paymentSessionId,
        downloadToken: rawToken,
        downloadExpired: row.status === 'COMPLETED' && expired,
        downloadTokenExpiresAt: row.downloadTokenExpiresAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        product: sanitizeProduct(product),
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
