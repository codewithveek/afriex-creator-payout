import crypto from 'node:crypto';
import {
  getPaymentProvider,
  resolveCheckoutProvider,
} from '../../infra/payment/factory';
import { ordersRepository, type DecryptedOrder } from './orders.repository';
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
import { computeDownloadExpiry } from '../../shared/utils/download-token';
import { assertSafeAppRedirectUrl } from '../../shared/utils/safe-redirect';
import { maskEmail, normalizeEmail } from '../../shared/utils/encryption';

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

    const successUrl = assertSafeAppRedirectUrl(input.successUrl, 'successUrl');
    const cancelUrl = assertSafeAppRedirectUrl(input.cancelUrl, 'cancelUrl');

    const providerName = resolveCheckoutProvider(input.paymentProvider);
    const provider = getPaymentProvider(providerName);
    const creator = await creatorsRepository.findById(product.creatorId);

    const email = normalizeEmail(input.customerEmail);
    const existingCustomer = await customersRepository.findByEmail(email);

    const result = await provider.createCheckoutSession({
      amount: product.price,
      currency: product.currency,
      customerEmail: email,
      customerName: input.customerName,
      successUrl,
      cancelUrl,
      metadata: {
        productId: product.id,
        creatorId: product.creatorId,
        creatorUserId: creator?.userId ?? '',
        customerEmail: email,
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
      customerEmail: email,
      customerName: input.customerName,
      amount: product.price,
      currency: product.currency,
      paymentSessionId: result.sessionId,
    });

    logger.info(
      {
        sessionId: result.sessionId,
        productId: product.id,
        customerEmail: maskEmail(email),
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

  async completeOrder(sessionId: string): Promise<DecryptedOrder | null> {
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

    if (!order.customerId) {
      const customer = await customersRepository.findByEmail(order.customerEmailPlain);
      if (customer) {
        await ordersRepository.linkGuestOrdersByEmail(order.customerEmailPlain, customer.id);
      }
    }

    const completed = await ordersRepository.findById(order.id);
    logger.info({ orderId: order.id, sessionId, expiresAt }, 'Order completed');

    void this.sendFulfillmentEmails(completed ?? order, token);

    return completed ?? order;
  },

  async sendFulfillmentEmails(order: DecryptedOrder, downloadToken: string): Promise<void> {
    try {
      const product = await productsService.getById(order.productId).catch(() => null);
      const productName = product?.name ?? 'Your digital product';
      const frontendUrl = env.FRONTEND_URL || env.BETTER_AUTH_URL || 'http://localhost:3000';
      const downloadUrl = `${frontendUrl}/purchase/success?session=${encodeURIComponent(order.paymentSessionId)}`;

      await sendBuyerReceiptEmail({
        email: order.customerEmailPlain,
        name: order.customerNamePlain,
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
            buyerName: order.customerNamePlain,
            buyerEmail: order.customerEmailPlain,
          });
        }
      }
    } catch (err) {
      logger.error({ err, orderId: order.id }, 'Failed to send fulfillment emails');
    }
  },

  async getByPaymentSessionId(sessionId: string): Promise<DecryptedOrder | null> {
    const order = await ordersRepository.findByPaymentSessionId(sessionId);
    return order ?? null;
  },

  getRawDownloadToken(order: DecryptedOrder): string | null {
    return ordersRepository.getRawDownloadToken(order);
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
    await ordersRepository.linkGuestOrdersByEmail(email, customerId);
    return ordersRepository.findByCustomerId(customerId, offset, limit);
  },

  async linkGuestOrders(email: string, customerId: string): Promise<number> {
    const linked = await ordersRepository.linkGuestOrdersByEmail(email, customerId);
    if (linked > 0) {
      logger.info(
        { email: maskEmail(email), customerId, linked },
        'Linked guest orders to customer account',
      );
    }
    return linked;
  },

  async verifyDownloadToken(orderId: string, token: string): Promise<DecryptedOrder> {
    const order = await ordersRepository.verifyDownloadTokenHash(orderId, token);
    if (!order || order.status !== 'COMPLETED') {
      throw new NotFoundError('Invalid or expired download link');
    }

    if (order.downloadTokenExpiresAt && order.downloadTokenExpiresAt < new Date()) {
      throw new ValidationError(
        'This download link has expired. Sign in to Your orders to get a new link.',
      );
    }

    return order;
  },

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
      order.customerEmailPlain.toLowerCase() === customerEmail.toLowerCase();
    if (!ownsOrder) {
      throw new NotFoundError('Order not found');
    }

    const { token, expiresAt } = issueDownloadToken();
    await ordersRepository.renewDownloadToken(order.id, token, expiresAt);
    return { downloadToken: token, expiresAt };
  },
};
