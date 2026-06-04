/**
 * Audit and Activity logging is disabled and removed from the project.
 * This is a dummy stub to prevent compilation errors in endpoints referencing logActivity.
 */

export async function getMacAddress(ip: string): Promise<string> {
  return 'Not Available (Logging Disabled)';
}

export async function logActivity(params: {
  username: string;
  action: string;
  entityType?: string;
  entityId?: string | number;
  ipAddress?: string;
  userAgent?: string;
  details: string;
}) {
  // No-op: activity logs are disabled and not written to the database.
}
