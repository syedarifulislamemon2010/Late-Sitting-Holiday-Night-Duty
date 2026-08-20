'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text';
}

export function Skeleton({
  className = '',
  variant = 'rounded',
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    text: 'rounded h-4 w-full'
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/60 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton variant="text" className="w-3/4 h-4" />
              <Skeleton variant="text" className="w-1/2 h-3" />
            </div>
          </div>
          <Skeleton variant="rectangular" className="h-16 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`w-full overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <Skeleton variant="text" className="w-1/4 h-6" />
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="w-20 h-8" />
          <Skeleton variant="rounded" className="w-24 h-8" />
        </div>
      </div>
      <div className="flex gap-3 py-2 border-b border-slate-100 dark:border-slate-800/60">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="rounded" className="h-6 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 items-center py-2.5" style={{ opacity: 1 - r * 0.1 }}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} variant="text" className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export const TableSkeletonLoader = TableSkeleton;

export function FormSkeleton({ fields = 4, className = '' }: { fields?: number; className?: string }) {
  return (
    <div className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 ${className}`}>
      <Skeleton variant="text" className="w-1/3 h-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" className="w-24 h-4" />
            <Skeleton variant="rounded" className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Skeleton variant="rounded" className="w-24 h-10" />
        <Skeleton variant="rounded" className="w-32 h-10" />
      </div>
    </div>
  );
}

export function MetricCardsSkeleton({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
        >
          <div className="flex justify-between items-center">
            <Skeleton variant="text" className="w-1/2 h-4" />
            <Skeleton variant="circular" className="w-8 h-8" />
          </div>
          <Skeleton variant="text" className="w-3/4 h-7" />
          <Skeleton variant="text" className="w-1/3 h-3" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-48 h-8" />
          <Skeleton variant="text" className="w-72 h-4" />
        </div>
        <Skeleton variant="rounded" className="w-32 h-10" />
      </div>
      <MetricCardsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Skeleton variant="text" className="w-1/3 h-6" />
          <Skeleton variant="rectangular" className="h-64 w-full rounded-xl" />
        </div>
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Skeleton variant="text" className="w-1/2 h-6" />
          <Skeleton variant="rectangular" className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-48 h-8" />
          <Skeleton variant="text" className="w-64 h-4" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="w-28 h-9" />
          <Skeleton variant="rounded" className="w-28 h-9" />
        </div>
      </div>
      <MetricCardsSkeleton count={4} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Skeleton variant="text" className="w-1/3 h-6" />
          <Skeleton variant="rectangular" className="h-72 w-full rounded-xl" />
        </div>
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <Skeleton variant="text" className="w-1/3 h-6" />
          <Skeleton variant="rectangular" className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
