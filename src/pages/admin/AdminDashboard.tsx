// narrative-frontend/src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import PageLoader from '../../components/PageLoader';

interface IDashboardStats {
  totalUsers: number;
  activeArticles: number;
  archivedArticles: number;
  systemConfigs: number;
  systemStatus: string;
  databaseStatus: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardStats();
        setStats(res.data.data.stats);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
        setError('Failed to load system stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">System Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stat Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium uppercase">System Status</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{stats?.systemStatus || 'Unknown'}</p>
          <p className="text-xs text-slate-400 mt-1">Database: {stats?.databaseStatus}</p>
        </div>
        
        {/* Stat Card 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium uppercase">Total Users</h3>
          <p className="text-2xl font-bold text-slate-800 mt-2">{stats?.totalUsers || 0}</p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium uppercase">Active Articles</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">{stats?.activeArticles || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Archived: {stats?.archivedArticles}</p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm">
        <h3 className="text-lg font-semibold text-blue-800 mb-1">Welcome Admin</h3>
        <p className="text-blue-700">
          The Newsroom module is now live. Go to the <strong>Newsroom</strong> tab to manage articles, edit content, manually create news, or restore deleted items.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
