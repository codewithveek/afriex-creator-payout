import crypto from 'node:crypto';
import { ordersRepository, type Order } from './orders.repository';
import { productsService } from '../products/products.service';
import { creatorsService } from '../creators/creators.service';
import { stripeClient } from '../../infra/stripe/stripe-client';
import { NotFoundError } from '../../shared/errors';
import { logger } from '../../config/logger';

export const ordersService = {
  async createCheckoutSession(input: {
    productId: string;
    customerEmail: string;
    customerName: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; sessionUrl: string }> {
    const product = await productsService.getPublishedById(input.productId);

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency: product.currency.toLowerCase(),
            product_data: { name: product.name },
            unit_amount: Math.round(Number.parseFloat(product.price) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        productId: product.id,
        creatorId: product.creatorId,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
      },
    });

    if (!session.id || !session.url) {
      throw new Error('Failed to create Stripe Checkout session');
    }

    await ordersRepository.create({
      productId: product.id,
      creatorId: product.creatorId,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      amount: product.price,
      currency: product.currency,
      stripeSessionId: session.id,
    });

    logger.info(
      { sessionId: session.id, productId: product.id, customerEmail: input.customerEmail },
      'Checkout session created',
    );

    return { sessionId: session.id, sessionUrl: session.url };
  },

  async completeOrder(sessionId: string): Promise<void> {
    const order = await ordersRepository.findByStripeSessionId(sessionId);
    if (!order) {
      logger.warn({ sessionId }, 'No order found for completed Stripe session');
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
