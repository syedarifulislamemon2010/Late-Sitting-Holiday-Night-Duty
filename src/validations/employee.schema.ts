import { z } from 'zod';

export const employeeCreateSchema = z.object({
  name: z.string({ message: 'name_required' }).trim().min(1, { message: 'name_required' }),
  designation: z.string({ message: 'designation_required' }).trim().min(1, { message: 'designation_required' }),
  bankId: z.string().trim().nullable().optional(),
  fileNo: z.string().trim().nullable().optional(),
  mobile: z.string().trim().nullable().optional(),
  cellId: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return null;
    return parsed;
  }).refine((val) => val !== null, { message: 'cell_required' })
});

export const employeeUpdateSchema = employeeCreateSchema.partial();
