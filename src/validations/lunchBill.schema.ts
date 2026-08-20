import { z } from 'zod';

export const lunchBillCreateSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'মাস-বছর YYYY-MM ফরম্যাটে হতে হবে'),
  cellId: z.number().int().positive('সেল নির্বাচন আবশ্যক'),
  orderDate: z.string().min(1, 'তারিখ আবশ্যক'),
  details: z.string().min(1, 'বিল বিবরণ আবশ্যক'),
  executiveId: z.number().int().optional().nullable(),
  signatoryName: z.string().optional().nullable(),
  signatoryDesignation: z.string().optional().nullable(),
  totalAmount: z.number().nonnegative().optional()
});

export const lunchBillUpdateSchema = lunchBillCreateSchema.partial();

export type LunchBillCreateInput = z.infer<typeof lunchBillCreateSchema>;
export type LunchBillUpdateInput = z.infer<typeof lunchBillUpdateSchema>;
