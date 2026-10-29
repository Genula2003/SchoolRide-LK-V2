'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

const TabsContext = React.createContext<{
  value?: string;
  onValueChange?: (val: string) => void;
}>({});

export function Tabs({
  tabs,
  activeTab,
  onChange,
  value,
  onValueChange,
  children,
  className,
}: {
  tabs?: TabItem[];
  activeTab?: string;
  onChange?: (id: string) => void;
  value?: string;
  onValueChange?: (val: string) => void;
  children?: React.ReactNode;
  className?: string;
}) {
  if (children) {
    return (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div className={className}>{children}</div>
      </TabsContext.Provider>
    );
  }

  if (!tabs) return null;

  return (
    <div className={cn('inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/60', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange?.(tab.id)}
            className={cn(
              'relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 select-none cursor-pointer flex items-center gap-1.5 z-10',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground',
                )}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-card rounded-lg shadow-subtle border border-border/80 -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/60', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange?.(value)}
      className={cn(
        'relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 select-none cursor-pointer flex items-center gap-1.5 z-10',
        isActive ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTabPill"
          className="absolute inset-0 bg-card rounded-lg shadow-subtle border border-border/80 -z-10"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}
