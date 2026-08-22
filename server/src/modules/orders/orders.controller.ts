import type { FastifyRequest, FastifyReply } from 'fastify';
import { ordersService } from './orders.service';
import { creatorsService } from '../creators/creators.service';
import { productsService } from '../products/products.service';
import { listAvailableCollectors } from '../../infra/payment/factory';
import type { CreateCheckoutSessionInput } from './orders.schema';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';
import { NotFoundError } from '../../shared/errors';

/** Buyers never see the creator's source file URL. */
function sanitizeProduct(product: Record<string, unknown> | undefined) {
  if (!product) return undefined;
  const { fileUrl: _fileUrl, ...safe } = product;
  return safe;
}

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

  /** The signed-in account's purchases — its library. */
  async listMyPurchases(request: FastifyRequest, reply: FastifyReply) {
    const { id: userId, email } = request.user!;
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await ordersService.listForBuyer(
      userId,
      email,
      (pag.page - 1) * pag.pageSize,
      pag.pageSize,
    );

    const data = rows.map((row) => {
      const expired =
        row.downloadTokenExpiresAt != null && row.downloadTokenExpiresAt < new Date();
      const rawToken =
        row.status === 'COMPLETED' && !expired ? ordersService.getRawDownloadToken(row) : null;
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

  async renewPurchaseDownload(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply,
  ) {
    const { id: userId, email } = request.user!;
    const result = await ordersService.renewDownloadForBuyer(
      request.params.orderId,
      userId,
      email,
    );
    return reply.code(200).send({
      data: { downloadToken: result.downloadToken, expiresAt: result.expiresAt },
    });
  },

  /** Orders placed *with* the signed-in creator — their sales. */
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
