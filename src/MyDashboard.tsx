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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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
  currentStreak: number;
  longestStreak: number;
  focusScoreAvg?: number;
  readingStyle?: 'skimmer' | 'deep_reader' | 'balanced' | 'learner';
  diversityScore?: number; 
  suggestPalateCleanser?: boolean; 
  peakLearningTime?: number; 
  leanExposure?: { Left: number; Center: number; Right: number; };
  dailyStats: { timeSpent: number; goalsMet: boolean; };
  recentDailyHistory?: DailyStat[];
  quests?: IQuest[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MyDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }

    const fetchStats = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/analytics/user-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Stats Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, authLoading, navigate]);

  if (loading || authLoading) return <DashboardSkeleton />;

  // --- Logic Helpers ---

  // 1. Calculate Narrative Health (Restored Logic)
  const calculateHealth = () => {
     const diversity = stats?.diversityScore || 50;
     const focus = stats?.focusScoreAvg || 75;
     
     // Base score average
     let score = (diversity + focus) / 2;

     // Penalty for Doomscrolling (Restored)
     if (stats?.suggestPalateCleanser) {
        score -= 15;
     }

     score = Math.max(0, Math.min(100, Math.round(score)));

     // Determine Status Label & Color Variable
     let label = 'Balanced';
     let color = 'var(--accent-primary)'; // Gold default

     if (score >= 85) { 
         label = 'Optimal'; 
         color = 'var(--color-success)'; 
     } else if (score >= 60) { 
         label = 'Healthy'; 
         color = 'var(--color-info)'; 
     } else if (score >= 40) { 
         label = 'Unbalanced'; 
         color = 'var(--accent-primary)'; 
     } else { 
         label = 'Critical'; 
         color = 'var(--color-error)'; 
     }

     return { score, label, color };
  };
  const health = calculateHealth();

  // 2. Persona Logic (Restored Descriptions)
  const getPersona = (style: string = 'balanced') => {
    switch(style) {
      case 'skimmer': 
        return { label: 'The Scanner', desc: 'Fast & efficient.', icon: <Wind size={20} /> };
      case 'deep_reader': 
        return { label: 'Deep Diver', desc: 'Thorough & focused.', icon: <Anchor size={20} /> };
      case 'learner': 
        return { label: 'The Scholar', desc: 'Curious & steady.', icon: <BookOpen size={20} /> };
      default: 
        return { label: 'Balanced', desc: 'Adaptive reader.', icon: <Scale size={20} /> };
    }
  };
  const persona = getPersona(stats?.readingStyle);

  // 3. Focus Label Logic (Restored)
  const getFocusLabel = (score: number) => {
    if (score >= 90) return 'Deep Focus';
    if (score >= 70) return 'Attentive';
    if (score >= 50) return 'Casual';
    return 'Distracted';
  };
  const focusLabel = getFocusLabel(stats?.focusScoreAvg || 100);

  // 4. Golden Hour Formatter
  const formatGoldenHour = (hour?: number) => {
    if (hour === undefined || hour === null) return '--:--';
    const d = new Date();
    d.setHours(hour, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // --- Chart Config (Golden Thread) ---
  const chartData = {
    labels: stats?.recentDailyHistory?.map(d => new Date(d.date).getDate().toString()) || [],
    datasets: [{
      data: stats?.recentDailyHistory?.map(d => Math.round(d.timeSpent / 60)) || [],
      borderColor: '#D4AF37',
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#D4AF37',
      pointHoverBorderColor: '#000',
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  // --- Diversity Calculations ---
  const totalLean = (stats?.leanExposure?.Left || 0) + (stats?.leanExposure?.Center || 0) + (stats?.leanExposure?.Right || 0) || 1;
  const pctLeft = ((stats?.leanExposure?.Left || 0) / totalLean) * 100;
  const pctCenter = ((stats?.leanExposure?.Center || 0) / totalLean) * 100;
  const pctRight = ((stats?.leanExposure?.Right || 0) / totalLean) * 100;

  return (
    <div className="dashboard-container">
      
      {/* 1. Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">My Narrative</h1>
          <p className="dashboard-subtitle">Your intellectual footprint, analyzed.</p>
        </div>
        <div className="hidden md:block">
           <span className="beta-badge">Beta Access</span>
        </div>
      </header>

      {/* 2. Grid */}
      <div className="dashboard-bento-grid">

        {/* --- ROW 1: PRIMARY METRICS (Small Cards) --- */}
        
        {/* Streak */}
        <div className="bento-card col-span-3">
           <div className="card-header">
              <div className="header-label">
                 <Flame size={16} style={{ color: 'var(--accent-primary)' }} />
                 <span className="card-title">Streak</span>
              </div>
           </div>
           <div className="stat-value-large">
              {stats?.currentStreak || 0}<span className="stat-unit">days</span>
           </div>
           <p className="stat-subtext">Best: {stats?.longestStreak || 0} days</p>
           <Flame className="card-bg-icon" size={64} />
        </div>

        {/* Total Time */}
        <div className="bento-card col-span-3">
           <div className="card-header">
              <div className="header-label">
                 <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
                 <span className="card-title">Total Time</span>
              </div>
           </div>
           <div className="stat-value-large">
              {Math.floor((stats?.totalTimeSpent || 0) / 3600)}<span className="stat-unit">h</span>
           </div>
           <p className="stat-subtext">Lifetime reading</p>
           <Clock className="card-bg-icon" size={64} />
        </div>

        {/* Stories */}
        <div className="bento-card col-span-3">
           <div className="card-header">
              <div className="header-label">
                 <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} />
                 <span className="card-title">Stories</span>
              </div>
           </div>
           <div className="stat-value-large">
              {stats?.articlesReadCount || 0}
           </div>
           <p className="stat-subtext">Articles analyzed</p>
           <BookOpen className="card-bg-icon" size={64} />
        </div>

        {/* Focus Score */}
        <div className="bento-card col-span-3">
           <div className="card-header">
              <div className="header-label">
                 <Zap size={16} style={{ color: 'var(--accent-primary)' }} />
                 <span className="card-title">Focus</span>
              </div>
           </div>
           <div className="stat-value-large">
              {stats?.focusScoreAvg || 100}<span className="stat-unit">%</span>
           </div>
           {/* Restored: Dynamic Focus Label */}
           <p className="stat-subtext" style={{ color: 'var(--text-secondary)' }}>{focusLabel}</p>
           <Zap className="card-bg-icon" size={64} />
        </div>


        {/* --- ROW 2: DEEP DIVE (Chart + Quests) --- */}

        {/* Activity Chart */}
        <div className="bento-card col-span-8">
           <div className="card-header">
              <div className="header-label">
                 <BarChart2 size={16} style={{ color: 'var(--text-tertiary)' }} />
                 <span className="card-title">Activity Monitor</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Last 30 Days</span>
           </div>
           <div className="chart-container">
               {stats?.recentDailyHistory ? (
                   <Line data={chartData} options={chartOptions} />
               ) : (
                   <div className="flex items-center justify-center h-full text-sm text-slate-500">No data available</div>
               )}
           </div>
        </div>

        {/* Daily Quests */}
        <div className="bento-card col-span-4">
           <div className="card-header">
              <div className="header-label">
                 <Target size={16} style={{ color: 'var(--accent-primary)' }} />
                 <span className="card-title">Daily Focus</span>
              </div>
           </div>
           
           {/* Daily Goal Progress */}
           <div className="mb-6">
               <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <span>Reading Goal</span>
                  <span>{Math.round((stats?.dailyStats?.timeSpent || 0) / 60)} / 15m</span>
               </div>
               <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div 
                      className="h-full transition-all duration-1000"
                      style={{ 
                          width: `${Math.min(100, ((stats?.dailyStats?.timeSpent || 0) / 900) * 100)}%`,
                          background: stats?.dailyStats?.goalsMet ? 'var(--color-success)' : 'var(--accent-primary)'
                      }}
                   />
               </div>
           </div>

           {/* Quests List */}
           <div className="quest-list">
               {stats?.quests?.map(q => (
                   <div key={q.id} className={`quest-item ${q.isCompleted ? 'completed' : ''}`}>
                       {q.isCompleted ? 
                           <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> : 
                           <Circle size={16} style={{ color: 'var(--text-tertiary)' }} />
                       }
                       <span className="quest-text">{q.description}</span>
                   </div>
               ))}
               {(!stats?.quests || stats.quests.length === 0) && (
                   <p className="text-xs text-center italic mt-4" style={{ color: 'var(--text-tertiary)' }}>
                       All systems nominal. No active quests.
                   </p>
               )}
           </div>
        </div>


        {/* --- ROW 3: INSIGHTS (Health, Persona, Time) --- */}

        {/* Cognitive Health */}
        <div className="bento-card col-span-4">
            <div className="card-header">
                <div className="header-label">
                    <Brain size={16} style={{ color: health.color }} />
                    <span className="card-title" style={{ color: health.color }}>Cognitive Health</span>
                </div>
            </div>
            
            <div className="health-score-row">
                <span className="stat-value-large">{health.score}</span>
                <span className="health-status-badge" style={{ color: health.color, borderColor: health.color }}>
                    {health.label}
                </span>
            </div>

            {/* Restored: Doomscrolling Warning */}
            {stats?.suggestPalateCleanser && (
                <div className="flex items-center gap-2 mb-3 text-xs font-bold" style={{ color: 'var(--color-error)' }}>
                    <AlertTriangle size={14} />
                    <span>High Load Detect - Take a Break</span>
                </div>
            )}

            {/* Diversity Bar */}
            <div className="diversity-container">
                <div className="diversity-labels">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                </div>
                <div className="diversity-bar">
                    <div style={{ width: `${pctLeft}%`, background: 'var(--color-lean-left)' }} />
                    <div style={{ width: `${pctCenter}%`, background: 'var(--color-lean-center)' }} />
                    <div style={{ width: `${pctRight}%`, background: 'var(--color-lean-right)' }} />
                </div>
            </div>
            <Brain className="card-bg-icon" size={80} />
        </div>

        {/* Persona */}
        <div className="bento-card col-span-4">
            <div className="card-header">
                <div className="header-label">
                    <Activity size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span className="card-title">Persona</span>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
                <div style={{ 
                    padding: '12px', 
                    borderRadius: '12px', 
                    background: 'var(--bg-elevated)', 
                    color: 'var(--accent-primary)' 
                }}>
                    {persona.icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{persona.label}</h3>
                    {/* Restored: Description */}
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{persona.desc}</p>
                </div>
            </div>
            <Activity className="card-bg-icon" size={80} />
        </div>

        {/* Peak Time */}
        <div className="bento-card col-span-4">
            <div className="card-header">
                <div className="header-label">
                    <Sun size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span className="card-title">Peak Time</span>
                </div>
            </div>
            <div className="stat-value-large">
                {formatGoldenHour(stats?.peakLearningTime)}
            </div>
            <p className="stat-subtext">Optimal engagement window</p>
            <Sun className="card-bg-icon" size={80} />
        </div>

        {/* --- ROW 4: ACTIONS --- */}
        <div className="col-span-12 action-grid">
            <button onClick={() => navigate('/settings')} className="dashboard-btn">
                <Settings size={18} /> Account Settings
            </button>
            <button className="dashboard-btn">
                <Share2 size={18} /> Share Report
            </button>
        </div>

      </div>
    </div>
  );
};

export default MyDashboard;
