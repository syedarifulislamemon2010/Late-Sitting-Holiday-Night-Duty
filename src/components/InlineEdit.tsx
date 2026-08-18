'use client';
import logger from '@/lib/logger';

import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X, Loader2, Plus } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  canEdit?: boolean;
}

export default function InlineEdit({
  value,
  onSave,
  placeholder = 'তথ্য নেই',
  className = '',
  inputClassName = '',
  canEdit = true
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value updates
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (!canEdit) {
    return (
      <span className={`truncate min-w-0 ${className}`}>
        {value ? (
          value
        ) : (
          <span className="text-slate-400 dark:text-slate-500 italic text-[11px] select-none">{placeholder}</span>
        )}
      </span>
    );
  }

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (trimmed === value.trim()) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch (err) {
      logger.error('Inline edit save failed:', err);
      // Revert on error
      setInputValue(value);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 w-full min-w-0 max-w-full relative z-10" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={loading}
          className={`px-2 py-0.5 bg-white dark:bg-slate-950 border border-primary ring-1 ring-primary/30 rounded-lg text-xs focus:outline-none text-slate-850 dark:text-slate-100 font-sans w-full min-w-0 ${inputClassName}`}
        />
        {loading ? (
          <Loader2 size={13} className="text-primary animate-spin shrink-0" />
        ) : (
          <div className="flex items-center gap-0.5 shrink-0">
            <button 
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                handleSave();
              }}
              className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-md cursor-pointer transition-colors"
              title="সংরক্ষণ করুন"
            >
              <Check size={13} />
            </button>
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                setInputValue(value);
                setIsEditing(false);
              }}
              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-md cursor-pointer transition-colors"
              title="বাতিল"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Non-editing view
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`group flex items-center justify-between gap-1.5 min-w-0 max-w-full cursor-pointer rounded-lg transition-all ${
        value 
          ? `hover:bg-slate-100/70 dark:hover:bg-slate-800/60 px-1.5 py-0.5 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${className}` 
          : 'border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 hover:border-primary/60 px-2 py-0.5 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors'
      }`}
      title={value ? 'সম্পাদনা করতে ক্লিক করুন' : 'নতুন তথ্য যোগ করতে ক্লিক করুন'}
    >
      <span className="truncate min-w-0 text-xs">
        {value ? (
          value
        ) : (
          <span className="text-[11px] font-medium flex items-center gap-1">
            <Plus size={10} className="shrink-0 text-primary/70" />
            <span>{placeholder}</span>
          </span>
        )}
      </span>
      <Edit2 
        size={11} 
        className={`shrink-0 transition-opacity ${
          value 
            ? 'text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100' 
            : 'text-primary/70 opacity-60 group-hover:opacity-100'
        }`} 
      />
    </div>
  );
}
