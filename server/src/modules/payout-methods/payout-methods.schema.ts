import { z } from 'zod/v4';

export const PayoutChannelSchema = z.enum(['BANK_ACCOUNT', 'MOBILE_MONEY']);

/**
 * The creator picks an institution from the list we served them, so the client
 * only ever sends its code. The institution NAME is looked up server-side from
 * that same list — a client-supplied bank name is unverifiable and would let a
 * saved method display a bank it does not belong to.
 */
export const AddPayoutMethodSchema = z.object({
  channel: PayoutChannelSchema.default('BANK_ACCOUNT'),
  accountNumber: z.string().min(6).max(34),
  institutionCode: z.string().min(1).max(40),
  currency: z.enum(['USD', 'NGN', 'GHS', 'KES']),
  phone: z.string().min(5).max(20).optional(),
});

export const ListInstitutionsSchema = z.object({
  channel: PayoutChannelSchema.default('BANK_ACCOUNT'),
});

export const ResolveAccountSchema = z.object({
  channel: PayoutChannelSchema.default('BANK_ACCOUNT'),
  accountNumber: z.string().min(6).max(34),
  institutionCode: z.string().min(1).max(40),
});

export type PayoutChannel = z.infer<typeof PayoutChannelSchema>;
export type AddPayoutMethodInput = z.infer<typeof AddPayoutMethodSchema>;
export type ListInstitutionsInput = z.infer<typeof ListInstitutionsSchema>;
export type ResolveAccountInput = z.infer<typeof ResolveAccountSchema>;

export interface AddPayoutMethodServiceInput extends AddPayoutMethodInput {
  fullName: string;
  email: string;
  phone: string;
}
