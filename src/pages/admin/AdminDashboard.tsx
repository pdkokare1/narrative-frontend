// narrative-frontend/src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface IDashboardStats {
  totalUsers: number;
  activeArticles: number;
  archivedArticles: number;
  systemConfigs: number;
  systemStatus: string;
  databaseStatus: string;
}

interface IChartDataPoint {
  _id: string; // Date "YYYY-MM-DD"
  count: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [chartData, setChartData] = useState<IChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardStats();
        setStats(res.data.data.stats);
        if (res.data.data.chartData) {
          setChartData(res.data.data.chartData);
        }
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
  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  // Prepare Chart Data
  const graphData = {
    labels: chartData.map(d => d._id),
    datasets: [
      {
        label: 'User Activity (Events)',
        data: chartData.map(d => d.count),
        borderColor: 'rgb(37, 99, 235)', // Blue-600
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      },
    ],
  };

  const graphOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
        y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
        x: { grid: { display: false } }
    }
  };

  return (
    <div>
      <AdminPageHeader 
        title="System Overview" 
        description="Real-time metrics and system health monitoring."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AdminCard className="border-l-4 border-l-emerald-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">System Status</h3>
          <div className="flex items-baseline gap-2">
             <span className="text-3xl font-bold text-slate-800">{stats?.systemStatus || 'Unknown'}</span>
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Database: {stats?.databaseStatus}</p>
        </AdminCard>
        
        <AdminCard className="border-l-4 border-l-blue-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-slate-800">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-slate-400 mt-2">Registered Accounts</p>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-indigo-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Content Library</h3>
          <div className="flex items-end gap-2">
             <p className="text-3xl font-bold text-slate-800">{stats?.activeArticles || 0}</p>
             <span className="text-sm text-slate-500 mb-1">Articles</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Archived: {stats?.archivedArticles}</p>
        </AdminCard>
      </div>

      <AdminCard title="Activity Trend (Last 7 Days)" className="mb-8">
        {chartData.length > 0 ? (
          <div className="h-80 w-full">
            <Line options={graphOptions} data={graphData} />
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg">
            No activity data available for the last 7 days.
          </div>
        )}
      </AdminCard>
    </div>
  );
};

export default AdminDashboard;
