// narrative-frontend/src/pages/admin/ActivityLogs.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import PageLoader from '../../components/PageLoader';

interface ILog {
  _id: string;
  userId: string;
  articleId: string;
  action: string;
  timestamp: string;
}

const ActivityLogs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ILog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getActivityLogs(page, 50);
      setLogs(res.data.data.logs);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to fetch logs", err);
      alert('Error loading activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Activity Logs</h1>
      </div>

      {/* Logs Table */}
      {loading && logs.length === 0 ? <PageLoader /> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Time</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Action</th>
                <th className="p-4 text-sm font-semibold text-slate-600">User ID</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Article Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm text-slate-800 font-semibold">
                     <span className={`px-2 py-1 rounded text-xs uppercase ${
                        log.action.includes('share') ? 'bg-green-100 text-green-700' : 
                        log.action.includes('view') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                     }`}>
                        {log.action.replace('_', ' ')}
                     </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500 font-mono">
                    {log.userId}
                  </td>
                  <td className="p-4 text-xs text-slate-500 font-mono">
                    {log.articleId || '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
         <p>Page {page} of {totalPages}</p>
         <div className="space-x-2">
            <button 
               disabled={page <= 1}
               onClick={() => setPage(p => p - 1)}
               className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button 
               disabled={page >= totalPages}
               onClick={() => setPage(p => p + 1)}
               className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
            >
              Next
            </button>
         </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
