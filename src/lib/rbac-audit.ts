import logger from '@/lib/logger';
import { hasPermission, PermissionAction } from '@/permissions/rbac';
import { UserSessionData } from '@/lib/auth-wrapper';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Route-to-Permission mapping for RBAC audit assessment.
 * Maps method + canonical route prefix to the existing PermissionAction.
 */
const ROUTE_PERMISSION_MAP: Record<string, PermissionAction> = {
  // Employee permissions
  'POST /api/employees': 'CREATE_EMPLOYEE',
  'POST /api/employees/parse-image': 'CREATE_EMPLOYEE',
  'PUT /api/employees': 'UPDATE_EMPLOYEE',
  'DELETE /api/employees': 'DELETE_EMPLOYEE',

  // Duty permissions
  'POST /api/duties': 'CREATE_DUTY',
  'POST /api/duties/check-conflicts': 'CREATE_DUTY',
  'POST /api/duties/parse-roster-image': 'CREATE_DUTY',
  'PUT /api/duties': 'UPDATE_DUTY',
  'DELETE /api/duties': 'DELETE_DUTY',

  // Office Order permissions
  'POST /api/office-orders': 'CREATE_OFFICE_ORDER',
  'PUT /api/office-orders': 'UPDATE_OFFICE_ORDER',
  'DELETE /api/office-orders': 'DELETE_OFFICE_ORDER',

  // User management permissions
  'POST /api/users': 'MANAGE_USERS',
  'PUT /api/users': 'MANAGE_USERS',
  'DELETE /api/users': 'MANAGE_USERS',
};

// In-memory cache to suppress duplicate audit logs within 1 minute
// Key: `${username}:${key}` -> Timestamp
const logSuppressionCache = new Map<string, number>();
const SUPPRESSION_WINDOW_MS = 60 * 1000;

// Set to track unmapped routes logged once per process runtime to avoid spam
const unmappedLogged = new Set<string>();

export function clearRbacAuditCache(): void {
  logSuppressionCache.clear();
  unmappedLogged.clear();
}

export interface AuditRbacResult {
  allowed: boolean;
  action?: PermissionAction;
  logged: boolean;
  unmapped?: boolean;
}

/**
 * Audit-only RBAC evaluator for HTTP requests.
 * Logs whether an action would be permitted under RBAC without blocking any request.
 * Env RBAC_MODE: 'audit' (default) or 'off'. Never blocks in audit mode.
 * Suppresses duplicate logs for the same user+route+action within 1 minute.
 * Logs unmapped routes at logger.info level once per route.
 * Emits logger.warn ONLY on would-deny (does not emit would-allow).
 */
export function auditRbacRequest(
  method: HttpMethod,
  pathname: string,
  user: UserSessionData | { role?: string; username?: string; name?: string } | null | undefined
): AuditRbacResult {
  const rbacMode = process.env.RBAC_MODE || 'audit';
  if (rbacMode === 'off') {
    return { allowed: true, logged: false };
  }

  try {
    if (!user || !user.role) {
      return { allowed: true, logged: false };
    }

    const role = user.role;
    const username = (user as { username?: string; name?: string }).username || (user as { username?: string; name?: string }).name || 'anonymous';

    // Normalize route key (e.g. "/api/employees/5" -> "/api/employees", "/api/duties/[id]" -> "/api/duties")
    const baseRoute = pathname.replace(/\/\d+$/, '').replace(/\/\[[^\]]+\]$/, '');
    const key = `${method} ${baseRoute}`;
    const action = ROUTE_PERMISSION_MAP[key];

    if (!action) {
      // Unmapped route: Log once at info level per (method + route)
      if (!unmappedLogged.has(key)) {
        unmappedLogged.add(key);
        logger.info(`[RBAC AUDIT] unmapped route: method='${method}' path='${pathname}'`);
      }
      return { allowed: true, logged: false, unmapped: true };
    }

    const wouldAllow = hasPermission(role, action);

    // If allowed, do NOT log (suppress would-allow volume per specification)
    if (wouldAllow) {
      return { allowed: true, action, logged: false };
    }

    // Check duplicate suppression for would-deny logs within 1 minute
    const cacheKey = `${username}:${key}:deny`;
    const now = Date.now();
    const lastLogged = logSuppressionCache.get(cacheKey);

    if (lastLogged && now - lastLogged < SUPPRESSION_WINDOW_MS) {
      return { allowed: false, action, logged: false };
    }

    logSuppressionCache.set(cacheKey, now);

    // Prune stale cache entries if too large
    if (logSuppressionCache.size > 2000) {
      for (const [k, timestamp] of logSuppressionCache.entries()) {
        if (now - timestamp >= SUPPRESSION_WINDOW_MS) {
          logSuppressionCache.delete(k);
        }
      }
    }

    // Emit would-deny warning in exact required format:
    // [RBAC AUDIT] would-deny user='…' role='…' action='…' method='…' path='…'
    logger.warn(
      `[RBAC AUDIT] would-deny user='${username}' role='${role}' action='${action}' method='${method}' path='${pathname}'`
    );

    return { allowed: false, action, logged: true };
  } catch (err) {
    // Fail-open for audit logging: never throw or block request
    try {
      logger.error('auditRbacRequest failed silently:', err);
    } catch {}
    return { allowed: true, logged: false };
  }
}
