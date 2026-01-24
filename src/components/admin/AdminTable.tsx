// src/components/admin/AdminTable.tsx
import React from 'react';

// --- Interfaces ---
export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface AdminTableProps<T> {
  // Mode A: Wrapper Mode (Backward Compatibility)
  children?: React.ReactNode;
  
  // Mode B: Smart Table Mode
  data?: T[];
  columns?: TableColumn<T>[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

// --- Main Component ---
export const AdminTable = <T extends any>({
  children,
  data,
  columns,
  currentPage,
  totalPages,
  onPageChange,
  isLoading
}: AdminTableProps<T>) => {

  // RENDER LOGIC:
  // 1. If "data" and "columns" are provided, render the Smart Table.
  if (data && columns) {
    return (
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="admin-table-container" style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Loading data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                data.map((row, rowIdx) => (
                  <tr 
                    key={ (row as any)._id || rowIdx } 
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {columns.map((col, colIdx) => {
                      // Handle Accessor: Can be a string key or a function
                      const cellContent = typeof col.accessor === 'function' 
                        ? col.accessor(row) 
                        : (row[col.accessor] as React.ReactNode);

                      return (
                        <td key={colIdx} style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#334155' }}>
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (Only show if totalPages > 1) */}
        {totalPages && totalPages > 1 && onPageChange && currentPage && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
            <button 
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Fallback: Render Wrapper Mode (for existing pages like Users.tsx)
  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="admin-table-container">
        <table className="admin-table">{children}</table>
      </div>
    </div>
  );
};

// --- Helper Components (Preserved for Backward Compatibility) ---
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
  <tr onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    {children}
  </tr>
);
