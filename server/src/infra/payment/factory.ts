import type { PaymentProvider, PaymentProviderName } from './types';
import { StripeProvider } from './providers/stripe';
import { PaystackProvider } from './providers/paystack';
import { FlutterwaveProvider } from './providers/flutterwave';
import { AfriexCheckoutProvider } from './providers/afriex-checkout';

const providers: Record<PaymentProviderName, () => PaymentProvider> = {
  stripe: () => new StripeProvider(),
  paystack: () => new PaystackProvider(),
  flutterwave: () => new FlutterwaveProvider(),
  'afriex-checkout': () => new AfriexCheckoutProvider(),
};

let cachedProvider: PaymentProvider | null = null;

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
  if (cachedProvider && cachedProvider.name === name) return cachedProvider;
  const factory = providers[name];
  if (!factory) throw new Error(`Unknown payment provider: ${name}`);
  cachedProvider = factory();
  return cachedProvider;
}
