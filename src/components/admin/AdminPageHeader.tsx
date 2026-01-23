import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="admin-page-header">
      <div>
        <h1 className="admin-title">{title}</h1>
        {description && <p className="admin-subtitle">{description}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};
