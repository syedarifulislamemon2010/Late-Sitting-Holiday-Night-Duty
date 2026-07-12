'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpDown, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  Inbox,
  LayoutGrid,
  Menu
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface TableFilter<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  onFilter: (value: string, item: T) => boolean;
}

export interface TableBulkAction<T> {
  label: string;
  onClick: (selectedItems: T[]) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'text';
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyState?: {
    title: string;
    description: string;
    cta?: {
      label: string;
      onClick: () => void;
    };
  };
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[]; // paths like 'employee.name' or direct keys
  filters?: TableFilter<T>[];
  bulkActions?: TableBulkAction<T>[];
  onRowClick?: (item: T) => void;
  paginationSize?: number;
  rowIdKey?: keyof T | ((item: T) => string | number);
}

export function Table<T>({
  data = [],
  columns,
  loading = false,
  emptyState,
  searchPlaceholder = 'সার্চ করুন...',
  searchKeys = [],
  filters = [],
  bulkActions = [],
  onRowClick,
  paginationSize = 10,
  rowIdKey = 'id' as keyof T,
}: TableProps<T>) {
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Sync debounced search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getRowId = (item: T): string | number => {
    if (typeof rowIdKey === 'function') return rowIdKey(item);
    return item[rowIdKey] as unknown as string | number;
  };

  // Helper to resolve nested object values (e.g. 'employee.name')
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // 1. Filter and search data
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter processing
    Object.keys(activeFilters).forEach((filterKey) => {
      const filterValue = activeFilters[filterKey];
      if (filterValue && filterValue !== 'all') {
        const filterSpec = filters.find((f) => f.key === filterKey);
        if (filterSpec) {
          result = result.filter((item) => filterSpec.onFilter(filterValue, item));
        }
      }
    });

    // Search query processing
    if (debouncedSearch.trim() !== '') {
      const query = debouncedSearch.toLowerCase().trim();
      result = result.filter((item: any) => {
        if (searchKeys.length > 0) {
          return searchKeys.some((key) => {
            const val = typeof key === 'string' ? getNestedValue(item, key) : item[key as keyof T];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
          });
        }
        // Fallback: check all string properties
        return Object.values(item).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(query)
        );
      });
    }

    // Sort processing
    if (sortColumn) {
      result.sort((a: any, b: any) => {
        let valA = getNestedValue(a, sortColumn) ?? '';
        let valB = getNestedValue(b, sortColumn) ?? '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, activeFilters, filters, debouncedSearch, searchKeys, sortColumn, sortDirection]);

  // Reset selected rows if data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [processedData]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * paginationSize;
    return processedData.slice(start, start + paginationSize);
  }, [processedData, currentPage, paginationSize]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / paginationSize));

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = paginatedData.map((item) => getRowId(item));
      setSelectedIds(new Set(ids));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const selectedItems = useMemo(() => {
    return data.filter((item) => selectedIds.has(getRowId(item)));
  }, [data, selectedIds]);

  const allPageRowsSelected = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every((item) => selectedIds.has(getRowId(item)));
  }, [paginatedData, selectedIds]);

  const toBanglaDigits = (numStr: string | number) => {
    const banglaMap: { [key: string]: string } = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return numStr.toString().replace(/[0-9]/g, digit => banglaMap[digit] || digit);
  };

  return (
    <div className="space-y-4 w-full select-none font-sans">
      
      {/* 1. Header controls (Search, Filters, Density Toggles) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="text-slate-400 dark:text-slate-500" size={16} />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-fast ease-premium"
          />
        </div>

        {/* Filters & Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <div key={filter.key} className="w-40">
              <select
                value={activeFilters[filter.key] || 'all'}
                onChange={(e) => {
                  setActiveFilters({ ...activeFilters, [filter.key]: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.8 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Density Toggle */}
          <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <button
              onClick={() => setDensity('compact')}
              className={`p-2 transition-colors cursor-pointer ${
                density === 'compact'
                  ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-sky-400'
                  : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600'
              }`}
              title="Compact View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`p-2 transition-colors cursor-pointer ${
                density === 'comfortable'
                  ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-sky-400'
                  : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600'
              }`}
              title="Comfortable View"
            >
              <Menu size={14} />
            </button>
          </div>

        </div>
      </div>

      {/* 2. Main Data Table Wrapper */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800/80 text-xs font-bold text-slate-500 select-none">
                {bulkActions.length > 0 && (
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allPageRowsSelected}
                      onChange={handleSelectAll}
                      className="rounded border-slate-350 text-primary-600 focus:ring-primary-500 cursor-pointer w-4 h-4"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`py-3 px-4 text-xs font-bold text-slate-500 ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all select-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 justify-start">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <ArrowUpDown
                          size={12}
                          className={`shrink-0 ${
                            sortColumn === col.key ? 'text-primary-600 dark:text-sky-400' : 'text-slate-350'
                          }`}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              
              {/* Skeleton loading display */}
              {loading ? (
                Array.from({ length: paginationSize }).map((_, rIdx) => (
                  <tr key={`skel-row-${rIdx}`} className="animate-pulse">
                    {bulkActions.length > 0 && <td className="py-4 px-4 w-10"><div className="h-4 w-4 bg-slate-100 dark:bg-slate-800 rounded" /></td>}
                    {columns.map((_, cIdx) => (
                      <td key={`skel-cell-${cIdx}`} className="py-4 px-4">
                        <div 
                          className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-full"
                          style={{ opacity: 1 - rIdx * 0.08 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                
                // Empty state display
                <tr>
                  <td colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)} className="py-14 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-full flex items-center justify-center border border-primary-100 dark:border-primary-900/30">
                        <Inbox size={32} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-tight">
                          {emptyState?.title || 'কোনো তথ্য পাওয়া যায়নি'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          {emptyState?.description || 'অনুগ্রহ করে নতুন কোনো আইটেম যোগ করুন অথবা ফিল্টার পরিবর্তন করুন।'}
                        </p>
                      </div>
                      {emptyState?.cta && (
                        <Button variant="primary" size="sm" onClick={emptyState.cta.onClick} className="mt-2">
                          {emptyState.cta.label}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                
                // Active records display
                paginatedData.map((item) => {
                  const id = getRowId(item);
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick && onRowClick(item)}
                      className={`transition-colors duration-100 ${
                        isSelected 
                          ? 'bg-primary-50/20 dark:bg-primary-950/5' 
                          : 'hover:bg-slate-50/55 dark:hover:bg-slate-800/30'
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      {bulkActions.length > 0 && (
                        <td className="py-2 px-4 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(id, e.target.checked)}
                            className="rounded border-slate-350 text-primary-600 focus:ring-primary-500 cursor-pointer w-4 h-4"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`${
                            density === 'compact' ? 'py-1.8 px-4 text-xs' : 'py-3.2 px-4 text-sm'
                          } text-slate-700 dark:text-slate-300 font-medium`}
                          style={{ letterSpacing: 'normal' }}
                        >
                          {col.render ? col.render(item) : (getNestedValue(item, col.key) ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Pagination Controls */}
        {!loading && processedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 select-none">
            <p className="text-xs font-semibold text-slate-500">
              সর্বমোট: <span className="font-sans font-bold">{toBanglaDigits(processedData.length)}</span> টি রেকর্ডের মধ্যে{' '}
              <span className="font-sans font-bold">
                {toBanglaDigits(Math.min(processedData.length, (currentPage - 1) * paginationSize + 1))}
              </span>{' '}
              হতে{' '}
              <span className="font-sans font-bold">
                {toBanglaDigits(Math.min(processedData.length, currentPage * paginationSize))}
              </span>{' '}
              পর্যন্ত দেখা যাচ্ছে।
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNum = index + 1;
                // Show immediate pages around current page
                if (
                  totalPages > 5 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - currentPage) > 1
                ) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={`dots-${pageNum}`} className="px-1 text-slate-400 font-sans">...</span>;
                  }
                  return null;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    <span className="font-sans font-bold">{toBanglaDigits(pageNum)}</span>
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom-floating Bulk Actions Panel */}
      {bulkActions.length > 0 && selectedIds.size > 0 && (
        <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xs border border-slate-800 rounded-2xl shadow-2xl py-3 px-5 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-slow ease-premium text-white select-none">
          <span className="text-xs font-bold text-slate-200">
            <span className="font-sans font-bold text-sky-400">{toBanglaDigits(selectedIds.size)}</span> টি রেকর্ড নির্বাচিত হয়েছে
          </span>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            {bulkActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || 'secondary'}
                size="sm"
                onClick={() => {
                  action.onClick(selectedItems);
                  setSelectedIds(new Set());
                }}
              >
                {action.label}
              </Button>
            ))}
            <Button
              variant="text"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white"
            >
              বাতিল
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
