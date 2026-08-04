import type { PaymentProvider, PaymentProviderName } from './types';
import { StripeProvider } from './providers/stripe';
import { PaystackProvider } from './providers/paystack';
import { FlutterwaveProvider } from './providers/flutterwave';
import { AfriexCheckoutProvider } from './providers/afriex-checkout';
import { env } from '../../config/env';

const providers: Record<PaymentProviderName, () => PaymentProvider> = {
  stripe: () => new StripeProvider(),
  paystack: () => new PaystackProvider(),
  flutterwave: () => new FlutterwaveProvider(),
  'afriex-checkout': () => new AfriexCheckoutProvider(),
};

const instanceCache = new Map<PaymentProviderName, PaymentProvider>();

/**
 * Collectors buyers can choose at checkout, in fallback preference order.
 * Creator payouts always go through Afriex disbursement (separate path).
 */
export const SELECTABLE_COLLECTORS: PaymentProviderName[] = [
  'afriex-checkout',
  'paystack',
  'flutterwave',
];

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
  const cached = instanceCache.get(name);
  if (cached) return cached;
  const factory = providers[name];
  if (!factory) throw new Error(`Unknown payment provider: ${name}`);
  const instance = factory();
  instanceCache.set(name, instance);
  return instance;
}

export function isCollectorAvailable(name: PaymentProviderName): boolean {
  if (name === 'paystack') return Boolean(env.PAYSTACK_SECRET_KEY);
  if (name === 'flutterwave') return Boolean(env.FLUTTERWAVE_SECRET_KEY);
  if (name === 'stripe') return Boolean(env.STRIPE_SECRET_KEY);
  if (name === 'afriex-checkout') return Boolean(env.AFRIEX_API_KEY);
  return false;
}

/**
 * Collectors exposed to buyers. Afriex Checkout is primary and default;
 * Paystack and Flutterwave are also selectable. Falls back to full catalog
 * when no keys are configured (dev convenience).
 */
export function listAvailableCollectors(): Array<{
  id: PaymentProviderName;
  name: string;
  description: string;
  primary: boolean;
}> {
  const catalog: Array<{
    id: PaymentProviderName;
    name: string;
    description: string;
    primary: boolean;
  }> = [
    {
      id: 'afriex-checkout',
      name: 'Afriex Checkout',
      description: 'Hosted checkout via Afriex (virtual bank account & mobile money)',
      primary: true,
    },
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'Cards, bank transfer, USSD, and mobile money across Africa',
      primary: false,
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Cards, bank, and mobile money in 30+ African markets',
      primary: false,
    },
  ];

  const available = catalog.filter((c) => isCollectorAvailable(c.id));
  if (available.length > 0) return available;

  // Dev fallback: surface all selectable collectors so UI can render
  return catalog;
}

export function resolveCheckoutProvider(
  requested?: PaymentProviderName | null,
): PaymentProviderName {
  if (requested && SELECTABLE_COLLECTORS.includes(requested) && isCollectorAvailable(requested)) {
    return requested;
  }

  // Prefer Afriex Checkout first, then the other selectable collectors
  for (const name of SELECTABLE_COLLECTORS) {
    if (isCollectorAvailable(name)) return name;
  }

  const fallback = env.PAYMENT_PROVIDER as PaymentProviderName;
  if (isCollectorAvailable(fallback)) return fallback;

  return 'afriex-checkout';
}
