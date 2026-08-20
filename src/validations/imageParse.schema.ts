import { z } from 'zod';

export const imageParseSchema = z.object({
  image: z.string().min(1, 'ইমেজ ডাটা আবশ্যক'),
  mimeType: z.string().optional()
});

export const rosterImageParseFormSchema = z.object({
  dutyType: z.enum(['LATE_SITTING', 'HOLIDAY', 'NIGHT_SHIFT'], {
    message: 'সঠিক ডিউটি টাইপ নির্বাচন করুন'
  }),
  cellId: z.number().int().positive('সঠিক সেল আইডি নির্বাচন করুন')
});

export type ImageParseInput = z.infer<typeof imageParseSchema>;
export type RosterImageParseFormInput = z.infer<typeof rosterImageParseFormSchema>;
