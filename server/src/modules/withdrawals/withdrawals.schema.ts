import { z } from 'zod/v4';

export const RequestWithdrawalSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number with up to 2 decimal places').optional(),
});

export type RequestWithdrawalInput = z.infer<typeof RequestWithdrawalSchema>;
