// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface IDashboardStats {
  totalUsers: number;
  activeArticles: number;
  archivedArticles: number;
  systemConfigs: number;
  systemStatus: string;
  databaseStatus: string;
  // NEW: Deep Engagement Metrics
  avgSessionTime?: number;
  avgScrollDepth?: number;
  audioRetention?: number;
}

interface IChartDataPoint { _id: string; count: number; }

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [chartData, setChartData] = useState<IChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then(res => {
         setStats(res.data.data.stats);
         if (res.data.data.chartData) setChartData(res.data.data.chartData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Helper to format seconds into m s
  const formatSeconds = (seconds: number) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  if (loading) return <PageLoader />;

  const graphData = {
    labels: chartData.map(d => d._id),
    datasets: [{
      label: 'Activity',
      data: chartData.map(d => d.count),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const graphOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
  };

  return (
    <div>
      <AdminPageHeader title="System Overview" description="Real-time metrics and system health." />
      
      {/* 1. Primary Counters */}
      <div className="admin-grid-3" style={{marginBottom: '32px'}}>
        <AdminCard title="System Status">
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <span style={{fontSize:'2rem', fontWeight:'bold'}}>{stats?.systemStatus}</span>
             <span style={{width:10, height:10, borderRadius:'50%', background:'#10b981'}}></span>
          </div>
          <p style={{color:'#64748b', fontSize:'0.8rem'}}>DB: {stats?.databaseStatus}</p>
        </AdminCard>
        
        <AdminCard title="Total Users">
          <p style={{fontSize:'2rem', fontWeight:'bold'}}>{stats?.totalUsers || 0}</p>
          <p style={{color:'#64748b', fontSize:'0.8rem'}}>Registered Accounts</p>
        </AdminCard>

        <AdminCard title="Content">
          <p style={{fontSize:'2rem', fontWeight:'bold'}}>{stats?.activeArticles || 0}</p>
          <p style={{color:'#64748b', fontSize:'0.8rem'}}>Archived: {stats?.archivedArticles}</p>
        </AdminCard>
      </div>

      {/* 2. NEW: Deep Insight Metrics */}
      <div className="admin-grid-3" style={{marginBottom: '32px'}}>
          <AdminCard title="Real Attention">
              <p style={{fontSize:'2rem', fontWeight:'bold', color: '#7c3aed'}}>
                  {formatSeconds(stats?.avgSessionTime || 0)}
              </p>
              <p style={{color:'#64748b', fontSize:'0.8rem'}}>Avg. Session Duration</p>
          </AdminCard>

          <AdminCard title="Content Depth">
              <p style={{fontSize:'2rem', fontWeight:'bold', color: '#0891b2'}}>
                  {stats?.avgScrollDepth || 0}%
              </p>
              <p style={{color:'#64748b', fontSize:'0.8rem'}}>Avg. Scroll per Article</p>
          </AdminCard>

          <AdminCard title="Audio Stickiness">
              <p style={{fontSize:'2rem', fontWeight:'bold', color: '#db2777'}}>
                  {stats?.audioRetention || 0}%
              </p>
              <p style={{color:'#64748b', fontSize:'0.8rem'}}>Radio Completion Rate</p>
          </AdminCard>
      </div>

      <AdminCard title="Activity Trend">
        <div style={{height:'300px'}}>
           <Line options={graphOptions} data={graphData} />
        </div>
      </AdminCard>
    </div>
  );
};

export default AdminDashboard;
