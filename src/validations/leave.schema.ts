import { z } from 'zod';

export const leaveCreateSchema = z.object({
  leaveType: z.string({ message: 'missing_required_fields' }).min(1, { message: 'missing_required_fields' }),
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
  delegateId: z.string().nullable().optional(),
  casualTotal: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  casualUsed: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  ordinaryTotal: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  ordinaryUsed: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  specialTotal: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val),
  specialUsed: z.union([z.number(), z.string()]).optional().default(0).transform((val) => typeof val === 'string' ? parseInt(val, 10) || 0 : val)
});
