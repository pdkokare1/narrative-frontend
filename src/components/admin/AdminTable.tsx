import React from 'react';

export const AdminTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
    <table className="w-full text-left border-collapse">
      {children}
    </table>
  </div>
);

export const AdminThead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
    {children}
  </thead>
);

export const AdminTbody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-slate-100">
    {children}
  </tbody>
);

export const AdminTh: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`px-6 py-4 ${className}`}>
    {children}
  </th>
);

export const AdminTd: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <td className={`px-6 py-4 text-sm text-slate-600 ${className}`}>
    {children}
  </td>
);

export const AdminTr: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <tr 
    onClick={onClick} 
    className={`hover:bg-slate-50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
  >
    {children}
  </tr>
);
