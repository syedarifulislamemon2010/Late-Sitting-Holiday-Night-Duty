import { z } from 'zod';

export const userRoleSchema = z.enum(['ADMIN', 'USER'], {
  message: 'ইউজার রোল অবশ্যই ADMIN অথবা USER হতে হবে।'
});

export const userCreateSchema = z.object({
  username: z.string().min(2, { message: 'ইউজারনেম কমপক্ষে ২ অক্ষরের হতে হবে।' }).trim(),
  name: z.string().min(2, { message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }).trim(),
  password: z.string().min(6, { message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
  role: userRoleSchema.default('USER'),
  cellIds: z.array(z.number()).optional().default([])
});

export const userUpdateSchema = z.object({
  username: z.string().min(2, { message: 'ইউজারনেম কমপক্ষে ২ অক্ষরের হতে হবে।' }).trim().optional(),
  name: z.string().min(2, { message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }).trim().optional(),
  password: z.string().min(6, { message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }).optional(),
  role: userRoleSchema.optional(),
  cellIds: z.array(z.number()).optional()
});
