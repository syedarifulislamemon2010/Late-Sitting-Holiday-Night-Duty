import { z } from 'zod';

export const executiveCreateSchema = z.object({
  name: z.string().min(1, 'নির্বাহীর নাম আবশ্যক'),
  designation: z.string().min(1, 'পদবি আবশ্যক'),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  bankId: z.string().optional().nullable(),
  fileNo: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0)
});

export const executiveUpdateSchema = z.object({
  name: z.string().min(1, 'নির্বাহীর নাম আবশ্যক').optional(),
  designation: z.string().min(1, 'পদবি আবশ্যক').optional(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  bankId: z.string().optional().nullable(),
  fileNo: z.string().optional().nullable(),
  sortOrder: z.number().int().optional()
});

export type ExecutiveCreateInput = z.infer<typeof executiveCreateSchema>;
export type ExecutiveUpdateInput = z.infer<typeof executiveUpdateSchema>;
