import { z } from 'zod/v4';

// successUrl/cancelUrl are further validated against the app origin allowlist
// in ordersService (assertSafeAppRedirectUrl) to block open redirects.
export const CreateCheckoutSessionSchema = z.object({
  productId: z.string().uuid(),
  customerEmail: z.string().email().max(255),
  customerName: z.string().min(1).max(255),
  successUrl: z
    .string()
    .url()
    .max(2048)
    .refine((u) => u.startsWith('https://') || u.startsWith('http://'), {
      message: 'successUrl must be http(s)',
    }),
  cancelUrl: z
    .string()
    .url()
    .max(2048)
    .refine((u) => u.startsWith('https://') || u.startsWith('http://'), {
      message: 'cancelUrl must be http(s)',
    }),
  /** Buyer-selected payment collector. Paystack/Flutterwave primary; Afriex Checkout also allowed. */
  paymentProvider: z.enum(['paystack', 'flutterwave', 'afriex-checkout', 'stripe']).optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
