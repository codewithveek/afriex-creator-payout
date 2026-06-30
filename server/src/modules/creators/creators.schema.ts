import { z } from 'zod/v4';

export const UpdateCreatorProfileSchema = z.object({
  payoutCurrency: z.enum(['USD', 'NGN', 'GHS', 'KES']).optional(),
});

export type UpdateCreatorProfileInput = z.infer<typeof UpdateCreatorProfileSchema>;
