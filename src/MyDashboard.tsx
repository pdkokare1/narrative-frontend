import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Clock, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Calendar,
  BarChart2,
  Share2,
  Award,
  Snowflake, // NEW: For Streak Freeze
  Zap,       // NEW: For Focus Score
  Brain      // NEW: For Focus Icon
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
  streakFreezes?: number; // NEW
  focusScoreAvg?: number; // NEW
  engagementScore: number;
  dailyStats: {
    date: string;
    timeSpent: number;
    articlesRead: number;
    goalsMet: boolean;
  };
  recentDailyHistory?: DailyStat[];
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
      legend: {
        display: false
      },
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
        grid: {
          color: '#334155',
          drawBorder: false,
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 10 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 10 }
        }
      }
    }
  };

  return (
    <div className="dashboard-container pb-24 md:pb-8 animate-in fade-in duration-500">
      
      {/* 1. Header & Welcome */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          My Narrative
        </h1>
        <p className="text-slate-400 mt-2">
          Your reading habits and intellectual growth.
        </p>
      </header>

      {/* 2. Main Hero Cards (Streak & Focus) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        
        {/* Streak Card */}
        <div className="stat-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Flame className="text-orange-500" size={20} />
              </div>
              <span className="text-slate-400 font-medium">Daily Streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-white">
                {stats?.currentStreak || 0}
              </h2>
              <span className="text-slate-500">days</span>
              
              {/* NEW: Streak Freeze Indicator */}
              {(stats?.streakFreezes || 0) > 0 && (
                <div 
                  className="flex items-center gap-1 ml-auto bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20"
                  title={`${stats?.streakFreezes} Streak Freeze(s) Available`}
                >
                  <Snowflake size={16} className="text-blue-400" />
                  <span className="text-blue-400 font-bold text-sm">
                    {stats?.streakFreezes} Safe
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Best: <span className="text-orange-400">{stats?.longestStreak || 0} days</span>
            </p>
          </div>
        </div>

        {/* NEW: Focus Quality Card */}
        <div className="stat-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Zap className="text-indigo-400" size={20} />
              </div>
              <span className="text-slate-400 font-medium">Focus Quality</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-white">
                {stats?.focusScoreAvg || 100}
              </h2>
              <span className="text-slate-500">/ 100</span>
            </div>
            <p className={`text-sm font-medium mt-2 ${focusData.color}`}>
              {focusData.label}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        {/* Time Spent */}
        <div className="stat-card-mini">
          <div className="mb-2 text-slate-400">
            <Clock size={18} />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatTime(stats?.totalTimeSpent || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total Time Reading</div>
        </div>

        {/* Articles Read */}
        <div className="stat-card-mini">
          <div className="mb-2 text-slate-400">
            <BookOpen size={18} />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.articlesReadCount || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Articles Completed</div>
        </div>

        {/* Avg Attention */}
        <div className="stat-card-mini">
          <div className="mb-2 text-slate-400">
            <TrendingUp size={18} />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatTime(stats?.averageAttentionSpan || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Avg. Read Session</div>
        </div>

        {/* Engagement Score */}
        <div className="stat-card-mini">
          <div className="mb-2 text-slate-400">
            <Award size={18} />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats?.engagementScore || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Narrative Score</div>
        </div>
      </div>

      {/* 4. Activity Chart */}
      <div className="stat-card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart2 size={20} className="text-slate-400" />
            30-Day Activity
          </h3>
        </div>
        <div className="h-64 w-full">
          {stats?.recentDailyHistory && stats.recentDailyHistory.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600">
              No activity recorded yet. Start reading!
            </div>
          )}
        </div>
      </div>

      {/* 5. Today's Progress */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Target className="text-green-400" size={20} />
            Daily Goal
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {stats?.dailyStats?.goalsMet ? 'COMPLETED' : 'IN PROGRESS'}
          </span>
        </div>
        
        <div className="w-full bg-slate-700/50 h-3 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full transition-all duration-1000 ${
              stats?.dailyStats?.goalsMet ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ 
              width: `${Math.min(100, ((stats?.dailyStats?.timeSpent || 0) / 900) * 100)}%` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{Math.round((stats?.dailyStats?.timeSpent || 0) / 60)} mins</span>
          <span>Target: 15 mins</span>
        </div>
      </div>

      {/* 6. Footer Actions */}
      <div className="mt-8 flex gap-4">
        <button 
          onClick={() => navigate('/settings')}
          className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
        >
          Manage Account
        </button>
        <button className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
          <Share2 size={18} />
          Share Stats
        </button>
      </div>

    </div>
  );
};

export default MyDashboard;
