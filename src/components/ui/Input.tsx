'use client';

import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName = '',
  className = '',
  id,
  type = 'text',
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-slate-600 dark:text-slate-400 select-none cursor-pointer"
          style={{ letterSpacing: 'normal' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error 
            ? 'border-danger-400 focus:ring-danger-500 focus:border-danger-500' 
            : 'border-slate-200 dark:border-slate-800 focus:ring-primary-500 focus:border-primary-500'
        } rounded-xl shadow-xs transition-all duration-fast ease-premium focus:ring-2 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ letterSpacing: 'normal' }}
        {...props}
      />
      {error && (
        <span 
          id={`${inputId}-error`}
          className="text-[11px] font-semibold text-danger-700 dark:text-danger-400"
          style={{ letterSpacing: 'normal' }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
