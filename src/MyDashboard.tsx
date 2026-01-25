// src/MyDashboard.tsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { useQuery } from '@tanstack/react-query'; 
import api from './services/api'; 
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

// --- ICONS ---
import { Shield, TrendingUp, Snowflake, ChevronRight, Target, Zap, Clock, BookOpen, Award } from 'lucide-react';

import DashboardSkeleton from './components/ui/DashboardSkeleton';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import SectionHeader from './components/ui/SectionHeader';
import SavedArticles from './SavedArticles'; 
import AccountSettings from './AccountSettings'; 

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

// Helper for Time Formatting
const formatTime = (seconds: number) => {
  if (!seconds || seconds === 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
};

// --- NEW: Reader Persona Logic ---
const getReaderPersona = (avgSpan: number, readCount: number) => {
    if (readCount < 5) return { label: "Newcomer", color: "#9CA3AF", icon: BookOpen, desc: "Start reading to unlock your persona." }; // Gray
    if (avgSpan < 45) return { label: "Skimmer", color: "#F59E0B", icon: Zap, desc: "You prefer quick updates. Try slowing down for deeper insights." }; // Amber
    if (avgSpan < 180) return { label: "Balanced Reader", color: "#3B82F6", icon: Clock, desc: "Good balance between speed and depth." }; // Blue
    return { label: "Deep Diver", color: "#10B981", icon: Award, desc: "You engage deeply with content. Excellent focus!" }; // Emerald
};

interface MyDashboardProps {
    theme: string;
}

const MyDashboard: React.FC<MyDashboardProps> = ({ theme }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'history' | 'feed' | 'settings'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [showTransparency, setShowTransparency] = useState(false); // New State

  // Fetch Data
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
  const themeConfig = useMemo(() => getChartTheme(theme), [theme]);

  // --- CHART DATA PREPARATION ---
  
  // 1. Line Chart (Stories over time)
  const storiesReadData: ChartData<'line'> = useMemo(() => {
    if (!statsData?.dailyCounts) return { datasets: [] };
    return {
      labels: statsData.dailyCounts.map((d: any) => d.date),
      datasets: [
        {
          label: 'Articles Read',
          data: statsData.dailyCounts.map((d: any) => d.count),
          borderColor: themeConfig.primary,
          backgroundColor: themeConfig.primary + '33', // 20% opacity
          fill: true,
          tension: 0.4,
        }
      ]
    };
  }, [statsData, themeConfig]);

  // 2. Bar Chart (Categories)
  const categoryReadData: ChartData<'bar'> = useMemo(() => {
    if (!statsData?.categoryDistribution_read) return { datasets: [] };
    const sorted = [...statsData.categoryDistribution_read].sort((a: any, b: any) => b.count - a.count).slice(0, 5);
    return {
      labels: sorted.map((d: any) => d.category),
      datasets: [{
        label: 'Articles',
        data: sorted.map((d: any) => d.count),
        backgroundColor: sorted.map((_: any, i: number) => themeConfig.charts[i % themeConfig.charts.length]),
        borderRadius: 4,
      }]
    };
  }, [statsData, themeConfig]);

  // 3. Bar Chart (Top Sources) - RESTORED
  const topSourcesData: ChartData<'bar'> = useMemo(() => {
     if (!statsData?.sourceDistribution) return { labels: [], datasets: [] };
     const sorted = [...statsData.sourceDistribution].sort((a: any, b: any) => b.count - a.count).slice(0, 5);
     return {
         labels: sorted.map((d: any) => d.source),
         datasets: [{
            label: 'Articles',
            data: sorted.map((d: any) => d.count),
            backgroundColor: themeConfig.secondary,
            borderRadius: 4
         }]
     };
  }, [statsData, themeConfig]);

  // 4. Doughnut (Sentiment) - RESTORED
  const sentimentReadData: ChartData<'doughnut'> = useMemo(() => {
      if (!statsData?.sentimentDistribution) return { labels: [], datasets: [] };
      return {
        labels: statsData.sentimentDistribution.map((d: any) => d.label),
        datasets: [{
            data: statsData.sentimentDistribution.map((d: any) => d.count),
            backgroundColor: statsData.sentimentDistribution.map((d: any) => sentimentColors[d.label as keyof typeof sentimentColors] || '#ccc'),
            borderWidth: 0
        }]
      };
  }, [statsData]);

  // 5. Doughnut (Quality)
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

  const renderOverview = () => {
    // CALCULATE DAILY PROGRESS
    // Goal: 15 minutes (900 seconds)
    // Use dailyStats.timeSpent (TODAY) instead of totalTimeSpent (LIFETIME)
    const dailySeconds = statsData?.dailyStats?.timeSpent || 0;
    const dailyGoal = 900; 
    const dailyProgress = Math.min(100, Math.round((dailySeconds / dailyGoal) * 100));

    // Weekly Goal (Example: 3 Deep Dives)
    const weeklyReads = statsData?.articlesReadCount || 0; // This might be lifetime in current API, ideal to have weekly
    const weeklyTarget = 3;
    const weeklyProgress = Math.min(100, Math.round((weeklyReads / weeklyTarget) * 100));

    // Calculate Persona
    const persona = getReaderPersona(statsData?.averageAttentionSpan || 0, statsData?.articlesReadCount || 0);
    // Deep Diver Goal = 3 minutes (180s)
    const attentionProgress = Math.min(((statsData?.averageAttentionSpan || 0) / 180) * 100, 100);

    return (
    <div className="dashboard-grid animate-fade-in">
        
        {/* --- ROW 1: KEY STATS (Enhanced) --- */}
        <div className="stats-row">
            {/* 1. True Reads Card */}
            <Card className="stat-card">
                <div className="flex-row-between">
                     <div className="stat-value">
                        {/* Show True Reads, fall back to 0 */}
                        {statsData?.articlesReadCount || 0}
                     </div>
                     <BookOpen size={24} className="text-gray-400 opacity-60" />
                </div>
                <div className="stat-label">True Reads</div>
                <div className="text-xs text-gray-400 mt-1">
                    out of {statsData?.profile?.articlesViewedCount || 0} clicks
                </div>
            </Card>

            {/* 2. Streak Card */}
            <Card className="stat-card highlight-card">
                <div className="flex-row-between">
                    <div className="stat-value">
                        {statsData?.profile?.currentStreak || 0} <span className="text-sm">Days</span>
                    </div>
                    <TrendingUp size={24} className="text-white opacity-80" />
                </div>
                <div className="stat-label text-white">Current Streak</div>
                
                {/* Freeze Indicator */}
                <div className="freeze-indicator mt-2 flex items-center gap-1 text-xs text-white opacity-90">
                    <Snowflake size={12} />
                    {statsData?.profile?.streakFreezes || 0} Freezes Available
                </div>
            </Card>

            {/* 3. Attention Span (NEW) */}
            <Card className="stat-card">
                <div className="flex-row-between">
                     <div className="stat-value">
                        {formatTime(statsData?.averageAttentionSpan || 0)}
                     </div>
                     <Clock size={24} className="text-gray-400 opacity-60" />
                </div>
                <div className="stat-label">Avg. Attention Span</div>
            </Card>

            {/* 4. Trust Score (Preserved) */}
            <Card className="stat-card">
                <div className="stat-value">
                   {statsData?.qualityDistribution_read?.length ? 'B+' : '-'}
                </div>
                <div className="stat-label">Avg Trust Score</div>
            </Card>
        </div>

        {/* --- ROW 1.5: READER PERSONA & FOCUS METER (NEW) --- */}
        <Card 
            className="full-width-card" 
            style={{ 
                borderLeft: `4px solid ${persona.color}`,
                background: `linear-gradient(to right, ${persona.color}08, transparent)` 
            }}
        >
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                
                {/* Persona Label */}
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-white shadow-sm" style={{ color: persona.color }}>
                        <persona.icon size={24} />
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Reader Personality</div>
                        <div className="text-xl font-bold" style={{ color: persona.color }}>{persona.label}</div>
                    </div>
                </div>

                {/* Focus Meter */}
                <div className="flex-1 md:max-w-md w-full">
                    <div className="flex justify-between text-xs mb-1 text-gray-500">
                        <span>Current Focus: {formatTime(statsData?.averageAttentionSpan || 0)}</span>
                        <span>Goal: Deep Diver (3m+)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                            className="h-3 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${attentionProgress}%`, backgroundColor: persona.color }}
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-xs mt-1 text-gray-500 italic">
                        {persona.desc}
                    </p>
                </div>
            </div>
        </Card>

        {/* --- ROW 2: HABITS & TRANSPARENCY (NEW) --- */}
        <div className="grid-2-col">
            
            {/* Habit Tracking Card */}
            <Card className="flex flex-col gap-3">
                <div className="flex-row-between mb-2">
                    <h3 className="flex items-center gap-2"><Target size={18} /> Daily Habits</h3>
                    <Button variant="text" size="sm" className="text-xs">Edit</Button>
                </div>
                
                <div className="habit-item">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Daily Reading (15m)</span>
                        <span className="font-bold text-primary">
                             {dailyProgress}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${dailyProgress}%` }}
                        ></div>
                    </div>
                </div>

                <div className="habit-item mt-2">
                    <div className="flex justify-between text-sm mb-1">
                        <span>Deep Dives (True Reads)</span>
                        <span className="font-bold text-green-600">
                             {weeklyReads}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                             className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                             style={{ width: `${weeklyProgress}%` }}
                        ></div>
                    </div>
                </div>
            </Card>

            {/* Data Transparency Card */}
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

        {/* --- ROW 3: BIG CHARTS (Reading Activity & Bias Map) --- */}
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

        {/* --- ROW 4: DETAILED GRIDS (Restored All 4 Charts) --- */}
        <div className="charts-grid-row">
            <Card>
                <h3>Top Categories</h3>
                <div className="chart-container">
                    <Bar options={getBarChartOptions('', 'Articles', theme)} data={categoryReadData} />
                </div>
            </Card>

            <Card>
                <h3>Top Sources</h3>
                <div className="chart-container">
                    <Bar options={getBarChartOptions('', 'Articles', theme)} data={topSourcesData} />
                </div>
            </Card>

            <Card>
                <h3>Sentiment</h3>
                <div className="chart-container">
                    <Doughnut options={getDoughnutChartOptions('', theme)} data={sentimentReadData} />
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
  )};

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
            <SavedArticles 
                onToggleSave={() => {}} 
                onCompare={() => {}} 
                onAnalyze={() => {}} 
                onRead={() => {}} 
                showTooltip={() => {}} 
            />
        )}

        {activeTab === 'history' && (
            <div className="empty-state-container">
                <h3>Reading History</h3>
                <p>Your detailed reading log will appear here.</p>
            </div>
        )}

        {activeTab === 'settings' && (
            <AccountSettings 
                currentFontSize="medium" 
                onSetFontSize={() => {}} 
            />
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
