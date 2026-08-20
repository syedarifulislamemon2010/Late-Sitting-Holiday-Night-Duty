'use client';

import { useState, useEffect, useRef } from 'react';
import { UserProfile } from '@/context/ProfileContext';
import { Cell } from '../types';

interface UseRosterFiltersProps {
  currentUser: UserProfile | null | undefined;
  cells: Cell[];
  resetCustomOrderFields?: () => void;
}

export function useRosterFilters({
  currentUser,
  cells,
  resetCustomOrderFields
}: UseRosterFiltersProps) {
  const [selectedCell, setSelectedCell] = useState('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return [`${today.getFullYear()}-${mm}`];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const [opt1CellId, setOpt1CellId] = useState<string>('all');
  const [opt1SearchQuery, setOpt1SearchQuery] = useState<string>('');
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formCellFilter, setFormCellFilter] = useState('all');

  const isUserCellInitializedRef = useRef(false);

  // Initialize non-admin user default cell
  useEffect(() => {
    if (currentUser && !isUserCellInitializedRef.current) {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const hasEditRef = params ? !!params.get('edit_ref') : false;
      
      if (!hasEditRef && currentUser.role !== 'ADMIN') {
        if (currentUser.cells && currentUser.cells.length === 1) {
          const pIdStr = currentUser.cells[0].id.toString();
          setSelectedCell(pIdStr);
          setOpt1CellId(pIdStr);
          setFormCellFilter(pIdStr);
        } else {
          setSelectedCell('all');
          setOpt1CellId('all');
          setFormCellFilter('all');
        }
      }
      isUserCellInitializedRef.current = true;
    }
  }, [currentUser]);

  // Set default cell once cells are loaded
  useEffect(() => {
    if (cells.length > 0 && !isUserCellInitializedRef.current) {
      const defaultCell = (!currentUser || currentUser.role === 'ADMIN' || (currentUser.cells && currentUser.cells.length > 1))
        ? 'all'
        : (currentUser.cells && currentUser.cells[0] ? currentUser.cells[0].id.toString() : cells[0].id.toString());
      setOpt1CellId(defaultCell);
      setFormCellFilter(defaultCell);
    }
  }, [cells, currentUser]);

  const changeSelectedCell = (cellId: string) => {
    setSelectedCell(cellId);
    setOpt1CellId(cellId);
    setFormCellFilter(cellId);
    setSelectedEmployee('all');
    if (resetCustomOrderFields) {
      resetCustomOrderFields();
    }
  };

  const changeSelectedMonths = (months: string[] | ((prev: string[]) => string[])) => {
    setSelectedMonths(months);
    if (resetCustomOrderFields) {
      resetCustomOrderFields();
    }
  };

  return {
    selectedCell,
    setSelectedCell,
    changeSelectedCell,
    selectedMonths,
    setSelectedMonths,
    changeSelectedMonths,
    selectedCategory,
    setSelectedCategory,
    selectedEmployee,
    setSelectedEmployee,
    opt1CellId,
    setOpt1CellId,
    opt1SearchQuery,
    setOpt1SearchQuery,
    formSearchQuery,
    setFormSearchQuery,
    formCellFilter,
    setFormCellFilter
  };
}
