import { z } from 'zod/v4';

export const AddPayoutMethodSchema = z.object({
  // Raw account number, received once over TLS, encrypted immediately by
  // the service layer, never persisted in plaintext, never logged.
  accountNumber: z.string().min(6).max(34),
  bankCode: z.string().min(1).max(20),
  bankName: z.string().min(1).max(150),
  currency: z.enum(['USD', 'NGN', 'GHS', 'KES']),
});

export type AddPayoutMethodInput = z.infer<typeof AddPayoutMethodSchema>;

export interface AddPayoutMethodServiceInput extends AddPayoutMethodInput {
  fullName: string;
  email: string;
}
