// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions, ArcElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface IDashboardStats {
  totalUsers: number;
  activeArticles: number;
  archivedArticles: number;
  systemConfigs: number;
  systemStatus: string;
  databaseStatus: string;
  avgSessionTime?: number;
  avgScrollDepth?: number;
  audioRetention?: number;
}

interface IChartDataPoint { 
    _id: string; 
    reading: number; 
    listening: number; 
}

interface ILeanData {
    left: number;
    center: number;
    right: number;
}

// NEW: Search Data Interface
interface ISearchData {
    _id: string; // The query
    count: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [chartData, setChartData] = useState<IChartDataPoint[]>([]);
  const [leanData, setLeanData] = useState<ILeanData>({ left: 0, center: 0, right: 0 });
  const [topSearches, setTopSearches] = useState<ISearchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then(res => {
         setStats(res.data.data.stats);
         if (res.data.data.graphData) setChartData(res.data.data.graphData);
         if (res.data.data.leanData) setLeanData(res.data.data.leanData);
         if (res.data.data.topSearches) setTopSearches(res.data.data.topSearches);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatSeconds = (seconds: number) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  if (loading) return <PageLoader />;

  // 1. Line Graph: Reading vs Listening
  const lineData = {
    labels: chartData.map(d => d._id),
    datasets: [
      {
        label: 'Reading Time (sec)',
        data: chartData.map(d => d.reading),
        borderColor: '#0891b2', 
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Listening Time (sec)',
        data: chartData.map(d => d.listening),
        borderColor: '#db2777', 
        backgroundColor: 'rgba(219, 39, 119, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
  };

  // 2. Pie Chart: Political Compass
  const pieData = {
      labels: ['Left', 'Center', 'Right'],
      datasets: [{
          data: [leanData.left, leanData.center, leanData.right],
          backgroundColor: ['#3b82f6', '#a855f7', '#ef4444'],
          borderWidth: 1
      }]
  };

  return (
    <div>
      <AdminPageHeader title="System Overview" description="Real-time metrics and system health." />
      
      {/* Row 1: Basic Counters */}
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

      {/* Row 2: Deep Insight Metrics */}
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

      {/* Row 3: Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <AdminCard title="Engagement Split (Last 7 Days)">
            <div style={{height:'300px'}}>
               <Line options={lineOptions} data={lineData} />
            </div>
          </AdminCard>

          <AdminCard title="Audience Political Balance">
            <div style={{height:'300px', display: 'flex', justifyContent: 'center'}}>
               <Pie data={pieData} />
            </div>
             <p style={{textAlign: 'center', fontSize: '0.8rem', color: '#64748b', marginTop: '10px'}}>
                 Total Minutes Consumed per Bias
             </p>
          </AdminCard>
      </div>

      {/* Row 4: Trending Searches (NEW) */}
      <AdminCard title="Top Trending Searches (Last 7 Days)">
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
              {topSearches.length > 0 ? topSearches.map((item, index) => (
                  <div key={index} style={{
                      padding: '8px 16px',
                      background: '#f1f5f9',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                  }}>
                      <span style={{fontWeight: 600}}>#{index + 1}</span>
                      {item._id}
                      <span style={{
                          background: '#cbd5e1', 
                          padding: '2px 6px', 
                          borderRadius: '10px', 
                          fontSize: '0.75rem'
                      }}>{item.count}</span>
                  </div>
              )) : (
                  <p style={{color: '#94a3b8', fontStyle: 'italic'}}>No searches recorded yet.</p>
              )}
          </div>
      </AdminCard>
    </div>
  );
};

export default AdminDashboard;
