// In file: src/MyNewsBias.js
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // <-- ADDED useMemo, useCallback
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
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
  TimeScale // Import TimeScale
} from 'chart.js';
// --- >>> MAKE SURE THIS LINE IS EXACTLY LIKE THIS <<< ---
import 'chartjs-adapter-date-fns'; // Import the date adapter
// --- >>> MAKE SURE THIS LINE IS EXACTLY LIKE THIS <<< ---
import './App.css'; // Re-use general styles
import './MyNewsBias.css'; // We'll create this CSS file next

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// --- *** NEW *** ---
// Helper to get total count from the new totalCounts array
const getActionCount = (totals, action) => {
  const item = totals.find(t => t.action === action);
  return item ? item.count : 0;
};

// --- *** NEW *** ---
// Helper for sorting bar chart data
const leanOrder = ['Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];
const leanColors = {
    'Left': '#dc2626', // Red
    'Left-Leaning': '#f87171', // Lighter Red
    'Center': '#6b7280', // Gray
    'Right-Leaning': '#60a5fa', // Lighter Blue
    'Right': '#2563eb', // Blue
    'Not Applicable': '#a1a1aa' // Lighter Gray
};
const qualityColors = {
    'A+ Excellent (90-100)': '#2563eb', // Blue
    'A High (80-89)': '#60a5fa', // Light Blue
    'B Professional (70-79)': '#4CAF50', // Green
    'C Acceptable (60-69)': '#F59E0B', // Amber
    'D-F Poor (0-59)': '#dc2626', // Red
    'null': '#a1a1aa' // Gray for 'N/A'
};


function MyNewsBias() {
  const [profileData, setProfileData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  
  // --- *** REMOVED TIMEFRAME STATE *** ---
  // const [timeframe, setTimeframe] = useState('Month'); 

  // Fetch basic profile info (username, email)
  useEffect(() => {
    const fetchProfile = async () => {
      setError('');
      setLoadingProfile(true);
      try {
        const response = await axios.get(`${API_URL}/profile/me`);
        setProfileData(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(prev => prev + 'Could not load profile data. ');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch aggregated stats (ALL-TIME)
  useEffect(() => {
    const fetchStats = async () => {
      setError('');
      setLoadingStats(true);

      try {
        // --- *** MODIFIED *** ---
        // No longer sends 'days' param, fetches all-time stats
        const response = await axios.get(`${API_URL}/profile/stats`);
        setStatsData(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(prev => prev + 'Could not load statistics data. ');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []); // --- *** REMOVED TIMEFRAME DEPENDENCY *** ---


  // --- Chart Data Preparation ---
  
  // --- *** MOVED INSIDE COMPONENT & WRAPPED IN useMemo *** ---
  // Helper function for bar chart options
  const getBarChartOptions = useCallback((title) => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Articles', color: 'var(--text-secondary)' },
        ticks: { color: 'var(--text-tertiary)', stepSize: 1 },
        grid: { color: 'var(--border-color)' }
      },
      y: {
        ticks: { color: 'var(--text-tertiary)' },
        grid: { display: false }
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
         backgroundColor: 'var(--bg-elevated)',
         titleColor: 'var(--text-primary)',
         bodyColor: 'var(--text-secondary)',
      },
      title: {
        display: true,
        text: title,
        color: 'var(--text-primary)',
        font: { size: 14 }
      }
    },
  }), []); // Empty dependency array, this function doesn't need to change

  // --- *** NEW *** ---
  // Helper function to prepare lean data
  const prepareLeanData = (rawData) => {
    const counts = (rawData || []).reduce((acc, item) => {
      acc[item.lean] = item.count;
      return acc;
    }, {});
    return {
      labels: leanOrder,
      datasets: [{
        label: 'Articles',
        data: leanOrder.map(lean => counts[lean] || 0),
        backgroundColor: leanOrder.map(lean => leanColors[lean]),
      }],
    };
  };

  // --- *** NEW *** ---
  // Helper function to prepare category data
  const prepareCategoryData = (rawData) => {
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10
    return {
      labels: sortedData.map(d => d.category),
      datasets: [{
        label: 'Articles Read',
        data: sortedData.map(d => d.count),
        backgroundColor: 'var(--accent-primary)',
      }],
    };
  };

  // --- *** NEW *** ---
  // Helper function to prepare quality data
  const prepareQualityData = (rawData) => {
    // Create a map of the counts from the raw data
    const rawCountsMap = (rawData || []).reduce((acc, item) => {
      acc[item.grade] = item.count;
      return acc;
    }, {});
    
    // This part is tricky, we need to adapt to what the DB sends.
    // Let's assume the DB sends 'A+', 'A', 'B', 'C', 'D', 'F', null
    
    const dbCounts = rawCountsMap;
    const labels = [
        'A+ Excellent (90-100)', 
        'A High (80-89)', 
        'B Professional (70-79)', 
        'C Acceptable (60-69)', 
        'D-F Poor (0-59)',
        'N/A (Review/Opinion)'
    ];
    
    const data = [
      dbCounts['A+'] || 0,
      dbCounts['A'] || 0,
      dbCounts['B'] || 0,
      dbCounts['C'] || 0,
      (dbCounts['D'] || 0) + (dbCounts['F'] || 0) + (dbCounts['D-F'] || 0), // Combine D and F
      dbCounts[null] || 0 // Count for null grades
    ];
    
    const colors = [
       qualityColors['A+ Excellent (90-100)'],
       qualityColors['A High (80-89)'],
       qualityColors['B Professional (70-79)'],
       qualityColors['C Acceptable (60-69)'],
       qualityColors['D-F Poor (0-59)'],
       qualityColors['null']
    ];
    
    return {
      labels: labels,
      datasets: [{
        label: 'Articles Read',
        data: data,
        backgroundColor: colors,
      }],
    };
  };

  // --- *** MOVED INSIDE COMPONENT & WRAPPED IN useMemo *** ---
  // --- Stories Read (Line Chart) ---
  const storiesReadData = useMemo(() => ({
    labels: statsData?.dailyCounts?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Stories Read',
        data: statsData?.dailyCounts?.map(item => item.count) || [],
        fill: false,
        borderColor: 'var(--accent-primary)',
        tension: 0.1,
      },
    ],
  }), [statsData?.dailyCounts]);
  
  const storiesReadOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day', // Always day, since it's all-time
          tooltipFormat: 'MMM d, yyyy',
          displayFormats: { day: 'MMM d' }
        },
        title: { display: true, text: 'Date', color: 'var(--text-secondary)' },
         ticks: { color: 'var(--text-tertiary)' },
         grid: { color: 'var(--border-color)' }
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Stories', color: 'var(--text-secondary)' },
        ticks: { color: 'var(--text-tertiary)', stepSize: 1 },
        grid: { color: 'var(--border-color)' }
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--bg-elevated)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
      }
    },
  }), []); // Empty dependency array, these options are static

  // --- Prepare data for all charts ---
  const leanReadData = prepareLeanData(statsData?.leanDistribution_read);
  const leanSharedData = prepareLeanData(statsData?.leanDistribution_shared);
  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const qualityReadData = prepareQualityData(statsData?.qualityDistribution_read);
  
  // --- Calculate totals ---
  const totals = statsData?.totalCounts || [];
  const totalAnalyzed = getActionCount(totals, 'view_analysis');
  const totalShared = getActionCount(totals, 'share_article');
  const totalCompared = getActionCount(totals, 'view_comparison');
  const totalRead = getActionCount(totals, 'read_external');
  
  // Calculate lean percentages for the top summary bar
  const totalLeanArticles = statsData?.leanDistribution_read?.reduce((sum, item) => sum + item.count, 0) || 0;
  const leanReadCounts = (statsData?.leanDistribution_read || []).reduce((acc, item) => {
      acc[item.lean] = item.count;
      return acc;
  }, {});
  const leanPercentages = leanOrder.reduce((acc, lean) => {
      const count = leanReadCounts[lean] || 0;
      acc[lean] = totalLeanArticles > 0 ? Math.round((count / totalLeanArticles) * 100) : 0;
      return acc;
  }, {});

  // --- *** NEW *** ---
  // Create an array for the stat boxes to map over
  const statBoxes = [
    { key: 'analyzed', title: 'Articles Analyzed', value: totalAnalyzed, desc: 'Total times you viewed the "Analysis" popup.' },
    { key: 'read', title: 'Articles Read', value: totalRead, desc: 'Total times you clicked "Read Article".' },
    { key: 'shared', title: 'Articles Shared', value: totalShared, desc: "Total articles you've shared with others." },
    { key: 'compared', title: 'Comparisons Viewed', value: totalCompared, desc: 'Total times you clicked "Compare Coverage".' }
  ];


  return (
    <div className="bias-dashboard-page">
      {/* --- Top Header Section --- */}
      <div className="dashboard-header">
        <div className="user-info-header">
          <div className="user-avatar">
            {profileData?.username ? profileData.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="user-details">
            <h2>{profileData?.username || 'Loading...'}</h2>
            <p>My News Bias Dashboard</p>
          </div>
        </div>
        <div className="date-range-selector">
          <span>Viewing All-Time Stats</span>
        </div>
      </div>

      {/* --- *** NEW: Key Stats Section *** --- */}
      <h2 className="section-title">Your Activity</h2>
      <div className="stat-box-grid">
        {statBoxes.map(box => (
          <div key={box.key} className="dashboard-card stat-box">
             <h3>{box.title}</h3>
             <p className="stat-number">{loadingStats ? '...' : box.value}</p>
             <p className="stat-description">{box.desc}</p>
          </div>
        ))}
      </div>
        

      {/* --- Analysis Section Title --- */}
      <h2 className="section-title">Reading Habits</h2>
      
      {/* --- *** MODIFIED: Main Content Grid *** --- */}
      <div className="dashboard-grid">

        {/* --- Lean Summary Card --- */}
        <div className="dashboard-card lean-summary-card">
          <h3>Your Reading Bias</h3>
          <div className="lean-bar">
            <div className="lean-segment left" style={{ width: `${leanPercentages['Left'] + leanPercentages['Left-Leaning']}%` }}>
               L {leanPercentages['Left'] + leanPercentages['Left-Leaning']}%
            </div>
            <div className="lean-segment center" style={{ width: `${leanPercentages['Center']}%` }}>
               C {leanPercentages['Center']}%
            </div>
            <div className="lean-segment right" style={{ width: `${leanPercentages['Right'] + leanPercentages['Right-Leaning']}%` }}>
               R {leanPercentages['Right'] + leanPercentages['Right-Leaning']}%
            </div>
          </div>
          <ul className="lean-details">
             {(leanPercentages['Left'] + leanPercentages['Left-Leaning']) > 0 && (
                <li><span>{leanPercentages['Left'] + leanPercentages['Left-Leaning']}%</span> of the stories you analyzed lean left.</li>
             )}
              {leanPercentages['Center'] > 0 && (
                 <li><span>{leanPercentages['Center']}%</span> of the stories you analyzed were balanced.</li>
              )}
               {(leanPercentages['Right'] + leanPercentages['Right-Leaning']) > 0 && (
                 <li><span>{leanPercentages['Right'] + leanPercentages['Right-Leaning']}%</span> of the stories you analyzed lean right.</li>
               )}
                {totalLeanArticles === 0 && !loadingStats && (
                  <li>No article analysis data available for this period.</li>
                )}
                 {loadingStats && (
                  <li>Loading...</li>
                 )}
          </ul>
        </div>

        {/* --- Stories Read Card --- */}
        <div className="dashboard-card stories-read-card">
           {/* --- *** REMOVED TIMEFRAME BUTTONS *** --- */}
          <div className="card-header">
            <h3>Stories Analyzed Over Time</h3>
          </div>
          <div className="chart-container stories-read-chart">
             {loadingStats ? (
                <div className="loading-container"><div className="spinner"></div></div>
             ) : (statsData?.dailyCounts?.length > 0) ? (
                 <Line options={storiesReadOptions} data={storiesReadData} />
             ) : (
                <p className="no-data-msg">No analysis data for this period.</p>
             )}
          </div>
        </div>

        {/* --- Article Bias (Lean Distribution Chart) --- */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? (
                 <div className="loading-container"><div className="spinner"></div></div>
               ) : (totalLeanArticles > 0) ? (
                 <Bar options={getBarChartOptions('Political Lean (Analyzed)')} data={leanReadData} />
               ): (
                  <p className="no-data-msg">No analysis data for this period.</p>
               )}
           </div>
         </div>
         
        {/* --- *** NEW: Shares by Lean *** --- */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? (
                 <div className="loading-container"><div className="spinner"></div></div>
               ) : (totalShared > 0) ? (
                 <Bar options={getBarChartOptions('Political Lean (Shared)')} data={leanSharedData} />
               ): (
                  <p className="no-data-msg">You haven't shared any articles yet.</p>
               )}
           </div>
         </div>
         
         {/* --- *** NEW: Top Categories *** --- */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? (
                 <div className="loading-container"><div className="spinner"></div></div>
               ) : (totalAnalyzed > 0) ? (
                 <Bar options={getBarChartOptions('Top Categories (Analyzed)')} data={categoryReadData} />
               ): (
                  <p className="no-data-msg">No analysis data for this period.</p>
               )}
           </div>
         </div>

         {/* --- *** NEW: Quality Distribution *** --- */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? (
                 <div className="loading-container"><div className="spinner"></div></div>
               ) : (totalAnalyzed > 0) ? (
                 <Bar options={getBarChartOptions('Article Quality (Analyzed)')} data={qualityReadData} />
               ): (
                  <p className="no-data-msg">No analysis data for this period.</p>
               )}
           </div>
         </div>

         {/* --- *** REMOVED ALL PLACEHOLDER/LOCKED CARDS *** --- */}

      </div> {/* End dashboard-grid */}

      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Back to Articles
          </Link>
      </div>

    </div> // End bias-dashboard-page
  );
}

export default MyNewsBias;
