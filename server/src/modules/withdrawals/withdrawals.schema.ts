import { z } from 'zod/v4';

// On-demand withdrawal takes no body — it always withdraws the creator's
// full available balance to their verified payout method. Kept as an empty
// schema (rather than skipping validation) so the route's contract is
// explicit and easy to extend later (e.g. a partial-amount withdrawal).
export const RequestWithdrawalSchema = z.object({}).strict();

export type RequestWithdrawalInput = z.infer<typeof RequestWithdrawalSchema>;
