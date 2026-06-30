import { z } from 'zod/v4';

export const AddPayoutMethodSchema = z.object({
  accountNumber: z.string().min(6).max(34),
  bankCode: z.string().min(1).max(20),
  bankName: z.string().min(1).max(150),
  currency: z.enum(['USD', 'NGN', 'GHS', 'KES']),
  phone: z.string().min(5).max(20).optional(),
});

export type AddPayoutMethodInput = z.infer<typeof AddPayoutMethodSchema>;

export interface AddPayoutMethodServiceInput extends AddPayoutMethodInput {
  fullName: string;
  email: string;
  phone: string;
}
