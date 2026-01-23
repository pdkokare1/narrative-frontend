import React from 'react';

export const AdminTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="admin-card" style={{padding: 0, overflow:'hidden'}}>
    <div className="admin-table-container">
      <table className="admin-table">{children}</table>
    </div>
  </div>
);

export const AdminThead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead>{children}</thead>
);

export const AdminTbody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody>{children}</tbody>
);

export const AdminTh: React.FC<{ children: React.ReactNode; className?: string }> = ({ children }) => (
  <th>{children}</th>
);

export const AdminTd: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <td className={className}>{children}</td>
);

export const AdminTr: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <tr onClick={onClick} style={{cursor: onClick ? 'pointer' : 'default'}}>
    {children}
  </tr>
);
