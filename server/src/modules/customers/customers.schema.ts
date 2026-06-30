import { z } from 'zod/v4';

export const CustomerSignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).max(128),
});

export const CustomerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CustomerSignupInput = z.infer<typeof CustomerSignupSchema>;
export type CustomerLoginInput = z.infer<typeof CustomerLoginSchema>;
