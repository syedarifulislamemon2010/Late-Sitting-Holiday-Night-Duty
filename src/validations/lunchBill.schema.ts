import { z } from 'zod';

export const lunchBillCreateSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, 'মাস-বছর YYYY-MM ফরম্যাটে হতে হবে').optional(),
  month: z.string().optional(),
  cellId: z.number().int().positive('সেল নির্বাচন আবশ্যক').optional(),
  orderDate: z.string().optional(),
  details: z.string().optional(),
  executiveId: z.number().int().optional().nullable(),
  signatoryName: z.string().optional().nullable(),
  signatoryDesignation: z.string().optional().nullable(),
  totalAmount: z.number().nonnegative().optional()
});

export const lunchBillUpdateSchema = lunchBillCreateSchema.partial();

export const lunchBillRecordSchema = z.object({
  employeeId: z.number().int(),
  name: z.string(),
  designation: z.string(),
  cellId: z.number().int(),
  isExecutive: z.boolean(),
  dutiesCount: z.number().optional()
});

export const lunchBillSaveFormSchema = z.object({
  month: z.string().min(1, 'মাস নির্বাচন আবশ্যক'),
  workingDays: z.union([z.number(), z.string()]).transform((val) => typeof val === 'string' ? parseInt(val, 10) : val),
  records: z.array(z.any()).min(0)
});

export type LunchBillCreateInput = z.infer<typeof lunchBillCreateSchema>;
export type LunchBillUpdateInput = z.infer<typeof lunchBillUpdateSchema>;
export type LunchBillSaveFormInput = z.infer<typeof lunchBillSaveFormSchema>;
