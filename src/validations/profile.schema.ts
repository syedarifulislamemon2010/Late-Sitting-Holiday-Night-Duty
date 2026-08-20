import { z } from 'zod';

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'নাম আবশ্যক').optional(),
  mobile: z.string().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(4, 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে').optional()
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
