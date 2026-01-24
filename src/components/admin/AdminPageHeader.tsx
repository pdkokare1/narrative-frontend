// src/components/admin/AdminPageHeader.tsx
import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  // New props for compatibility with Dashboard
  subtitle?: string; 
  actionLabel?: string;
  onAction?: () => void;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ 
    title, 
    description, 
    subtitle, 
    actionLabel, 
    onAction, 
    actions 
}) => {
  return (
    <div className="admin-page-header">
      <div>
        <h1 className="admin-title">{title}</h1>
        {(description || subtitle) && (
          <p className="admin-subtitle">{description || subtitle}</p>
        )}
      </div>
      
      {/* Render explicit actions OR the helper button */}
      <div>
          {actions}
          {!actions && actionLabel && onAction && (
              <button 
                onClick={onAction}
                className="btn btn-primary btn-sm"
              >
                  {actionLabel}
              </button>
          )}
      </div>
    </div>
  );
};
