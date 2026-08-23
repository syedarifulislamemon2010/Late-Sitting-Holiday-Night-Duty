import { z } from 'zod';

export const holidayCreateSchema = z.object({
  date: z.string().min(1, 'তারিখ আবশ্যক'),
  name: z.string().min(1, 'ছুটির বিবরণ আবশ্যক'),
  isWorkingDay: z.boolean().optional().default(false)
});

export const holidayBulkCreateSchema = z.object({
  holidays: z.array(holidayCreateSchema).min(1, 'কমপক্ষে একটি ছুটি প্রদান করতে হবে')
});

export const holidayParseSchema = z.object({
  text: z.string().optional(),
  fileData: z.string().optional(),
  fileType: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional()
});

export type HolidayCreateInput = z.infer<typeof holidayCreateSchema>;
export type HolidayBulkCreateInput = z.infer<typeof holidayBulkCreateSchema>;
export type HolidayParseInput = z.infer<typeof holidayParseSchema>;
