import { describe, it, expect, vi } from 'vitest';
import { auditRbac } from '@/lib/rbac-audit';
import logger from '@/lib/logger';

describe('RBAC Audit-Only Evaluator', () => {
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
  });

  it('allows USER role to create duties', () => {
    const result = auditRbac('POST', '/api/duties', 'USER', 'cell_operator');
    expect(result.allowed).toBe(true);
    expect(result.action).toBe('CREATE_DUTY');
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
});
