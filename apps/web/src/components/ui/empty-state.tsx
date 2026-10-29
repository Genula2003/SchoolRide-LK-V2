import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'function' ? (icon as React.ComponentType<{ className?: string }>) : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-card/50',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-subtle">
        {IconComponent ? <IconComponent className="h-7 w-7" /> : (icon as React.ReactNode)}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      {(action || (actionLabel && onAction)) && (
        <Button onClick={action?.onClick || onAction} variant="primary" size="md">
          {action?.label || actionLabel}
        </Button>
      )}
    </div>
  );
}
