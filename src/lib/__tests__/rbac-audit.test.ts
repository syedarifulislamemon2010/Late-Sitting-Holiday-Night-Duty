import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditRbac, clearRbacAuditCache } from '@/lib/rbac-audit';
import logger from '@/lib/logger';

describe('RBAC Audit-Only Evaluator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearRbacAuditCache();
    delete process.env.RBAC_MODE;
  });

  it('logs would-deny for EMPLOYEE attempting administrative action without blocking', () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const result = auditRbac('POST', '/api/employees', 'EMPLOYEE', 'emp_user');

    expect(result.allowed).toBe(false); // would have been denied
    expect(result.action).toBe('CREATE_EMPLOYEE');
    expect(result.logged).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[RBAC AUDIT] would-deny: user='emp_user' role='EMPLOYEE' action='CREATE_EMPLOYEE'")
    );
  });

  it('allows and logs would-allow for ADMIN performing administrative action', () => {
    const result = auditRbac('POST', '/api/users', 'ADMIN', 'admin_boss');
    expect(result.allowed).toBe(true);
    expect(result.action).toBe('MANAGE_USERS');
    expect(result.logged).toBe(true);
  });

  it('allows USER role to create duties', () => {
    const result = auditRbac('POST', '/api/duties', 'USER', 'cell_operator');
    expect(result.allowed).toBe(true);
    expect(result.action).toBe('CREATE_DUTY');
    expect(result.logged).toBe(true);
  });

  it('logs would-deny for USER role attempting to manage users', () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const result = auditRbac('POST', '/api/users', 'USER', 'cell_operator');
    expect(result.allowed).toBe(false);
    expect(result.action).toBe('MANAGE_USERS');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[RBAC AUDIT] would-deny: user='cell_operator' role='USER' action='MANAGE_USERS'")
    );
  });

  it('supports user object signature auditRbac(user, resource, action)', () => {
    const mockUser = { id: 1, username: 'operator1', name: 'Operator One', role: 'USER' as const, mobile: null, cells: [] };
    const result = auditRbac(mockUser, '/api/duties', 'CREATE_DUTY');
    expect(result.allowed).toBe(true);
    expect(result.action).toBe('CREATE_DUTY');
    expect(result.logged).toBe(true);
  });

  it('suppresses duplicate audit logs for same user and action within 1 minute', () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const result1 = auditRbac('POST', '/api/users', 'USER', 'spammer_user');
    expect(result1.logged).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    // Call immediately again
    const result2 = auditRbac('POST', '/api/users', 'USER', 'spammer_user');
    expect(result2.allowed).toBe(false);
    expect(result2.logged).toBe(false); // suppressed!
    expect(warnSpy).toHaveBeenCalledTimes(1); // not called again
  });

  it('does not log or evaluate when RBAC_MODE=off', () => {
    process.env.RBAC_MODE = 'off';
    const warnSpy = vi.spyOn(logger, 'warn');
    const result = auditRbac('POST', '/api/users', 'USER', 'some_user');
    expect(result.allowed).toBe(true);
    expect(result.logged).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('fails open and does not throw even if logger throws an unexpected error', () => {
    vi.spyOn(logger, 'warn').mockImplementationOnce(() => {
      throw new Error('Logger failure simulation');
    });

    expect(() => {
      const result = auditRbac('POST', '/api/users', 'USER', 'error_user');
      expect(result.allowed).toBe(true);
    }).not.toThrow();
  });
});
