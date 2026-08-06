import { AfriexSDK, Environment, type TransactionWebhookPayload } from '@afriex/sdk';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

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

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch(resolvedName: string, creatorName: string): boolean {
  const a = normalizeName(resolvedName);
  const b = normalizeName(creatorName);
  return a.length > 0 && a === b;
}

export const afriexClient = {
  async registerRecipient(params: RegisterRecipientParams): Promise<RegisterRecipientResult> {
    const customer = await afriex.customers.create({
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      countryCode: params.countryCode,
    });

    // Resolve the account before trusting it. A payment method is only
    // VERIFIED when Afriex's own account-resolution endpoint returns an
    // account-holder name matching the creator's name on file — creating
    // the payment method alone proves nothing about whether the account
    // number is real or belongs to this creator.
    let verified = false;
    let resolvedAccountName: string | undefined;
    try {
      const resolved = await afriex.paymentMethods.resolveAccount({
        channel: 'BANK_ACCOUNT',
        accountNumber: params.accountNumber,
        institutionCode: params.bankCode,
        countryCode: params.countryCode,
      });
      resolvedAccountName = resolved.recipientName;
      verified = resolvedAccountName ? namesMatch(resolvedAccountName, params.fullName) : false;
    } catch (err) {
      logger.warn(
        { err, accountNumber: params.accountNumber.slice(-4) },
        'Afriex account resolution failed; payout method will be left PENDING',
      );
    }

    const paymentMethod = await afriex.paymentMethods.create({
      channel: 'BANK_ACCOUNT',
      customerId: customer.customerId,
      accountName: resolvedAccountName ?? params.fullName,
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
      verified,
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

  /**
   * Returns the pool balance per currency. Never collapse this into a
   * single total — USD, NGN, GHS, and KES are different units of value,
   * and summing them produces a number with no meaning.
   */
  async getPoolAccountBalances(): Promise<Record<string, string>> {
    const currencies = ['USD', 'NGN', 'GHS', 'KES'];
    const balances = await afriex.balance.getBalance({ currencies });
    return Object.fromEntries(
      Object.entries(balances).map(([currency, amount]) => [currency, amount.toFixed(2)]),
    );
  },
};

export type { RegisterRecipientParams, RegisterRecipientResult, CreateTransferParams, CreateTransferResult, TransactionWebhookPayload };
