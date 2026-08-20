'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import logger from '@/lib/logger';
import { UserProfile } from '@/context/ProfileContext';
import { Cell, Employee, Executive } from '../types';

export function useEmployeeManagement(currentUser: UserProfile | null | undefined) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, cellRes, execRes] = await Promise.all([
        fetch('/api/employees').then(r => r.json()),
        fetch('/api/cells').then(r => r.json()),
        fetch('/api/executives').then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(empRes)) setEmployees(empRes);
      if (Array.isArray(cellRes)) setCells(cellRes);
      if (Array.isArray(execRes)) setExecutives(execRes);
    } catch (err) {
      logger.error('Failed to load employee directory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allowedCellIds = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') {
      return cells.map(c => c.id);
    }
    const ids = new Set<number>();
    if (currentUser.cells && Array.isArray(currentUser.cells)) {
      currentUser.cells.forEach((c: { id: number }) => ids.add(c.id));
    }
    const selfEmp = employees.find(e => e.bankId && e.bankId.trim() === currentUser.username.trim());
    if (selfEmp) {
      ids.add(selfEmp.cellId);
    }
    return Array.from(ids);
  }, [currentUser, cells, employees]);

  const formSelectableCells = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return cells;
    return cells.filter(c => allowedCellIds.includes(c.id));
  }, [currentUser, cells, allowedCellIds]);

  return {
    employees,
    setEmployees,
    cells,
    setCells,
    executives,
    loading,
    loadData,
    allowedCellIds,
    formSelectableCells
  };
}
