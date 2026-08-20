import { z } from 'zod';

export const trashActionSchema = z.object({
  action: z.enum(['restore', 'purge', 'purge_all'], {
    error: 'সঠিক অ্যাকশন নির্বাচন করুন (restore, purge, purge_all)'
  }),
  trashId: z.union([z.number(), z.string()]).optional(),
  trashIds: z.array(z.union([z.number(), z.string()])).optional(),
  id: z.number().int().optional()
});

export type TrashActionInput = z.infer<typeof trashActionSchema>;
