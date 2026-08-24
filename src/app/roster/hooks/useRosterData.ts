'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '@/lib/logger';
import { UserProfile } from '@/context/ProfileContext';
import { Cell, Employee, Executive, Holiday, OfficeOrder, Duty, LeaveRecord } from '../types';

interface UseRosterDataProps {
  currentUser: UserProfile | null | undefined;
  selectedMonths: string[];
  selectedCell: string;
  selectedCategory: string;
  selectedEmployee: string;
  isEditingArchive: boolean;
  editRefParam?: string | null;
}

export function useRosterData({
  currentUser,
  selectedMonths,
  selectedCell,
  selectedCategory,
  selectedEmployee,
  isEditingArchive,
  editRefParam
}: UseRosterDataProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [officeOrders, setOfficeOrders] = useState<OfficeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial reference loading
  useEffect(() => {
    async function loadInitialData() {
      try {
        const fetchJson = async (url: string) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
          } catch {
            return [];
          }
        };

        const [empRes, cellRes, holRes, execRes, ordersRes, leavesRes] = await Promise.all([
          fetchJson('/api/employees'),
          fetchJson('/api/cells'),
          fetchJson('/api/holidays'),
          fetchJson('/api/executives'),
          fetchJson('/api/office-orders'),
          fetchJson('/api/leaves')
        ]);

        if (Array.isArray(empRes)) setEmployees(empRes);
        if (Array.isArray(cellRes)) setCells(cellRes);
        if (Array.isArray(holRes)) setHolidays(holRes);
        if (Array.isArray(execRes)) setExecutives(execRes);
        if (Array.isArray(ordersRes)) setOfficeOrders(ordersRes);
        if (Array.isArray(leavesRes)) setLeaves(leavesRes);
      } catch (err) {
        logger.error('Failed to load initial roster references:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const loadDuties = useCallback(async () => {
    try {
      let url = '/api/duties';
      const params = new URLSearchParams();

      if (isEditingArchive && editRefParam) {
        params.set('orderRef', editRefParam);
      } else {
        if (selectedMonths && selectedMonths.length > 0) {
          const sortedMonths = [...selectedMonths].sort();
          const firstMonth = sortedMonths[0];
          const lastMonth = sortedMonths[sortedMonths.length - 1];

          params.set('startDate', `${firstMonth}-01`);
          const [lastYear, lastMon] = lastMonth.split('-');
          const endDay = new Date(parseInt(lastYear, 10), parseInt(lastMon, 10), 0).getDate();
          params.set('endDate', `${lastMonth}-${String(endDay).padStart(2, '0')}`);
        }

        if (selectedCell !== 'all') {
          params.set('cellId', selectedCell);
        }

        if (selectedCategory !== 'all') {
          params.set('type', selectedCategory);
        }

        if (selectedEmployee !== 'all') {
          params.set('employeeId', selectedEmployee);
        }
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setDuties(data);
      } else if (data && Array.isArray(data.data)) {
        setDuties(data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch duties:', err);
    }
  }, [selectedMonths, selectedCell, selectedCategory, selectedEmployee, isEditingArchive, editRefParam]);

  useEffect(() => {
    loadDuties();
  }, [loadDuties]);

  return {
    employees,
    cells,
    duties,
    setDuties,
    leaves,
    holidays,
    executives,
    officeOrders,
    setOfficeOrders,
    isLoading,
    loadDuties
  };
}
