'use client';

import React, { createContext, useContext, useState } from 'react';

export enum LayoutPriority {
  ASSIGNMENT = 'ASSIGNMENT_PRIORITY',
  ROSTER = 'ROSTER_PRIORITY',
}

interface LayoutContextType {
  activeLayout: LayoutPriority;
  setLayoutPriority: (priority: LayoutPriority) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [activeLayout, setActiveLayout] = useState<LayoutPriority>(LayoutPriority.ROSTER);

  return (
    <LayoutContext.Provider value={{ activeLayout, setLayoutPriority: setActiveLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
