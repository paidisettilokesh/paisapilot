import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'accent' | 'danger';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-navy-800/80 border-navy-500 hover:border-navy-400/60',
    glow: 'bg-gradient-to-br from-navy-800/90 to-navy-700/80 border-emerald/30 shadow-glow hover:border-emerald/50',
    accent: 'bg-gradient-to-br from-navy-800/90 to-navy-700/90 border-navy-400/40 hover:border-emerald/40',
    danger: 'bg-gradient-to-br from-navy-800/90 to-rose-950/20 border-rose-500/30 hover:border-rose-500/50',
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 backdrop-blur-sm ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
