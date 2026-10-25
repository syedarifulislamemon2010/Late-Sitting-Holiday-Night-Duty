import logger from '@/lib/logger';
import { hasPermission, PermissionAction } from '@/permissions/rbac';

/**
 * Route-to-Permission mapping for RBAC audit assessment.
 */
const ROUTE_PERMISSION_MAP: Record<string, PermissionAction> = {
  'POST /api/employees': 'CREATE_EMPLOYEE',
  'PUT /api/employees': 'UPDATE_EMPLOYEE',
  'DELETE /api/employees': 'DELETE_EMPLOYEE',
  'POST /api/duties': 'CREATE_DUTY',
  'PUT /api/duties': 'UPDATE_DUTY',
  'DELETE /api/duties': 'DELETE_DUTY',
  'POST /api/office-orders': 'CREATE_OFFICE_ORDER',
  'PUT /api/office-orders': 'UPDATE_OFFICE_ORDER',
  'DELETE /api/office-orders': 'DELETE_OFFICE_ORDER',
  'POST /api/users': 'MANAGE_USERS',
  'PUT /api/users': 'MANAGE_USERS',
  'DELETE /api/users': 'MANAGE_USERS',
};

/**
 * Audit-only RBAC evaluator.
 * Logs whether an action would be permitted under RBAC without blocking any request.
 * Env RBAC_MODE defaults to 'audit'. Never blocks in audit mode.
 */
export function auditRbac(
  method: string,
  pathname: string,
  role?: string,
  username?: string
): { allowed: boolean; action?: PermissionAction; logged: boolean } {
  const rbacMode = process.env.RBAC_MODE || 'audit';

  // Normalize route key (e.g. "POST /api/employees")
  const baseRoute = pathname.replace(/\/\d+$/, ''); // Strip ID suffixes like /12
  const key = `${method.toUpperCase()} ${baseRoute}`;
  const action = ROUTE_PERMISSION_MAP[key];

  if (!action || !role) {
    return { allowed: true, logged: false };
  }

  const wouldAllow = hasPermission(role, action);

  if (!wouldAllow) {
    logger.warn(
      `[RBAC AUDIT] would-deny: user='${username || 'anonymous'}' role='${role}' action='${action}' path='${pathname}' (mode=${rbacMode})`
    );
  } else {
    logger.debug(
      `[RBAC AUDIT] would-allow: user='${username || 'anonymous'}' role='${role}' action='${action}' path='${pathname}'`
    );
  }

  return { allowed: wouldAllow, action, logged: true };
}
