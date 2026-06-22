import React from "react";

interface SkeletonRowProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: SkeletonRowProps) {
  return (
    <div className="animate-pulse w-full">
      <div className="flex gap-3 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-slate-700 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 mb-3">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-10 bg-gray-100 dark:bg-slate-800 rounded flex-1"
              style={{ opacity: 1 - i * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 dark:bg-slate-850 rounded-xl" />
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-lg w-full" />
        </div>
      ))}
      <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-32 mt-6" />
    </div>
  );
}
