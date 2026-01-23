import React from 'react';

interface AdminCardProps {
  children: React.ReactNode;
  className?: string; // Kept for compatibility, but mainly unused
  title?: string;
}

export const AdminCard: React.FC<AdminCardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`admin-card ${className}`}>
      {title && (
        <div className="admin-card-header">{title}</div>
      )}
      <div className="admin-card-body">
        {children}
      </div>
    </div>
  );
};
