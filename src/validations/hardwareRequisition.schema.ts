import { z } from 'zod';

export const hardwareRequisitionItemSchema = z.object({
  officerUserId: z.number().nullable().optional(),
  officerNameSnapshot: z.string().min(1, { message: 'কর্মকর্তার নাম আবশ্যক।' }).trim(),
  officerDesignationSnapshot: z.string().min(1, { message: 'কর্মকর্তার পদবী আবশ্যক।' }).trim(),
  hardwareLabel: z.string().nullable().optional()
});

export const hardwareRequisitionCreateSchema = z.object({
  requisitionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'তারিখ ফরম্যাট সঠিক নয় (YYYY-MM-DD)।' }),
  hardwareType: z.string().min(1, { message: 'হার্ডওয়্যারের ধরণ আবশ্যক।' }),
  upsAction: z.string().nullable().optional(),
  mode: z.string().default('DIRECT'),
  cellName: z.string().min(1, { message: 'সেলের নাম আবশ্যক।' }),
  subjectLine: z.string().min(3, { message: 'বিষয় আবশ্যক।' }),
  items: z.array(hardwareRequisitionItemSchema).min(1, { message: 'কমপক্ষে একজন কর্মকর্তা ও আইটেম আবশ্যক।' })
});
