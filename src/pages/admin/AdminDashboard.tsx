// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import PageLoader from '../../components/PageLoader';
// FIXED: Changed to named imports (added curly braces)
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import {
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ChartOptions, 
  ArcElement
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2'; 
import './Admin.css'; 

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend, 
    ArcElement
);

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

// FIXED: Updated Interface to include 'query'
interface ISearchData {
    _id: string; 
    query: string; // Added this property
    count: number;
}

interface IIgnoredTopic {
    _id: string; // Topic name
    userCount: number;
    totalIntensity: number;
}

interface IExtendedDashboardData {
    stats: IDashboardStats;
    graphData: IChartDataPoint[];
    leanData: ILeanData;
    topSearches: ISearchData[];
    contentGaps?: ISearchData[];
    hourlyActivity?: number[]; 
    mostIgnored?: IIgnoredTopic[]; // NEW
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [chartData, setChartData] = useState<IChartDataPoint[]>([]);
  const [leanData, setLeanData] = useState<ILeanData>({ left: 0, center: 0, right: 0 });
  
  const [topSearches, setTopSearches] = useState<ISearchData[]>([]);
  const [contentGaps, setContentGaps] = useState<ISearchData[]>([]);
  const [mostIgnored, setMostIgnored] = useState<IIgnoredTopic[]>([]); // NEW
  const [hourlyActivity, setHourlyActivity] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then(res => {
         // Handle the nested data structure
         // The API returns { data: { stats: ..., topSearches: ... } }
         const data = res.data.data; 
         
         if (data.stats) setStats(data.stats);
         if (data.graphData) setChartData(data.graphData);
         if (data.leanData) setLeanData(data.leanData);
         if (data.topSearches) setTopSearches(data.topSearches);
         
         if (data.contentGaps) setContentGaps(data.contentGaps);
         if (data.hourlyActivity) setHourlyActivity(data.hourlyActivity);
         if (data.mostIgnored) setMostIgnored(data.mostIgnored); // NEW
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

  // --- CHART CONFIGURATIONS ---

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

  const pieData = {
      labels: ['Left', 'Center', 'Right'],
      datasets: [{
          data: [leanData.left, leanData.center, leanData.right],
          backgroundColor: ['#3b82f6', '#a855f7', '#ef4444'],
          borderWidth: 1
      }]
  };

  const hourLabels = Array.from({ length: 24 }, (_, i) => {
      const h = i % 12 || 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      return `${h}${ampm}`;
  });

  const barData = {
      labels: hourLabels,
      datasets: [{
          label: 'Active Minutes',
          data: hourlyActivity.map(seconds => Math.round(seconds / 60)), 
          backgroundColor: '#6366f1',
          borderRadius: 4,
      }]
  };

  const barOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
          legend: { display: false },
          tooltip: {
              callbacks: {
                  label: (context) => `${context.raw} mins`
              }
          }
      },
      scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 12, font: { size: 10 } } },
          y: { display: false } 
      }
  };

  return (
    <div className="admin-page fade-in">
      <AdminPageHeader 
        title="Mission Control" 
        subtitle="Real-time system overview and intelligence." 
        actionLabel="Refresh Data"
        onAction={() => window.location.reload()}
      />
      
      {/* Row 1: Basic Counters */}
      <div className="admin-grid-3" style={{marginBottom: '32px'}}>
        <AdminCard title="System Status" icon="🖥️">
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <span style={{fontSize:'1.5rem', fontWeight:'bold'}}>{stats?.systemStatus || 'Online'}</span>
             <span style={{width:10, height:10, borderRadius:'50%', background:'#10b981'}}></span>
          </div>
          <p style={{color:'#64748b', fontSize:'0.8rem'}}>DB: {stats?.databaseStatus}</p>
        </AdminCard>
        
        <AdminCard title="Total Users" icon="👥">
          <p style={{fontSize:'2rem', fontWeight:'bold'}}>{stats?.totalUsers || 0}</p>
          <p style={{color:'#64748b', fontSize:'0.8rem'}}>Registered Accounts</p>
        </AdminCard>

        <AdminCard title="Content Library" icon="📚">
          <p style={{fontSize:'2rem', fontWeight:'bold'}}>{stats?.activeArticles || 0}</p>
          <p style={{color:'#64748b', fontSize:'0.8rem'}}>Archived: {stats?.archivedArticles}</p>
        </AdminCard>
      </div>

      {/* Row 2: Deep Insight Metrics */}
      <div className="admin-grid-3" style={{marginBottom: '32px'}}>
          <AdminCard title="Real Attention" icon="⏱️">
              <p style={{fontSize:'2rem', fontWeight:'bold', color: '#7c3aed'}}>
                  {formatSeconds(stats?.avgSessionTime || 0)}
              </p>
              <p style={{color:'#64748b', fontSize:'0.8rem'}}>Avg. Session Duration</p>
          </AdminCard>

          <AdminCard title="Content Depth" icon="📜">
              <p style={{fontSize:'2rem', fontWeight:'bold', color: '#0891b2'}}>
                  {stats?.avgScrollDepth || 0}%
              </p>
              <p style={{color:'#64748b', fontSize:'0.8rem'}}>Avg. Scroll per Article</p>
          </AdminCard>

          <AdminCard title="Audio Stickiness" icon="📻">
              <p style={{fontSize:'2rem', fontWeight:'bold', color: '#db2777'}}>
                  {stats?.audioRetention || 0}%
              </p>
              <p style={{color:'#64748b', fontSize:'0.8rem'}}>Radio Completion Rate</p>
          </AdminCard>
      </div>

      {/* Row 3: Visualizations */}
      <div className="admin-grid-split" style={{ marginBottom: '32px' }}>
          <AdminCard title="Engagement Split (7 Days)">
            <div style={{height:'300px'}}>
               <Line options={lineOptions} data={lineData} />
            </div>
          </AdminCard>

          <AdminCard title="Political Balance">
            <div style={{height:'260px', display: 'flex', justifyContent: 'center', marginBottom: '10px'}}>
               <Pie data={pieData} />
            </div>
             <p style={{textAlign: 'center', fontSize: '0.8rem', color: '#64748b'}}>
                 Total Minutes Consumed per Bias
             </p>
          </AdminCard>
      </div>

      {/* Row 4: NEW Habit Heatmap */}
      <div style={{ marginBottom: '32px' }}>
          <AdminCard title="Daily Habit Heatmap (Active Hours UTC)" icon="🕰️">
              <div style={{ height: '200px', width: '100%' }}>
                  {hourlyActivity.length > 0 ? (
                      <Bar options={barOptions} data={barData} />
                  ) : (
                      <div className="empty-state">No habit data collected yet.</div>
                  )}
              </div>
          </AdminCard>
      </div>

      {/* Row 5: Search Intelligence & Survivorship Bias */}
      <div className="admin-grid-3">
          {/* Column 1: Trends */}
          <AdminCard title="🔥 Trending Searches" icon="🔍">
            <div className="search-list-container">
                {topSearches.length > 0 ? topSearches.map((item, index) => (
                  <div key={index} className="search-item">
                      <div className="search-rank">#{index + 1}</div>
                      <div className="search-term">{item.query || item._id}</div> 
                      <div className="search-count">{item.count}</div>
                  </div>
                )) : (
                  <p className="empty-text">No trends yet.</p>
                )}
            </div>
          </AdminCard>

          {/* Column 2: Content Gaps */}
          <AdminCard title="⚠️ Content Gaps (Zero Results)" icon="🚫">
             <div className="search-list-container">
                {contentGaps.length > 0 ? contentGaps.map((item, index) => (
                  <div key={index} className="search-item gap-item">
                      <div className="search-term">{item.query || item._id}</div>
                      <div className="search-count">{item.count}</div>
                  </div>
                )) : (
                  <p className="empty-text">No content gaps found.</p>
                )}
            </div>
          </AdminCard>

          {/* Column 3: NEW Survivorship Bias */}
          <AdminCard title="👻 Top Ignored Topics" icon="🙈">
             <div className="search-list-container">
                {mostIgnored.length > 0 ? mostIgnored.map((item, index) => (
                  <div key={index} className="search-item">
                      <div className="search-rank">#{index + 1}</div>
                      <div className="search-term">{item._id}</div> 
                      <div className="search-count" title="Users Ignoring">{item.userCount} users</div>
                  </div>
                )) : (
                  <p className="empty-text">No ignored topics detected yet.</p>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
                Users see these often but rarely click.
            </p>
          </AdminCard>
      </div>

    </div>
  );
};

export default AdminDashboard;
