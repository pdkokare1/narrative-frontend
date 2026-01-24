// src/components/admin/AdminCard.tsx
import React from 'react';

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  // New prop: Supports emojis strings or React components
  icon?: React.ReactNode | string; 
}

export const AdminCard: React.FC<AdminCardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`admin-card ${className}`}>
      {(title || icon) && (
        <div className="admin-card-header">
            {icon && (
                <span style={{ marginRight: '10px', fontSize: '1.2rem', lineHeight: 1 }}>
                    {icon}
                </span>
            )}
            {title}
        </div>
      )}
      <div className="admin-card-body">
        {children}
      </div>
    </div>
  );
};
