import { z } from 'zod';

export const cellCreateSchema = z.object({
  name: z.string().min(2, { message: 'সেলের নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }).trim(),
  description: z.string().nullable().optional()
});

export const cellUpdateSchema = z.object({
  name: z.string().min(2, { message: 'সেলের নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }).trim().optional(),
  description: z.string().nullable().optional()
});
