import { AfriexSDK, Environment, type TransactionWebhookPayload } from '@afriex/sdk';
import { env } from '../../config/env';

const environment = env.AFRIEX_ENVIRONMENT === 'staging' ? Environment.STAGING : Environment.PRODUCTION;

export const afriex = new AfriexSDK({
  apiKey: env.AFRIEX_API_KEY,
  environment,
  webhookPublicKey: env.AFRIEX_WEBHOOK_PUBLIC_KEY,
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
});


interface RegisterRecipientParams {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

interface RegisterRecipientResult {
  afriexCustomerId: string;
  afriexPaymentMethodId: string;
  verified: boolean;
}

interface CreateTransferParams {
  customerId: string;
  paymentMethodId: string;
  amount: string;
  currency: string;
  idempotencyKey: string;
}

interface CreateTransferResult {
  afriexTransactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

function mapTransactionStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' {
  if (status === 'COMPLETED' || status === 'SUCCESS') return 'COMPLETED';
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'REJECTED') return 'FAILED';
  return 'PENDING';
}

export const afriexClient = {
  async registerRecipient(params: RegisterRecipientParams): Promise<RegisterRecipientResult> {
    const customer = await afriex.customers.create({
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      countryCode: params.countryCode,
    });

    const paymentMethod = await afriex.paymentMethods.create({
      channel: 'BANK_ACCOUNT',
      customerId: customer.customerId,
      accountName: params.fullName,
      accountNumber: params.accountNumber,
      countryCode: params.countryCode,
      institution: {
        institutionCode: params.bankCode,
        institutionName: params.bankName,
      },
    });

    return {
      afriexCustomerId: customer.customerId,
      afriexPaymentMethodId: paymentMethod.paymentMethodId,
      verified: true,
    };
  },

  async createTransfer(params: CreateTransferParams): Promise<CreateTransferResult> {
    const transaction = await afriex.transactions.create({
      type: 'WITHDRAW',
      customerId: params.customerId,
      destinationId: params.paymentMethodId,
      sourceAmount: params.amount as `${number}`,
      sourceCurrency: params.currency,
      destinationCurrency: params.currency,
      destinationAmount: params.amount as `${number}`,
      meta: {
        idempotencyKey: params.idempotencyKey,
        reference: params.idempotencyKey,
      },
    });

    return {
      afriexTransactionId: transaction.transactionId,
      status: mapTransactionStatus(transaction.status),
    };
  },

  async getPoolAccountBalance(_afriexAccountId: string): Promise<{ balance: string }> {
    const currencies = ['USD', 'NGN', 'GHS', 'KES'];
    const balances = await afriex.balance.getBalance({ currencies });
    const total = Object.values(balances).reduce((sum, b) => sum + b, 0);
    return { balance: String(total) };
  },
};

export type { RegisterRecipientParams, RegisterRecipientResult, CreateTransferParams, CreateTransferResult, TransactionWebhookPayload };
