// src/MyDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { 
  Flame, 
  Clock, 
  BookOpen, 
  Target, 
  BarChart2,
  Share2,
  Award,
  Zap,       
  Brain,
  Wind,      
  Anchor,    
  Scale,     
  Sun,       
  Activity,
  CheckCircle, 
  Circle,
  Settings,
  AlertTriangle 
} from 'lucide-react';
import './MyDashboard.css';
import DashboardSkeleton from './components/ui/DashboardSkeleton';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { IQuest } from './types'; 

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyStat {
  date: string;
  timeSpent: number;
  articlesRead: number;
  goalsMet: boolean;
}

interface UserStats {
  userId: string;
  totalTimeSpent: number;
  articlesReadCount: number;
  averageAttentionSpan: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes?: number;
  focusScoreAvg?: number;
  engagementScore: number;
  
  readingStyle?: 'skimmer' | 'deep_reader' | 'balanced' | 'learner';
  diversityScore?: number; 
  suggestPalateCleanser?: boolean; 
  peakLearningTime?: number; 
  leanExposure?: {
    Left: number;
    Center: number;
    Right: number;
  };

  dailyStats: {
    date: string;
    timeSpent: number;
    articlesRead: number;
    goalsMet: boolean;
  };
  recentDailyHistory?: DailyStat[];
  quests?: IQuest[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MyDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/analytics/user-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to load stats');
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Dashboard Error:', err);
        setError('Could not load your progress.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, authLoading, navigate]);

  if (loading || authLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // --- Helper Functions ---
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  // --- Persona Logic (Updated to use Gold/Neutral icons) ---
  const getPersonaDetails = (style: string = 'balanced') => {
    switch(style) {
      case 'skimmer': 
        return { label: 'The Scanner', desc: 'Fast & efficient.', icon: <Wind size={24} /> };
      case 'deep_reader': 
        return { label: 'Deep Diver', desc: 'Thorough & focused.', icon: <Anchor size={24} /> };
      case 'learner': 
        return { label: 'The Scholar', desc: 'Curious & steady.', icon: <BookOpen size={24} /> };
      default: 
        return { label: 'Balanced', desc: 'Adaptive reader.', icon: <Scale size={24} /> };
    }
  };
  const persona = getPersonaDetails(stats?.readingStyle);

  // --- Health Logic (Uses CSS variables where possible via style props or classes) ---
  const calculateHealth = () => {
     let score = ((stats?.diversityScore || 50) + (stats?.focusScoreAvg || 75)) / 2;
     if (stats?.suggestPalateCleanser) score -= 15;
     score = Math.max(0, Math.min(100, Math.round(score)));

     // Determine Status Color
     let statusColor = 'var(--accent-primary)'; // Default Gold
     let label = 'Balanced';

     if (score >= 85) { label = 'Optimal'; statusColor = 'var(--color-success)'; } 
     else if (score >= 60) { label = 'Healthy'; statusColor = 'var(--color-info)'; }
     else if (score >= 40) { label = 'Unbalanced'; statusColor = 'var(--accent-primary)'; }
     else { label = 'Critical'; statusColor = 'var(--color-error)'; }

     return { score, label, statusColor };
  };
  const health = calculateHealth();

  // Golden Hour
  const formatGoldenHour = (hour: number) => {
    if (hour === undefined || hour === null) return 'Not yet calculated';
    const d = new Date();
    d.setHours(hour, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // --- Chart Configuration (UPDATED TO GOLD THEME) ---
  const chartData = {
    labels: stats?.recentDailyHistory?.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }) || [],
    datasets: [
      {
        label: 'Minutes Read',
        data: stats?.recentDailyHistory?.map(d => Math.round(d.timeSpent / 60)) || [],
        // The Gold Standard
        borderColor: '#D4AF37', 
        backgroundColor: 'rgba(212, 175, 55, 0.1)', 
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#D4AF37',
        pointBorderColor: '#141414', // bg-card color
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#D4AF37',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#141414', // bg-card
        titleColor: '#D4AF37', // accent-primary
        bodyColor: '#EDEDED', // text-primary
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#A1A1A1', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#A1A1A1', font: { size: 10 } }
      }
    }
  };

  // Lean Percentages
  const totalLean = (stats?.leanExposure?.Left || 0) + (stats?.leanExposure?.Center || 0) + (stats?.leanExposure?.Right || 0) || 1;
  const pctLeft = Math.round(((stats?.leanExposure?.Left || 0) / totalLean) * 100);
  const pctCenter = Math.round(((stats?.leanExposure?.Center || 0) / totalLean) * 100);
  const pctRight = Math.round(((stats?.leanExposure?.Right || 0) / totalLean) * 100);

  return (
    <div className="dashboard-container">
      
      {/* 1. Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold" style={{ 
              fontFamily: 'var(--font-heading)', 
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em'
          }}>
            My Narrative
          </h1>
          <p style={{ color: 'var(--text-tertiary)' }} className="mt-1">
            Overview of your reading journey.
          </p>
        </div>
        <div className="hidden md:block">
           <div className="dashboard-badge badge-gold">
              Beta Access
           </div>
        </div>
      </header>

      {/* 2. Bento Grid Layout */}
      <div className="dashboard-bento-grid">

        {/* --- ROW 1: KEY METRICS --- */}
        
        {/* Streak */}
        <div className="bento-card col-span-3">
          <Flame className="card-bg-icon" size={80} />
          <div className="card-header">
            <Flame size={18} style={{ color: 'var(--accent-primary)' }} />
            <span className="card-title">Streak</span>
          </div>
          <div className="mt-auto">
             <div className="flex items-baseline gap-2">
                <div className="stat-value-large">{stats?.currentStreak || 0}</div>
                <span className="text-sm text-slate-500">days</span>
             </div>
             <p className="stat-subtext">Best: {stats?.longestStreak || 0} days</p>
          </div>
        </div>

        {/* Time Read */}
        <div className="bento-card col-span-3">
          <Clock className="card-bg-icon" size={80} />
          <div className="card-header">
            <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
            <span className="card-title">Time Read</span>
          </div>
          <div className="mt-auto">
             <div className="stat-value-large">{formatTime(stats?.totalTimeSpent || 0)}</div>
             <p className="stat-subtext">Total accumulation</p>
          </div>
        </div>

        {/* Stories */}
        <div className="bento-card col-span-3">
          <BookOpen className="card-bg-icon" size={80} />
          <div className="card-header">
            <BookOpen size={18} style={{ color: 'var(--accent-primary)' }} />
            <span className="card-title">Stories</span>
          </div>
          <div className="mt-auto">
             <div className="stat-value-large">{stats?.articlesReadCount || 0}</div>
             <p className="stat-subtext">Articles completed</p>
          </div>
        </div>

        {/* Focus Score */}
        <div className="bento-card col-span-3">
          <Zap className="card-bg-icon" size={80} />
          <div className="card-header">
            <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
            <span className="card-title">Focus</span>
          </div>
          <div className="mt-auto">
             <div className="flex items-baseline gap-2">
                <div className="stat-value-large">{stats?.focusScoreAvg || 100}</div>
                <span className="text-sm text-slate-500">/ 100</span>
             </div>
             <p className="stat-subtext" style={{ color: 'var(--text-secondary)' }}>
                Average attention span
             </p>
          </div>
        </div>


        {/* --- ROW 2: ACTIVITY & QUESTS --- */}

        {/* Chart (Takes 8 columns) */}
        <div className="bento-card col-span-8">
           <div className="flex justify-between items-start mb-4">
              <div className="card-header mb-0">
                <BarChart2 size={18} style={{ color: 'var(--text-tertiary)' }} />
                <span className="card-title">Activity Monitor</span>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>Last 30 Days</div>
           </div>
           
           <div className="chart-wrapper">
             {stats?.recentDailyHistory && stats.recentDailyHistory.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600">
                  No data available yet.
                </div>
              )}
           </div>
        </div>

        {/* Daily Goals & Quests (Takes 4 columns) */}
        <div className="bento-card col-span-4 flex flex-col gap-6">
           
           {/* Daily Goal Section */}
           <div>
              <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                   <Target size={18} style={{ color: 'var(--color-success)' }} />
                   <span className="card-title" style={{ color: 'var(--color-success)' }}>Daily Goal</span>
                </div>
                <span className="dashboard-badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                   {Math.round((stats?.dailyStats?.timeSpent || 0) / 60)} / 15m
                </span>
              </div>
              
              <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ 
                        width: `${Math.min(100, ((stats?.dailyStats?.timeSpent || 0) / 900) * 100)}%`,
                        // Use Success Green if met, otherwise Gold
                        background: stats?.dailyStats?.goalsMet ? 'var(--color-success)' : 'var(--accent-primary)'
                    }}
                  />
              </div>
           </div>

           {/* Quests List */}
           <div className="flex-grow">
              <div className="card-header">
                <Award size={18} style={{ color: 'var(--accent-primary)' }} />
                <span className="card-title">Quests</span>
              </div>
              
              <div className="flex flex-col gap-2">
                 {stats?.quests && stats.quests.length > 0 ? stats.quests.map(quest => (
                    <div key={quest.id} className="quest-item">
                       <div style={{ color: quest.isCompleted ? 'var(--color-success)' : 'var(--text-tertiary)' }}>
                          {quest.isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className={`quest-desc ${quest.isCompleted ? 'completed' : ''}`}>
                             {quest.description}
                          </p>
                       </div>
                    </div>
                 )) : (
                   <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>No active quests.</p>
                 )}
              </div>
           </div>
        </div>


        {/* --- ROW 3: INSIGHTS & DNA --- */}

        {/* Persona (4 Cols) */}
        <div className="bento-card col-span-4">
           <Activity className="card-bg-icon" size={100} />
           <div className="card-header">
              <Activity size={18} style={{ color: 'var(--text-tertiary)' }} />
              <span className="card-title">Reading Persona</span>
           </div>
           
           <div className="mt-2 flex items-center gap-4">
              <div className="dna-icon-box">
                 {persona.icon}
              </div>
              <div>
                 <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{persona.label}</h4>
                 <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{persona.desc}</p>
              </div>
           </div>
        </div>

        {/* Cognitive Health (4 Cols) */}
        <div className="bento-card col-span-4">
           <Brain className="card-bg-icon" size={120} />
           
           <div className="card-header justify-between relative z-10">
              <div className="flex items-center gap-2">
                 <Brain size={18} style={{ color: health.statusColor }} />
                 <span className="card-title" style={{ color: health.statusColor }}>Cognitive Health</span>
              </div>
              <span className="dashboard-badge" style={{ background: health.statusColor, color: 'white' }}>
                {health.label}
              </span>
           </div>

           <div className="mt-2 relative z-10">
              <div className="flex items-end justify-between mb-3">
                 <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{health.score}</span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>/ 100</span>
                 </div>
                 {/* Warning for Doomscrolling */}
                 {stats?.suggestPalateCleanser && (
                     <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--color-error)' }}>
                        <AlertTriangle size={12} />
                        <span>High Load</span>
                     </div>
                 )}
              </div>
              
              {/* Diversity Bar Integration */}
              <div className="space-y-1">
                 <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    <span>L</span>
                    <span>Diversity Mix</span>
                    <span>R</span>
                 </div>
                 <div className="flex h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: `${pctLeft}%`, background: 'var(--color-lean-left)' }} />
                    <div style={{ width: `${pctCenter}%`, background: 'var(--color-lean-center)' }} />
                    <div style={{ width: `${pctRight}%`, background: 'var(--color-lean-right)' }} />
                 </div>
              </div>
           </div>
        </div>

        {/* Golden Hour (4 Cols) */}
        <div className="bento-card col-span-4">
           <Sun className="card-bg-icon" size={100} />
           <div className="card-header">
              <Sun size={18} style={{ color: 'var(--accent-primary)' }} />
              <span className="card-title">Peak Time</span>
           </div>
           
           <div className="mt-auto">
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                 {stats?.peakLearningTime !== undefined ? formatGoldenHour(stats.peakLearningTime) : '--:--'}
              </div>
              <p className="stat-subtext">Your optimal reading window</p>
           </div>
        </div>

        {/* --- ROW 4: FOOTER ACTIONS (Full Width) --- */}
        <div className="col-span-12 flex flex-col md:flex-row gap-4 mt-4">
           <button onClick={() => navigate('/settings')} className="action-btn flex-1">
              <Settings size={18} /> Manage Account
           </button>
           <button className="action-btn flex-1">
              <Share2 size={18} /> Share My Stats
           </button>
        </div>

      </div>
    </div>
  );
};

export default MyDashboard;
