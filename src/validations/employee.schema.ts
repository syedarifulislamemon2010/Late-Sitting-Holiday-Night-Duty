import { z } from 'zod';
import { normalizeBankId, normalizeMobile } from '@/lib/bank-id-helper';

export const employeeCreateSchema = z.object({
  name: z.string({ message: 'name_required' }).trim().min(1, { message: 'name_required' }),
  nameEn: z.string().trim().nullable().optional(),
  designation: z.string({ message: 'designation_required' }).trim().min(1, { message: 'designation_required' }),
  designationEn: z.string().trim().nullable().optional(),
  bankId: z.string().trim().nullable().optional().transform(val => val ? (normalizeBankId(val) || val) : val),
  fileNo: z.string().trim().nullable().optional(),
  mobile: z.string().trim().optional().default('').transform(val => val ? (normalizeMobile(val) || val) : ''),
  cellId: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return null;
    return parsed;
  }).refine((val) => val !== null, { message: 'cell_required' })
});

export const employeeUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  nameEn: z.string().trim().nullable().optional(),
  designation: z.string().trim().min(1).optional(),
  designationEn: z.string().trim().nullable().optional(),
  bankId: z.string().trim().nullable().optional().transform(val => val ? (normalizeBankId(val) || val) : val),
  fileNo: z.string().trim().nullable().optional(),
  mobile: z.string().trim().optional().transform(val => val ? (normalizeMobile(val) || val) : val),
  cellId: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? undefined : parsed;
  }).optional()
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
