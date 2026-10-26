import logger from '@/lib/logger';
import { hasPermission, PermissionAction } from '@/permissions/rbac';
import { UserSessionData } from '@/lib/auth-wrapper';

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

// In-memory cache to suppress duplicate audit logs within 1 minute
// Key: `${username}:${key}` -> Timestamp
const logSuppressionCache = new Map<string, number>();
const SUPPRESSION_WINDOW_MS = 60 * 1000;

export function clearRbacAuditCache(): void {
  logSuppressionCache.clear();
}

/**
 * Audit-only RBAC evaluator.
 * Logs whether an action would be permitted under RBAC without blocking any request.
 * Env RBAC_MODE: 'audit' (default) or 'off'. Never blocks in audit mode.
 * Suppresses duplicate logs for the same user+route+action within 1 minute.
 */
export function auditRbac(
  userOrMethod: string | UserSessionData | { role?: string; username?: string; name?: string } | null | undefined,
  pathnameOrResource?: string,
  actionOrRole?: PermissionAction | string,
  maybeUsername?: string
): { allowed: boolean; action?: PermissionAction; logged: boolean } {
  const rbacMode = process.env.RBAC_MODE || 'audit';
  if (rbacMode === 'off') {
    return { allowed: true, logged: false };
  }

  try {
    let method = 'GET';
    let pathname = '';
    let role: string | undefined;
    let username: string | undefined;
    let explicitAction: PermissionAction | undefined;

    if (typeof userOrMethod === 'object' && userOrMethod !== null) {
      // Overload: auditRbac(user, <resource/path>, <action>)
      role = userOrMethod.role;
      username = (userOrMethod as any).username || (userOrMethod as any).name;
      pathname = pathnameOrResource || '';
      if (actionOrRole) {
        explicitAction = actionOrRole as PermissionAction;
      }
    } else if (typeof userOrMethod === 'string') {
      // Overload: auditRbac(method, pathname, role, username)
      method = userOrMethod;
      pathname = pathnameOrResource || '';
      role = typeof actionOrRole === 'string' ? actionOrRole : undefined;
      username = maybeUsername;
    }

    if (!role) {
      return { allowed: true, logged: false };
    }

    // Determine target action
    let action: PermissionAction | undefined = explicitAction;
    let key = '';

    if (!action) {
      const baseRoute = pathname.replace(/\/\d+$/, '');
      key = `${method.toUpperCase()} ${baseRoute}`;
      action = ROUTE_PERMISSION_MAP[key];
    } else {
      key = `${pathname} ${action}`;
    }

    if (!action) {
      return { allowed: true, logged: false };
    }

    // Check duplicate suppression (same user + route/action within 1 min)
    const effectiveUser = username || 'anonymous';
    const cacheKey = `${effectiveUser}:${key}`;
    const now = Date.now();
    const lastLogged = logSuppressionCache.get(cacheKey);

    if (lastLogged && now - lastLogged < SUPPRESSION_WINDOW_MS) {
      // Suppressed duplicate log
      const wouldAllow = hasPermission(role, action);
      return { allowed: wouldAllow, action, logged: false };
    }

    const wouldAllow = hasPermission(role, action);
    logSuppressionCache.set(cacheKey, now);

    // Prune stale cache entries if too large
    if (logSuppressionCache.size > 2000) {
      for (const [k, timestamp] of logSuppressionCache.entries()) {
        if (now - timestamp >= SUPPRESSION_WINDOW_MS) {
          logSuppressionCache.delete(k);
        }
      }
    }

    if (!wouldAllow) {
      logger.warn(
        `[RBAC AUDIT] would-deny: user='${effectiveUser}' role='${role}' action='${action}' path='${pathname}' (mode=${rbacMode})`
      );
    } else {
      logger.debug(
        `[RBAC AUDIT] would-allow: user='${effectiveUser}' role='${role}' action='${action}' path='${pathname}'`
      );
    }

    return { allowed: wouldAllow, action, logged: true };
  } catch (err) {
    // Fail-open for audit logging: never throw or block request
    try {
      logger.error('auditRbac failed silently:', err);
    } catch {}
    return { allowed: true, logged: false };
  }
}
