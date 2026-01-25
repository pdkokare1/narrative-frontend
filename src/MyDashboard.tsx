// src/MyDashboard.tsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { useQuery } from '@tanstack/react-query'; 
import * as api from './services/api'; 
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useAuth } from './context/AuthContext'; 
import useIsMobile from './hooks/useIsMobile';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale,
  ChartData
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css';
import './MyDashboard.css';

// --- ICONS (New) ---
import { Shield, TrendingUp, Snowflake, ChevronRight, Target, Zap } from 'lucide-react';

import DashboardSkeleton from './components/ui/DashboardSkeleton';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import SectionHeader from './components/ui/SectionHeader';
import SavedArticles from './SavedArticles'; // Preserved
import AccountSettings from './AccountSettings'; // Preserved

// --- NEW MODAL ---
import DataTransparencyModal from './components/modals/DataTransparencyModal';

import { 
    leanColors, 
    sentimentColors, 
    qualityColors, 
    getChartTheme, 
    getDoughnutChartOptions, 
    getBarChartOptions, 
    getLineChartOptions 
} from './utils/ChartConfig';

import BiasMap from './components/BiasMap';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, TimeScale
);

// Helper for Chart Data
const getActionCount = (totals: any[], action: string) => {
  const item = (totals || []).find((t: any) => t.action === action);
  return item ? item.count : 0;
};

const MyDashboard: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'history' | 'feed' | 'settings'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [showTransparency, setShowTransparency] = useState(false); // New State

  // Fetch Data (Preserved Existing Logic)
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['profileStats', timeRange],
    queryFn: async () => {
      const res = await api.get('/profile/stats');
      const profileRes = await api.get('/profile/me'); // Fetch profile for streak data
      return { ...res.data, profile: profileRes.data };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, 
  });

  // Theme Logic
  const theme = useMemo(() => getChartTheme(), []);

  // --- CHART DATA PREPARATION (Preserved) ---
  const storiesReadData: ChartData<'line'> = useMemo(() => {
    if (!statsData?.dailyCounts) return { datasets: [] };
    return {
      labels: statsData.dailyCounts.map((d: any) => d.date),
      datasets: [
        {
          label: 'Articles Read',
          data: statsData.dailyCounts.map((d: any) => d.count),
          borderColor: theme.primary,
          backgroundColor: theme.primary + '33',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  }, [statsData, theme]);

  const categoryReadData: ChartData<'bar'> = useMemo(() => {
    if (!statsData?.categoryDistribution_read) return { datasets: [] };
    const sorted = [...statsData.categoryDistribution_read].sort((a,b) => b.count - a.count).slice(0, 5);
    return {
      labels: sorted.map((d: any) => d.category),
      datasets: [{
        label: 'Articles',
        data: sorted.map((d: any) => d.count),
        backgroundColor: sorted.map((_, i) => Object.values(theme.charts)[i % 5]),
        borderRadius: 4,
      }]
    };
  }, [statsData, theme]);

  const topSourcesData: ChartData<'bar'> = useMemo(() => {
     // Placeholder if source data isn't in backend yet, strictly preserving structure
     return {
         labels: [],
         datasets: []
     };
  }, [statsData]);

  const sentimentReadData: ChartData<'doughnut'> = useMemo(() => {
      // Placeholder structure
      return { labels: [], datasets: [] };
  }, [statsData]);

  const qualityReadData: ChartData<'doughnut'> = useMemo(() => {
    if (!statsData?.qualityDistribution_read) return { datasets: [] };
    return {
      labels: statsData.qualityDistribution_read.map((d: any) => d.grade),
      datasets: [{
        data: statsData.qualityDistribution_read.map((d: any) => d.count),
        backgroundColor: statsData.qualityDistribution_read.map((d: any) => qualityColors[d.grade as keyof typeof qualityColors] || qualityColors.C),
        borderWidth: 0
      }]
    };
  }, [statsData]);

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <div className="error-state">Failed to load dashboard data.</div>;

  // --- RENDER FUNCTIONS ---

  const renderOverview = () => (
    <div className="dashboard-grid animate-fade-in">
        
        {/* --- ROW 1: KEY STATS (Enhanced with Streak Freezes) --- */}
        <div className="stats-row">
            <Card className="stat-card">
                <div className="stat-value">{statsData?.profile?.articlesViewedCount || 0}</div>
                <div className="stat-label">Stories Read</div>
            </Card>

            <Card className="stat-card highlight-card">
                <div className="flex-row-between">
                    <div className="stat-value">
                        {statsData?.profile?.currentStreak || 0} <span className="text-sm">Days</span>
                    </div>
                    <TrendingUp size={24} className="text-white opacity-80" />
                </div>
                <div className="stat-label text-white">Current Streak</div>
                
                {/* NEW: Freeze Indicator */}
                <div className="freeze-indicator mt-2 flex items-center gap-1 text-xs text-white opacity-90">
                    <Snowflake size={12} />
                    {statsData?.profile?.streakFreezes || 0} Freezes Available
                </div>
            </Card>

            <Card className="stat-card">
                <div className="stat-value">
                   {statsData?.qualityDistribution_read?.length ? 'B+' : '-'}
                </div>
                <div className="stat-label">Avg Trust Score</div>
            </Card>
        </div>

        {/* --- ROW 2: HABITS & TRANSPARENCY (NEW) --- */}
        <div className="grid-2-col">
            
            {/* 1. Habit Tracking Card */}
            <Card className="flex flex-col gap-3">
                <div className="flex-row-between mb-2">
                    <h3 className="flex items-center gap-2"><Target size={18} /> Daily Habits</h3>
                    <Button variant="text" size="sm" className="text-xs">Edit</Button>
                </div>
                
                <div className="habit-item">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Daily Reading (15m)</span>
                        <span className="font-bold text-primary">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                </div>

                <div className="habit-item mt-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Deep Dives (3/wk)</span>
                        <span className="font-bold text-green-600">1/3</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '33%' }}></div>
                    </div>
                </div>
            </Card>

            {/* 2. Data Transparency Card */}
            <Card 
                className="cursor-pointer hover:shadow-md transition-all flex flex-col justify-center items-center text-center gap-2"
                onClick={() => setShowTransparency(true)}
            >
                <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                    <Shield size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Data Transparency</h3>
                    <p className="text-sm text-gray-500">See what the AI knows about you.</p>
                </div>
                <Button variant="outline" size="sm" className="mt-2">View Profile Data</Button>
            </Card>
        </div>

        {/* --- ROW 3: CHARTS (Preserved) --- */}
        <Card className="full-width-card">
            <SectionHeader title="Reading Activity" subtitle="Your consumption over time" />
            <div className="chart-container">
                <Line options={getLineChartOptions(theme)} data={storiesReadData} />
            </div>
        </Card>

        <Card className="full-width-card">
            <SectionHeader title="Bias vs. Trust Map" subtitle="The political landscape of your reading" />
            <div className="chart-container-large">
                <BiasMap articles={statsData?.allArticles || []} theme={theme} />
            </div>
        </Card>

        <div className="charts-grid-row">
            <Card>
                <h3>Top Categories</h3>
                <div className="chart-container">
                    <Bar options={getBarChartOptions('', 'Articles', theme)} data={categoryReadData} />
                </div>
            </Card>

            <Card>
                <h3>Quality Grade</h3>
                <div className="chart-container">
                    <Doughnut options={getDoughnutChartOptions('', theme)} data={qualityReadData} />
                </div>
            </Card>
        </div>

    </div>
  );

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
           <h1 className="text-2xl font-bold">Hello, {user?.displayName || statsData?.profile?.username || 'Reader'}</h1>
           <p className="text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {/* TABS */}
      <div className="dashboard-tabs">
        <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}
        >
            Overview
        </button>
        <button 
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`} 
            onClick={() => setActiveTab('saved')}
        >
            Saved Stories
        </button>
        <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} 
            onClick={() => setActiveTab('history')}
        >
            History
        </button>
        <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('settings')}
        >
            Settings
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        
        {activeTab === 'saved' && (
            <SavedArticles />
        )}

        {activeTab === 'history' && (
            <div className="empty-state-container">
                <h3>Reading History</h3>
                <p>Your detailed reading log will appear here.</p>
            </div>
        )}

        {activeTab === 'settings' && (
            <AccountSettings />
        )}
      </div>

      {/* MODALS */}
      {showTransparency && (
        <DataTransparencyModal onClose={() => setShowTransparency(false)} />
      )}
    </div>
  );
};

export default MyDashboard;
