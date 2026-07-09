'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  size = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Lock background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Click outside to close handler
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="no-print fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in scale-95 duration-slow ease-premium ${sizeStyles[size]} ${className}`}
        style={{
          maxHeight: '90vh',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="leading-tight">
            {title && (
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base" style={{ letterSpacing: 'normal' }}>
                {title}
              </h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-300 font-medium">
          {children}
        </div>

        {/* Modal Footer */}
        {footer ? (
          <div className="bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        ) : (
          <div className="h-4 shrink-0" />
        )}
      </div>
    </div>
  );
}
