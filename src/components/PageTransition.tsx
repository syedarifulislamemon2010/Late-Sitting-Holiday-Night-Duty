'use client';
import { ReactNode } from 'react';

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="w-full transition-opacity duration-200 animate-in fade-in">
      {children}
    </div>
  );
}
