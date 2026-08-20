import { z } from 'zod';

export const leaveTypeSchema = z.enum(['POST_FACTO', 'STATION_LEAVE', 'CASUAL']);

export const leaveCreateSchema = z.object({
  leaveType: leaveTypeSchema,
  startDate: z.string({ message: 'missing_required_fields' }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalid_date_format' }),
  endDate: z.string({ message: 'missing_required_fields' }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalid_date_format' }),
  applicationDate: z.string({ message: 'missing_required_fields' }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalid_date_format' }),
  applicantName: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  designation: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  bankId: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  fileNo: z.string().nullable().optional(),
  cellName: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  leaveLocation: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  mobileNo: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
  selectedDistrict: z.string().nullable().optional(),
  delegateId: z.union([z.string(), z.number()]).nullable().optional().transform((val) => {
    if (val === null || val === undefined) return null;
    return String(val);
  }),
  casualTotal: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  casualUsed: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  ordinaryTotal: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  ordinaryUsed: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  specialTotal: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  specialUsed: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val)
});

export const leaveUpdateSchema = leaveCreateSchema.partial();

export const leaveLogResolveSchema = z.object({
  bankId: z.string().optional(),
  applicantName: z.string().optional(),
  reason: z.string().optional()
});

export type LeaveCreateInput = z.infer<typeof leaveCreateSchema>;
export type LeaveUpdateInput = z.infer<typeof leaveUpdateSchema>;
export type LeaveLogResolveInput = z.infer<typeof leaveLogResolveSchema>;
