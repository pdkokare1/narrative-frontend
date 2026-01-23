import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
