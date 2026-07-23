import crypto from 'node:crypto';
import {
  getPaymentProvider,
  resolveCheckoutProvider,
} from '../../infra/payment/factory';
import { ordersRepository, type Order } from './orders.repository';
import { productsService } from '../products/products.service';
import { customersRepository } from '../customers/customers.repository';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import {
  sendBuyerReceiptEmail,
  sendCreatorSaleEmail,
} from '../../infra/email/email.service';
import { creatorsRepository } from '../creators/creators.repository';
import { db } from '../../config/db';
import { users } from '../../infra/database/schema';
import { eq } from 'drizzle-orm';
import type { PaymentProviderName } from '../../infra/payment/types';
import {
  canServeDownload,
  computeDownloadExpiry,
} from '../../shared/utils/download-token';

function issueDownloadToken(): { token: string; expiresAt: Date } {
  return {
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: computeDownloadExpiry(env.DOWNLOAD_TOKEN_TTL_DAYS),
  };
}

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

    // Link guest checkout to an existing buyer account when email matches
    const existingCustomer = await customersRepository.findByEmail(
      input.customerEmail.trim().toLowerCase(),
    );

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
        ...(existingCustomer ? { customerId: existingCustomer.id } : {}),
      },
    });

    await ordersRepository.create({
      productId: product.id,
      creatorId: product.creatorId,
      customerId: existingCustomer?.id ?? null,
      customerEmail: input.customerEmail.trim().toLowerCase(),
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
        customerId: existingCustomer?.id ?? null,
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

    const { token, expiresAt } = issueDownloadToken();
    await ordersRepository.markCompleted(order.id, token, expiresAt);

    // Re-link customer if they signed up between checkout and payment
    if (!order.customerId) {
      const customer = await customersRepository.findByEmail(order.customerEmail);
      if (customer) {
        await ordersRepository.linkGuestOrdersByEmail(order.customerEmail, customer.id);
      }
    }

    const completed = await ordersRepository.findById(order.id);
    logger.info({ orderId: order.id, sessionId, expiresAt }, 'Order completed');

    void this.sendFulfillmentEmails(completed ?? order, token);

    return completed ?? order;
  },

  async sendFulfillmentEmails(order: Order, downloadToken: string): Promise<void> {
    try {
      const product = await productsService.getById(order.productId).catch(() => null);
      const productName = product?.name ?? 'Your digital product';
      const frontendUrl =
        process.env.FRONTEND_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
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

  async listForCustomerAccount(
    customerId: string,
    email: string,
    offset: number,
    limit: number,
  ) {
    // Ensure any guest purchases with this email are claimed
    await ordersRepository.linkGuestOrdersByEmail(email, customerId);
    return ordersRepository.findByCustomerId(customerId, offset, limit);
  },

  async linkGuestOrders(email: string, customerId: string): Promise<number> {
    const linked = await ordersRepository.linkGuestOrdersByEmail(email, customerId);
    if (linked > 0) {
      logger.info({ email, customerId, linked }, 'Linked guest orders to customer account');
    }
    return linked;
  },

  async verifyDownloadToken(orderId: string, token: string): Promise<Order> {
    const order = await ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Invalid or expired download link');
    }

    // Grandfather legacy rows that completed before expiry column existed
    // (status COMPLETED + token match + null expiry → allow once, then renews get TTL).
    const allowed = canServeDownload({
      status: order.status,
      storedToken: order.downloadToken,
      presentedToken: token,
      expiresAt: order.downloadTokenExpiresAt,
      allowLegacyNoExpiry: true,
    });

    if (!allowed) {
      if (
        order.status === 'COMPLETED' &&
        order.downloadToken === token &&
        order.downloadTokenExpiresAt &&
        order.downloadTokenExpiresAt < new Date()
      ) {
        throw new ValidationError(
          'This download link has expired. Sign in to Your orders to get a new link.',
        );
      }
      throw new NotFoundError('Invalid or expired download link');
    }

    return order;
  },

  /**
   * Issue a fresh download token for a completed order owned by this customer.
   */
  async renewDownloadForCustomer(
    orderId: string,
    customerId: string,
    customerEmail: string,
  ): Promise<{ downloadToken: string; expiresAt: Date }> {
    const order = await ordersRepository.findById(orderId);
    if (!order || order.status !== 'COMPLETED') {
      throw new NotFoundError('Order not found');
    }

    const ownsOrder =
      order.customerId === customerId ||
      order.customerEmail.toLowerCase() === customerEmail.toLowerCase();
    if (!ownsOrder) {
      throw new NotFoundError('Order not found');
    }

    const { token, expiresAt } = issueDownloadToken();
    await ordersRepository.renewDownloadToken(order.id, token, expiresAt);
    return { downloadToken: token, expiresAt };
  },
};
