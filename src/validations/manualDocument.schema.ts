import { z } from 'zod';

export const manualDocumentCreateSchema = z.object({
  name: z.string().min(1, 'ফাইলের নাম আবশ্যক'),
  filePath: z.string().min(1, 'ফাইলের পাথ আবশ্যক'),
  fileSize: z.number().int().nonnegative('ফাইলের আকার সঠিক নয়'),
  fileType: z.string().min(1, 'ফাইলের ধরন আবশ্যক'),
  isVisibleToUsers: z.boolean().optional().default(true)
});

export const manualDocumentUpdateSchema = z.object({
  name: z.string().min(1, 'ফাইলের নাম আবশ্যক').optional(),
  isVisibleToUsers: z.boolean().optional()
});

export const fileUploadMetadataSchema = z.object({
  name: z.string().optional()
});

export const documentDeleteSchema = z.object({
  id: z.union([z.number(), z.string().min(1, 'আইডি আবশ্যক')])
});

export type ManualDocumentCreateInput = z.infer<typeof manualDocumentCreateSchema>;
export type ManualDocumentUpdateInput = z.infer<typeof manualDocumentUpdateSchema>;
export type FileUploadMetadataInput = z.infer<typeof fileUploadMetadataSchema>;
export type DocumentDeleteInput = z.infer<typeof documentDeleteSchema>;
