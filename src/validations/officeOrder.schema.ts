import { z } from 'zod';

export const officeOrderCreateSchema = z.object({
  orderRef: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  originalOrderRef: z.string().nullable().optional(),
  orderDate: z.string({ message: 'missing_required_fields' }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalid_date_format' }),
  category: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  employeeName: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  cellName: z.string().nullable().optional(),
  duties: z.array(z.any()).optional(),
  dutyIds: z.array(z.union([z.number(), z.string()])).optional(),
  content: z.record(z.string(), z.any()).nullable().optional()
});

export const officeOrderUpdateSchema = z.object({
  orderRef: z.string().min(1, { message: 'orderRef_required' }),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalid_date_format' }),
  employeeName: z.string().min(1, { message: 'employeeName_required' }),
  cellName: z.string().nullable().optional(),
  status: z.string().nullable().optional()
});
