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


/** The payout destinations we let creators register. */
export type PayoutChannel = 'BANK_ACCOUNT' | 'MOBILE_MONEY';

interface RegisterRecipientParams {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  channel?: PayoutChannel;
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

/**
 * Institutions change rarely but the "choose your bank" dropdown is fetched on
 * every visit to the payout form, so a short in-process cache keeps us from
 * re-asking Afriex for a list that is effectively static.
 */
const INSTITUTIONS_TTL_MS = 30 * 60 * 1000;
const institutionsCache = new Map<string, { expiresAt: number; value: AfriexInstitution[] }>();

export interface AfriexInstitution {
  institutionId: string;
  institutionName: string;
  institutionCode: string;
}

interface ResolveAccountParams {
  channel: PayoutChannel;
  accountNumber: string;
  institutionCode: string;
  countryCode: string;
}

export const afriexClient = {
  /**
   * Banks (or mobile-money providers) that can receive a payout in this
   * country. The creator picks one; we never let them type a bank code.
   */
  async getInstitutions(channel: PayoutChannel, countryCode: string): Promise<AfriexInstitution[]> {
    const key = `${channel}:${countryCode}`;
    const cached = institutionsCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const institutions = await afriex.paymentMethods.getInstitutions({ channel, countryCode });
    const value = institutions.map((i) => ({
      institutionId: i.institutionId,
      institutionName: i.institutionName,
      institutionCode: i.institutionCode,
    }));

    institutionsCache.set(key, { expiresAt: Date.now() + INSTITUTIONS_TTL_MS, value });
    return value;
  },

  /**
   * Asks Afriex who owns an account number. Returns the account-holder name so
   * the creator can confirm it before saving — the same call the registration
   * flow uses to decide VERIFIED vs PENDING.
   */
  async resolveAccount(params: ResolveAccountParams): Promise<{ accountName: string | null }> {
    const resolved = await afriex.paymentMethods.resolveAccount({
      channel: params.channel,
      accountNumber: params.accountNumber,
      institutionCode: params.institutionCode,
      countryCode: params.countryCode,
    });
    return { accountName: resolved.recipientName ?? null };
  },

  async registerRecipient(params: RegisterRecipientParams): Promise<RegisterRecipientResult> {
    const channel = params.channel ?? 'BANK_ACCOUNT';
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
        channel,
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
      channel,
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
