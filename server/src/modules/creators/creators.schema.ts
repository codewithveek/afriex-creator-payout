import { z } from 'zod/v4';

export const UpdateCreatorProfileSchema = z.object({
  payoutCurrency: z.enum(['USD', 'NGN', 'GHS', 'KES']).optional(),
  phone: z.string().min(1).max(20).optional(),
  country: z.string().length(2).optional(),
});

export type UpdateCreatorProfileInput = z.infer<typeof UpdateCreatorProfileSchema>;
