import { z } from 'zod';

export const dutyTypeSchema = z.enum(['LATE_SITTING', 'HOLIDAY', 'NIGHT_SHIFT'], {
  message: 'invalid_duty_type'
});

export const singleAssignmentSchema = z.object({
  employeeId: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return null;
    return parsed;
  }).refine((val) => val !== null, { message: 'employee_id_required' }),
  type: dutyTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalid_date_format' }),
  description: z.string().nullable().optional()
});

export const dutiesBulkCreateSchema = z.object({
  assignments: z.array(singleAssignmentSchema).min(1, { message: 'assignments_required' }),
  dutiesToDelete: z.array(z.number()).optional(),
  orderRef: z.string().nullable().optional(),
  originalOrderRef: z.string().nullable().optional()
});

export const dutyUpdateSchema = z.object({
  employeeId: z.number().optional(),
  type: dutyTypeSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalid_date_format' }).optional(),
  description: z.string().nullable().optional()
});
