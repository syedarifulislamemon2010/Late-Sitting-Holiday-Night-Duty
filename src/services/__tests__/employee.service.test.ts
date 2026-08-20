import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeService } from '../employee.service';
import { EmployeeRepository } from '@/repositories/employee.repository';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    transaction: vi.fn(async (cb) => cb({
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }))
  }
}));

vi.mock('@/repositories/employee.repository', () => ({
  EmployeeRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByBankId: vi.fn(),
    listAllWithCell: vi.fn(),
    listAll: vi.fn()
  }
}));

vi.mock('@/lib/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}));

describe('EmployeeService', () => {
  const adminUser = {
    id: 1,
    username: 'admin',
    name: 'System Admin',
    role: 'ADMIN' as const,
    mobile: '01700000000',
    cells: [{ id: 1, name: 'Cell 1' }]
  };

  const regularUser = {
    id: 2,
    username: '12345',
    name: 'Regular Officer',
    role: 'USER' as const,
    mobile: '01711111111',
    cells: [{ id: 1, name: 'Cell 1' }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists all employees for admin user', async () => {
    const mockEmployees = [
      { id: 1, name: 'Officer A', designation: 'Senior Principal Officer', cellId: 1, bankId: '020000', fileNo: '1', mobile: null, cell: { id: 1, name: 'Cell A', description: null, createdAt: new Date() }, createdAt: new Date() },
      { id: 2, name: 'Officer B', designation: 'Principal Officer', cellId: 2, bankId: '030000', fileNo: '2', mobile: null, cell: { id: 2, name: 'Cell B', description: null, createdAt: new Date() }, createdAt: new Date() }
    ];
    vi.mocked(EmployeeRepository.listAllWithCell).mockResolvedValue(mockEmployees);

    const result = await EmployeeService.listEmployees(adminUser, false, null);
    expect(result).toHaveLength(2);
    expect(EmployeeRepository.listAllWithCell).toHaveBeenCalled();
  });

  it('filters employees by assigned cells for regular user', async () => {
    const mockEmployees = [
      { id: 1, name: 'Officer A', designation: 'Senior Principal Officer', cellId: 1, bankId: '020000', fileNo: '1', mobile: null, cell: { id: 1, name: 'Cell A', description: null, createdAt: new Date() }, createdAt: new Date() }
    ];
    vi.mocked(EmployeeRepository.listAllWithCell).mockResolvedValue(mockEmployees);

    const result = await EmployeeService.listEmployees(regularUser, false, null);
    expect(result).toHaveLength(1);
    expect(EmployeeRepository.listAllWithCell).toHaveBeenCalled();
  });

  it('validates employee creation data with Zod schema', async () => {
    const invalidBody = {
      name: '', // Invalid empty name
      designation: 'PO',
      cellId: 1
    };

    await expect(
      EmployeeService.createEmployee(adminUser, invalidBody as unknown as Parameters<typeof EmployeeService.createEmployee>[1], { ipAddress: '127.0.0.1', userAgent: 'test' })
    ).rejects.toThrow();
  });

  it('throws not found error when updating a non-existent employee', async () => {
    vi.mocked(EmployeeRepository.findById).mockResolvedValue(null as unknown as typeof import('@/db/schema').employees.$inferSelect);

    await expect(
      EmployeeService.updateEmployee(
        adminUser,
        9999,
        { name: 'Updated Name', designation: 'SPO', cellId: 1 },
        { ipAddress: '127.0.0.1', userAgent: 'test' }
      )
    ).rejects.toThrow();
  });
});
