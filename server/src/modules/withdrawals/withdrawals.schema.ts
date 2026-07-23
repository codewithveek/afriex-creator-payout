import { z } from 'zod/v4';

export const RequestWithdrawalSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number with up to 2 decimal places')
    .optional(),
  /** Withdraw from this currency ledger. Defaults to creator payoutCurrency. */
  currency: z.enum(['USD', 'NGN', 'GHS', 'KES']).optional(),
});

export type RequestWithdrawalInput = z.infer<typeof RequestWithdrawalSchema>;
