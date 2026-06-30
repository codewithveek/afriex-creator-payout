import { z } from 'zod/v4';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(10000).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.enum(['USD', 'NGN', 'GHS', 'KES']).default('USD'),
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.string().max(20).optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  currency: z.enum(['USD', 'NGN', 'GHS', 'KES']).optional(),
  published: z.boolean().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.string().max(20).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
