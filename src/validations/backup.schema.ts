import { z } from 'zod';

export const backupRestoreSchema = z.object({
  action: z.enum(['restore', 'clear_history']).optional(),
  data: z.record(z.string(), z.unknown()).optional()
});

export type BackupRestoreInput = z.infer<typeof backupRestoreSchema>;
