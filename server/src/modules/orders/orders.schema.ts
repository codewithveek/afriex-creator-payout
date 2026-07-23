import { z } from 'zod/v4';

export const CreateCheckoutSessionSchema = z.object({
  productId: z.string().uuid(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(255),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  /** Buyer-selected payment collector. Paystack/Flutterwave primary; Afriex Checkout also allowed. */
  paymentProvider: z.enum(['paystack', 'flutterwave', 'afriex-checkout', 'stripe']).optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
