import type { FastifyRequest, FastifyReply } from 'fastify';
import { ordersService } from './orders.service';
import { creatorsService } from '../creators/creators.service';
import { productsService } from '../products/products.service';
import { listAvailableCollectors } from '../../infra/payment/factory';
import type { CreateCheckoutSessionInput } from './orders.schema';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';
import { NotFoundError } from '../../shared/errors';

export const ordersController = {
  async createCheckoutSession(
    request: FastifyRequest<{ Body: CreateCheckoutSessionInput }>,
    reply: FastifyReply,
  ) {
    const result = await ordersService.createCheckoutSession(request.body);
    return reply.code(201).send({ data: result });
  },

  async listCollectors(_request: FastifyRequest, reply: FastifyReply) {
    return reply.code(200).send({ data: listAvailableCollectors() });
  },

  async getOrderBySession(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply,
  ) {
    const order = await ordersService.getByPaymentSessionId(request.params.sessionId);
    if (!order) throw new NotFoundError('Order not found');

    let productName: string | null = null;
    try {
      const product = await productsService.getById(order.productId);
      productName = product.name;
    } catch {
      // product may have been deleted
    }

    const expired =
      order.downloadTokenExpiresAt != null && order.downloadTokenExpiresAt < new Date();
    const rawToken =
      order.status === 'COMPLETED' && !expired
        ? ordersService.getRawDownloadToken(order)
        : null;

    const payload = {
      id: order.id,
      productId: order.productId,
      productName,
      customerEmail: order.customerEmailPlain,
      customerName: order.customerNamePlain,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      downloadToken: rawToken,
      downloadExpired: order.status === 'COMPLETED' && expired,
      downloadTokenExpiresAt: order.downloadTokenExpiresAt,
      createdAt: order.createdAt,
    };

    return reply.code(200).send({ data: payload });
  },

  async listMyOrders(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await ordersService.listForCreator(
      creator.id,
      (pag.page - 1) * pag.pageSize,
      pag.pageSize,
    );
    return reply.code(200).send({
      data: rows.map((o) => ({
        ...o,
        customerEmail: o.customerEmailPlain,
        customerName: o.customerNamePlain,
        customerEmailPlain: undefined,
        customerNamePlain: undefined,
        downloadTokenEncrypted: undefined,
        downloadTokenHash: undefined,
      })),
      meta: buildPaginationMeta(pag, total),
    });
  },
};
