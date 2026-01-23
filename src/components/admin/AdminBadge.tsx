import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'purple';

interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-rose-100 text-rose-700 border-rose-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-violet-100 text-violet-700 border-violet-200',
};

export const AdminBadge: React.FC<AdminBadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
