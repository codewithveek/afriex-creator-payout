import crypto from 'node:crypto';
import {
  getPaymentProvider,
  resolveCheckoutProvider,
} from '../../infra/payment/factory';
import { ordersRepository, type Order } from './orders.repository';
import { productsService } from '../products/products.service';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../config/logger';
import {
  sendBuyerReceiptEmail,
  sendCreatorSaleEmail,
} from '../../infra/email/email.service';
import { creatorsRepository } from '../creators/creators.repository';
import { db } from '../../config/db';
import { users } from '../../infra/database/schema';
import { eq } from 'drizzle-orm';
import type { PaymentProviderName } from '../../infra/payment/types';

export const ordersService = {
  async createCheckoutSession(input: {
    productId: string;
    customerEmail: string;
    customerName: string;
    successUrl: string;
    cancelUrl: string;
    paymentProvider?: PaymentProviderName;
  }): Promise<{ sessionId: string; sessionUrl: string; provider: string }> {
    const product = await productsService.getPublishedById(input.productId);

    if (!product.fileUrl) {
      throw new ValidationError('This product is not ready for sale yet (missing download file)');
    }

    const providerName = resolveCheckoutProvider(input.paymentProvider);
    const provider = getPaymentProvider(providerName);
    const creator = await creatorsRepository.findById(product.creatorId);

    const result = await provider.createCheckoutSession({
      amount: product.price,
      currency: product.currency,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: {
        productId: product.id,
        creatorId: product.creatorId,
        creatorUserId: creator?.userId ?? '',
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        productName: product.name,
        paymentProvider: providerName,
      },
    });

    await ordersRepository.create({
      productId: product.id,
      creatorId: product.creatorId,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      amount: product.price,
      currency: product.currency,
      paymentSessionId: result.sessionId,
    });

    logger.info(
      {
        sessionId: result.sessionId,
        productId: product.id,
        customerEmail: input.customerEmail,
        provider: providerName,
      },
      'Checkout session created',
    );

    return {
      sessionId: result.sessionId,
      sessionUrl: result.sessionUrl,
      provider: providerName,
    };
  },

  async completeOrder(sessionId: string): Promise<Order | null> {
    const order = await ordersRepository.findByPaymentSessionId(sessionId);
    if (!order) {
      logger.warn({ sessionId }, 'No order found for completed payment session');
      return null;
    }

    if (order.status !== 'PENDING') {
      logger.info({ orderId: order.id, status: order.status }, 'Order already processed');
      return order;
    }

    const downloadToken = crypto.randomBytes(32).toString('hex');
    await ordersRepository.markCompleted(order.id, downloadToken);

    const completed = await ordersRepository.findById(order.id);
    logger.info({ orderId: order.id, sessionId }, 'Order completed');

    // Fire-and-forget transactional emails
    void this.sendFulfillmentEmails(completed ?? order, downloadToken);

    return completed ?? order;
  },

  async sendFulfillmentEmails(order: Order, downloadToken: string): Promise<void> {
    try {
      const product = await productsService.getById(order.productId).catch(() => null);
      const productName = product?.name ?? 'Your digital product';
      const frontendUrl = process.env.FRONTEND_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
      const downloadUrl = `${frontendUrl}/purchase/success?session=${encodeURIComponent(order.paymentSessionId)}`;

      await sendBuyerReceiptEmail({
        email: order.customerEmail,
        name: order.customerName,
        productName,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
        downloadUrl,
      });

      const creator = await creatorsRepository.findById(order.creatorId);
      if (creator) {
        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, creator.userId))
          .limit(1);
        if (user) {
          await sendCreatorSaleEmail({
            email: user.email,
            name: user.name,
            productName,
            amount: order.amount,
            currency: order.currency,
            buyerName: order.customerName,
            buyerEmail: order.customerEmail,
          });
        }
      }
    } catch (err) {
      logger.error({ err, orderId: order.id }, 'Failed to send fulfillment emails');
    }
  },

  async getByPaymentSessionId(sessionId: string): Promise<Order | null> {
    const order = await ordersRepository.findByPaymentSessionId(sessionId);
    return order ?? null;
  },

  async listForCreator(creatorId: string, offset: number, limit: number) {
    return ordersRepository.findByCreatorId(creatorId, offset, limit);
  },

  async listForCustomer(email: string, offset: number, limit: number) {
    return ordersRepository.findByCustomerEmail(email, offset, limit);
  },

  async verifyDownloadToken(orderId: string, token: string): Promise<Order> {
    const order = await ordersRepository.findById(orderId);
    if (!order || order.downloadToken !== token || order.status !== 'COMPLETED') {
      throw new NotFoundError('Invalid or expired download link');
    }
    return order;
  },
};
