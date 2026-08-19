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

export function TableSkeletonLoader({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`w-full overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <Skeleton variant="text" className="w-1/4 h-5" />
        <Skeleton variant="rounded" className="w-24 h-8" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3 items-center py-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} variant="text" className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}
