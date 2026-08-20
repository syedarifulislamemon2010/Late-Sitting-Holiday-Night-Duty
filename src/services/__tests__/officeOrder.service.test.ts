import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfficeOrderService } from '../officeOrder.service';
import { OfficeOrderRepository } from '@/repositories/officeOrder.repository';
import { logActivity } from '@/lib/audit';

// Mock repository and other dependency modules
vi.mock('@/repositories/officeOrder.repository', () => {
  return {
    OfficeOrderRepository: {
      listAll: vi.fn(),
      findById: vi.fn(),
      findByOrderRef: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateByOrderRef: vi.fn(),
      delete: vi.fn(),
      clearDutiesOrderRef: vi.fn(),
      linkDutiesToOrderRef: vi.fn(),
    },
  };
});

vi.mock('@/lib/audit', () => {
  return {
    logActivity: vi.fn(),
  };
});

vi.mock('@/lib/db', () => {
  return {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      transaction: vi.fn((cb) => cb({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      })),
    },
  };
});

describe('OfficeOrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserAdmin = {
    id: 1,
    name: 'Admin User',
    username: 'admin',
    role: 'ADMIN' as const,
    cells: [{ id: 1, name: 'IT Cell' }],
  };

  const mockHeaders = {
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  };

  describe('createOfficeOrder validation', () => {
    it('should throw error if billing category is saved without backing order reference', async () => {
      const billInput = {
        orderRef: '9103/DEV/BILL/2026-06/001',
        orderDate: '2026-06-11',
        category: 'BILL_HOLIDAY',
        employeeName: 'জনাব ইমন',
        cellName: 'IT Cell',
        content: {}, // Missing backingOrderRef
      };

      await expect(
        OfficeOrderService.createOfficeOrder(mockUserAdmin, billInput, mockHeaders)
      ).rejects.toThrow('ব্যাকলগ অফিস আদেশ');
    });

    it('should throw error if backing order does not exist or has invalid status', async () => {
      const billInput = {
        orderRef: '9103/DEV/BILL/2026-06/001',
        orderDate: '2026-06-11',
        category: 'BILL_HOLIDAY',
        employeeName: 'জনাব ইমন',
        cellName: 'IT Cell',
        content: { backingOrderRef: 'INVALID_REF' },
      };

      vi.mocked(OfficeOrderRepository.findByOrderRef).mockResolvedValue(null);

      await expect(
        OfficeOrderService.createOfficeOrder(mockUserAdmin, billInput, mockHeaders)
      ).rejects.toThrow('প্রিন্ট অথবা জেনারেটেড');
    });
  });

  describe('createOfficeOrder success', () => {
    it('should successfully create office order when validated', async () => {
      const orderInput = {
        orderRef: '9103/DEV/ORDER/2026-06/001',
        orderDate: '2026-06-11',
        category: 'LATE_SITTING',
        employeeName: 'জনাব ইমন',
        cellName: 'IT Cell',
        duties: [],
        dutyIds: [1, 2],
      };

      const mockOrderRecord = {
        id: 101,
        orderRef: orderInput.orderRef,
        orderDate: orderInput.orderDate,
        category: orderInput.category,
        employeeName: orderInput.employeeName,
        cellName: orderInput.cellName,
        status: 'Generated',
        dutiesJson: '[]',
        contentJson: null,
        createdAt: new Date(),
      };

      vi.mocked(OfficeOrderRepository.findByOrderRef).mockResolvedValue(null);
      vi.mocked(OfficeOrderRepository.create).mockResolvedValue(mockOrderRecord);

      const result = await OfficeOrderService.createOfficeOrder(mockUserAdmin, orderInput, mockHeaders);
      expect(result.success).toBe(true);
      expect(result.id).toBe(101);
      expect(OfficeOrderRepository.create).toHaveBeenCalled();
    });
  });
});
