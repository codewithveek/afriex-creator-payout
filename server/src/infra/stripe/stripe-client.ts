import Stripe from 'stripe';
import { env } from '../../config/env';

function getStripeClient(): Stripe {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set but Stripe was initialized');
  return new Stripe(key);
}

export const stripeClient = getStripeClient();
