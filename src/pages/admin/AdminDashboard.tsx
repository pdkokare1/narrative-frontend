// narrative-frontend/src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import PageLoader from '../../components/PageLoader';
// Chart JS Imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
        // If chartData exists in response (added in updated controller)
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
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  // Prepare Chart Data
  const graphData = {
    labels: chartData.map(d => d._id),
    datasets: [
      {
        label: 'User Activity (Events)',
        data: chartData.map(d => d.count),
        borderColor: 'rgb(59, 130, 246)', // Blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      },
    ],
  };

  const graphOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'System Activity (Last 7 Days)',
      },
    },
  };

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

      {/* CHART SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <Line options={graphOptions} data={graphData} />
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400 italic">
            No activity data available for the last 7 days.
          </div>
        )}
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
