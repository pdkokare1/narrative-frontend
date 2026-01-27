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
  Snowflake, 
  Zap,       
  Brain,
  Wind,      
  Anchor,    
  Scale,     
  Sun,       
  Activity,
  CheckCircle, 
  Circle,
  Settings
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
  deepFocusMinutes?: number; 
  engagementScore: number;
  
  readingStyle?: 'skimmer' | 'deep_reader' | 'balanced' | 'learner';
  diversityScore?: number; 
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

  const getFocusLabel = (score: number) => {
    if (score >= 90) return { label: 'Deep Focus', color: 'text-green-400' };
    if (score >= 70) return { label: 'Attentive', color: 'text-blue-400' };
    if (score >= 50) return { label: 'Casual', color: 'text-yellow-400' };
    return { label: 'Distracted', color: 'text-orange-400' };
  };

  const focusData = getFocusLabel(stats?.focusScoreAvg || 100);

  // Persona Logic
  const getPersonaDetails = (style: string = 'balanced') => {
    switch(style) {
      case 'skimmer': 
        return { label: 'The Scanner', desc: 'Fast & efficient.', icon: <Wind size={20} className="text-cyan-400" /> };
      case 'deep_reader': 
        return { label: 'Deep Diver', desc: 'Thorough & focused.', icon: <Anchor size={20} className="text-indigo-400" /> };
      case 'learner': 
        return { label: 'The Scholar', desc: 'Curious & steady.', icon: <BookOpen size={20} className="text-emerald-400" /> };
      default: 
        return { label: 'Balanced', desc: 'Adaptive reader.', icon: <Scale size={20} className="text-violet-400" /> };
    }
  };

  const persona = getPersonaDetails(stats?.readingStyle);

  // Diversity Logic
  const getDiversityLabel = (score: number = 50) => {
    if (score >= 90) return { label: 'Omnivore', desc: 'Balanced diet.', color: 'bg-green-500', text: 'text-green-400' };
    if (score >= 70) return { label: 'Balanced', desc: 'Healthy mix.', color: 'bg-blue-500', text: 'text-blue-400' };
    if (score >= 50) return { label: 'Leaning', desc: 'Slight preference.', color: 'bg-yellow-500', text: 'text-yellow-400' };
    return { label: 'Echo Chamber', desc: 'High bias.', color: 'bg-red-500', text: 'text-red-400' };
  };

  const diversity = getDiversityLabel(stats?.diversityScore);

  // Golden Hour
  const formatGoldenHour = (hour: number) => {
    if (hour === undefined || hour === null) return 'Not yet calculated';
    const d = new Date();
    d.setHours(hour, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // --- Chart Configuration ---
  const chartData = {
    labels: stats?.recentDailyHistory?.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }) || [],
    datasets: [
      {
        label: 'Minutes Read',
        data: stats?.recentDailyHistory?.map(d => Math.round(d.timeSpent / 60)) || [],
        borderColor: '#60A5FA', // Blue-400
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#2563EB',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#E2E8F0',
        bodyColor: '#94A3B8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      }
    },
    scales: {
      y: {
        grid: { color: '#334155', drawBorder: false },
        ticks: { color: '#94A3B8', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8', font: { size: 10 } }
      }
    }
  };

  // Calculate Lean Percentages
  const totalLean = (stats?.leanExposure?.Left || 0) + (stats?.leanExposure?.Center || 0) + (stats?.leanExposure?.Right || 0) || 1;
  const pctLeft = Math.round(((stats?.leanExposure?.Left || 0) / totalLean) * 100);
  const pctCenter = Math.round(((stats?.leanExposure?.Center || 0) / totalLean) * 100);
  const pctRight = Math.round(((stats?.leanExposure?.Right || 0) / totalLean) * 100);

  return (
    <div className="dashboard-container">
      
      {/* 1. Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            My Narrative
          </h1>
          <p className="text-slate-400 mt-1">
            Overview of your reading journey.
          </p>
        </div>
        <div className="hidden md:block">
           <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono">
              Last updated: Just now
           </div>
        </div>
      </header>

      {/* 2. Bento Grid Layout */}
      <div className="dashboard-bento-grid">

        {/* --- ROW 1: KEY METRICS (All 3 columns wide = 4 items in a row) --- */}
        
        {/* Streak */}
        <div className="bento-card col-span-3">
          <Flame className="card-bg-icon text-orange-500" size={80} />
          <div className="card-header">
            <Flame size={16} className="text-orange-500" />
            <span className="card-title text-orange-400">Streak</span>
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
          <Clock className="card-bg-icon text-blue-500" size={80} />
          <div className="card-header">
            <Clock size={16} className="text-blue-500" />
            <span className="card-title text-blue-400">Time Read</span>
          </div>
          <div className="mt-auto">
             <div className="stat-value-large">{formatTime(stats?.totalTimeSpent || 0)}</div>
             <p className="stat-subtext">Total accumulation</p>
          </div>
        </div>

        {/* Articles */}
        <div className="bento-card col-span-3">
          <BookOpen className="card-bg-icon text-purple-500" size={80} />
          <div className="card-header">
            <BookOpen size={16} className="text-purple-500" />
            <span className="card-title text-purple-400">Stories</span>
          </div>
          <div className="mt-auto">
             <div className="stat-value-large">{stats?.articlesReadCount || 0}</div>
             <p className="stat-subtext">Articles completed</p>
          </div>
        </div>

        {/* Focus Score */}
        <div className="bento-card col-span-3">
          <Zap className="card-bg-icon text-yellow-500" size={80} />
          <div className="card-header">
            <Zap size={16} className="text-yellow-500" />
            <span className="card-title text-yellow-400">Focus</span>
          </div>
          <div className="mt-auto">
             <div className="flex items-baseline gap-2">
                <div className="stat-value-large">{stats?.focusScoreAvg || 100}</div>
                <span className="text-sm text-slate-500">/ 100</span>
             </div>
             <p className={`stat-subtext font-medium ${focusData.color}`}>{focusData.label}</p>
          </div>
        </div>


        {/* --- ROW 2: ACTIVITY & QUESTS --- */}

        {/* Chart (Takes 8 columns - 2/3 width) */}
        <div className="bento-card col-span-8">
           <div className="flex justify-between items-start mb-4">
              <div className="card-header mb-0">
                <BarChart2 size={16} className="text-slate-400" />
                <span className="card-title">Activity Monitor</span>
              </div>
              <div className="text-xs font-mono text-slate-500">Last 30 Days</div>
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

        {/* Daily Goals & Quests (Takes 4 columns - 1/3 width) */}
        <div className="bento-card col-span-4 flex flex-col gap-6">
           
           {/* Daily Goal Section */}
           <div>
              <div className="card-header justify-between">
                <div className="flex items-center gap-2">
                   <Target size={16} className="text-green-400" />
                   <span className="card-title text-green-400">Daily Goal</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                   {Math.round((stats?.dailyStats?.timeSpent || 0) / 60)} / 15m
                </span>
              </div>
              <div className="progress-track">
                  <div 
                    className={`progress-fill ${stats?.dailyStats?.goalsMet ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, ((stats?.dailyStats?.timeSpent || 0) / 900) * 100)}%` }}
                  />
              </div>
           </div>

           {/* Quests List */}
           <div className="flex-grow">
              <div className="card-header">
                <Award size={16} className="text-yellow-400" />
                <span className="card-title text-yellow-400">Quests</span>
              </div>
              
              <div className="flex flex-col gap-2">
                 {stats?.quests && stats.quests.length > 0 ? stats.quests.map(quest => (
                    <div key={quest.id} className="quest-item">
                       <div className={quest.isCompleted ? 'text-green-400' : 'text-slate-500'}>
                          {quest.isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${quest.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                             {quest.description}
                          </p>
                       </div>
                       <div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                          XP
                       </div>
                    </div>
                 )) : (
                   <p className="text-xs text-slate-500 italic">No active quests.</p>
                 )}
              </div>
           </div>
        </div>


        {/* --- ROW 3: INSIGHTS & DNA --- */}

        {/* Persona (4 Cols) */}
        <div className="bento-card col-span-4">
           <Activity className="card-bg-icon text-slate-600" size={100} />
           <div className="card-header">
              <Activity size={16} className="text-slate-400" />
              <span className="card-title">Reading Persona</span>
           </div>
           
           <div className="mt-2 flex items-center gap-4">
              <div className="dna-icon-box">
                 {persona.icon}
              </div>
              <div>
                 <h4 className="text-lg font-bold text-white">{persona.label}</h4>
                 <p className="text-xs text-slate-400">{persona.desc}</p>
              </div>
           </div>
        </div>

        {/* Media Diet (4 Cols) */}
        <div className="bento-card col-span-4">
           <Scale className="card-bg-icon text-slate-600" size={100} />
           <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                 <Scale size={16} className="text-slate-400" />
                 <span className="card-title">Media Diet</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${diversity.color} text-white`}>
                {diversity.label}
              </span>
           </div>

           <div className="mt-2">
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-800 mb-2">
                 <div style={{ width: `${pctLeft}%` }} className="h-full bg-blue-500" />
                 <div style={{ width: `${pctCenter}%` }} className="h-full bg-slate-500" />
                 <div style={{ width: `${pctRight}%` }} className="h-full bg-red-500" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                 <span>L: {pctLeft}%</span>
                 <span>C: {pctCenter}%</span>
                 <span>R: {pctRight}%</span>
              </div>
           </div>
        </div>

        {/* Golden Hour (4 Cols) */}
        <div className="bento-card col-span-4">
           <Sun className="card-bg-icon text-yellow-600" size={100} />
           <div className="card-header">
              <Sun size={16} className="text-yellow-400" />
              <span className="card-title text-yellow-400">Peak Time</span>
           </div>
           
           <div className="mt-auto">
              <div className="text-3xl font-bold text-white">
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
