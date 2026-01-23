import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'purple';

interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ children, variant = 'neutral' }) => {
  // Inline styles for badges (simple enough to keep here)
  const styles: any = {
    padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: '600',
    display: 'inline-block'
  };
  
  const colors: any = {
    success: { bg: '#dcfce7', color: '#15803d' },
    warning: { bg: '#fef3c7', color: '#b45309' },
    danger:  { bg: '#ffe4e6', color: '#e11d48' },
    neutral: { bg: '#f1f5f9', color: '#475569' },
    info:    { bg: '#dbeafe', color: '#1e40af' },
    purple:  { bg: '#f3e8ff', color: '#7e22ce' },
  };

  const c = colors[variant] || colors.neutral;

  return (
    <span style={{ ...styles, backgroundColor: c.bg, color: c.color }}>
      {children}
    </span>
  );
};
