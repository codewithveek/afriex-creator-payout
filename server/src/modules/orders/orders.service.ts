import crypto from 'node:crypto';
import { getPaymentProvider } from '../../infra/payment/factory';
import { ordersRepository, type Order } from './orders.repository';
import { productsService } from '../products/products.service';
import { NotFoundError } from '../../shared/errors';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import type { PaymentProviderName } from '../../infra/payment/types';

export const ordersService = {
  async createCheckoutSession(input: {
    productId: string;
    customerEmail: string;
    customerName: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; sessionUrl: string }> {
    const product = await productsService.getPublishedById(input.productId);
    const provider = getPaymentProvider(env.PAYMENT_PROVIDER as PaymentProviderName);

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
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        productName: product.name,
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
      { sessionId: result.sessionId, productId: product.id, customerEmail: input.customerEmail },
      'Checkout session created',
    );

    return { sessionId: result.sessionId, sessionUrl: result.sessionUrl };
  },

  async completeOrder(sessionId: string): Promise<void> {
    const order = await ordersRepository.findByPaymentSessionId(sessionId);
    if (!order) {
      logger.warn({ sessionId }, 'No order found for completed payment session');
      return;
    }

    if (order.status !== 'PENDING') {
      logger.info({ orderId: order.id, status: order.status }, 'Order already processed');
      return;
    }

    const downloadToken = crypto.randomBytes(32).toString('hex');
    await ordersRepository.markCompleted(order.id, downloadToken);

    logger.info({ orderId: order.id, sessionId }, 'Order completed');
  },

  async listForCreator(creatorId: string): Promise<Order[]> {
    return ordersRepository.findByCreatorId(creatorId);
  },

  async listForCustomer(email: string): Promise<Order[]> {
    return ordersRepository.findByCustomerEmail(email);
  },

  async verifyDownloadToken(orderId: string, token: string): Promise<Order> {
    const order = await ordersRepository.findById(orderId);
    if (!order || order.downloadToken !== token || order.status !== 'COMPLETED') {
      throw new NotFoundError('Invalid or expired download link');
    }
    return order;
  },
};
