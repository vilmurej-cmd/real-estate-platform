import { z } from 'zod';

export const clientCreateSchema = z.object({
  type: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  stage: z.string().optional(),
  status: z.string().optional(),
  leadScore: z.number().int().nonnegative().optional(),
  source: z.string().optional(),
  preferences: z.any().optional(),
  notes: z.string().optional()
});

export const clientUpdateSchema = clientCreateSchema.partial();

export const createTransactionSchema = z.object({
  transactionType: z.string().min(1),
  propertyAddress: z.any(),
  listPrice: z.string().optional(),
  finalPrice: z.string().optional(),
  contractDate: z.string().optional(),
  closingDate: z.string().optional(),
  buyerClientId: z.string().uuid().optional(),
  sellerClientId: z.string().uuid().optional(),
  status: z.string().optional()
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const paginationSchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().positive()).optional(),
  limit: z.preprocess((val) => Number(val), z.number().int().positive()).optional()
}).partial();

export type CreateClientDTO = z.infer<typeof clientCreateSchema>;
export type UpdateClientDTO = z.infer<typeof clientUpdateSchema>;
export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDTO = z.infer<typeof updateTransactionSchema>;
