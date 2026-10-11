import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'emerald',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    emerald: 'bg-emerald/15 text-emerald border-emerald/25',
    amber: 'bg-amber/15 text-amber border-amber/25',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    blue: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    slate: 'bg-navy-600 text-slate-300 border-navy-500',
  };

  const sizeStyles = {
    sm: 'text-2xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
