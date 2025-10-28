// In file: src/MyNewsBias.js
import React, { useState, useEffect } from 'react';
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

function MyNewsBias() {
  const [profileData, setProfileData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('Month'); // Default to Month for Stories Read

  // Fetch basic profile info
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

  // Fetch aggregated stats (depends on timeframe indirectly via days logic)
  useEffect(() => {
    const fetchStats = async () => {
      setError('');
      setLoadingStats(true);

      // Determine days based on timeframe selection
      let days = 90; // Default (matches backend default if needed)
      if (timeframe === 'Day') days = 1;
      else if (timeframe === 'Week') days = 7;
      else if (timeframe === 'Month') days = 30;
      // 'All Time' could fetch without a date range or use a very large number like 3650

      try {
        const response = await axios.get(`${API_URL}/profile/stats`, {
           params: { days: days } // Pass the calculated days
        });
        setStatsData(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(prev => prev + 'Could not load statistics data. ');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [timeframe]); // Re-fetch stats when timeframe changes

  // --- Chart Data Preparation ---

  // Stories Read Chart
  const storiesReadData = {
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
  };
  const storiesReadOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time', // Use time scale
        time: {
          unit: timeframe === 'Day' ? 'hour' : 'day', // Adjust unit based on timeframe
          tooltipFormat: 'MMM d, yyyy', // Format for tooltips
          displayFormats: { // How labels are displayed
             day: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Date',
          color: 'var(--text-secondary)',
        },
         ticks: {
          color: 'var(--text-tertiary)',
         },
         grid: {
            color: 'var(--border-color)', // X-axis grid lines
         }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Stories',
          color: 'var(--text-secondary)',
        },
        ticks: {
           color: 'var(--text-tertiary)',
           stepSize: 1, // Ensure whole numbers for counts
        },
        grid: {
            color: 'var(--border-color)', // Y-axis grid lines
         }
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend
      },
      tooltip: {
        backgroundColor: 'var(--bg-elevated)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
      }
    },
  };

  // Lean Distribution Chart
  const leanOrder = ['Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];
  const leanColors = {
      'Left': '#dc2626', // Red
      'Left-Leaning': '#f87171', // Lighter Red
      'Center': '#6b7280', // Gray
      'Right-Leaning': '#60a5fa', // Lighter Blue
      'Right': '#2563eb', // Blue
      'Not Applicable': '#a1a1aa' // Lighter Gray
  };
  const leanCounts = statsData?.leanDistribution?.reduce((acc, item) => {
      acc[item.lean] = item.count;
      return acc;
  }, {}) || {};

  const leanDistributionData = {
    labels: leanOrder,
    datasets: [
      {
        label: 'Articles Read by Lean',
        data: leanOrder.map(lean => leanCounts[lean] || 0),
        backgroundColor: leanOrder.map(lean => leanColors[lean]),
        borderColor: leanOrder.map(lean => leanColors[lean]),
        borderWidth: 1,
      },
    ],
  };

  const leanDistributionOptions = {
     responsive: true,
     maintainAspectRatio: false,
     indexAxis: 'y', // Make it a horizontal bar chart
     scales: {
       x: {
         beginAtZero: true,
         title: {
           display: true,
           text: 'Number of Articles',
           color: 'var(--text-secondary)',
         },
         ticks: {
            color: 'var(--text-tertiary)',
            stepSize: 1,
         },
         grid: { color: 'var(--border-color)' }
       },
       y: {
         ticks: { color: 'var(--text-tertiary)' },
         grid: { display: false } // Hide Y-axis grid lines for horizontal bars
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
   };

  const totalStoriesRead = statsData?.dailyCounts?.reduce((sum, item) => sum + item.count, 0) || 0;

  // Calculate lean percentages
  const totalLeanArticles = statsData?.leanDistribution?.reduce((sum, item) => sum + item.count, 0) || 0;
  const leanPercentages = leanOrder.reduce((acc, lean) => {
      const count = leanCounts[lean] || 0;
      acc[lean] = totalLeanArticles > 0 ? Math.round((count / totalLeanArticles) * 100) : 0;
      return acc;
  }, {});


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
            <p>{totalStoriesRead} Stories · {Object.keys(leanCounts).length} Leans</p> {/* Example stats */}
          </div>
        </div>
        <div className="date-range-selector">
          {/* Add dropdown later if needed */}
          <span>Last {statsData?.timeframeDays || '...'} days</span>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="dashboard-grid">

        {/* --- Lean Summary Card --- */}
        <div className="dashboard-card lean-summary-card">
          <h3>Your News Bias</h3>
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
             {/* Show breakdown only if there's data */}
             {(leanPercentages['Left'] + leanPercentages['Left-Leaning']) > 0 && (
                <li><span>{leanPercentages['Left'] + leanPercentages['Left-Leaning']}%</span> of the stories you read lean left.</li>
             )}
              {leanPercentages['Center'] > 0 && (
                 <li><span>{leanPercentages['Center']}%</span> of the stories you read were balanced.</li>
              )}
               {(leanPercentages['Right'] + leanPercentages['Right-Leaning']) > 0 && (
                 <li><span>{leanPercentages['Right'] + leanPercentages['Right-Leaning']}%</span> of the stories you read lean right.</li>
               )}
                {totalLeanArticles === 0 && (
                  <li>No article reading data available for this period.</li>
                )}
          </ul>
        </div>

        {/* --- Stories Read Card --- */}
        <div className="dashboard-card stories-read-card">
          <div className="card-header">
            <h3>Stories Read</h3>
            <div className="timeframe-buttons">
              <button className={timeframe === 'Day' ? 'active' : ''} onClick={() => setTimeframe('Day')}>Day</button>
              <button className={timeframe === 'Week' ? 'active' : ''} onClick={() => setTimeframe('Week')}>Week</button>
              <button className={timeframe === 'Month' ? 'active' : ''} onClick={() => setTimeframe('Month')}>Month</button>
              {/* <button className={timeframe === 'All' ? 'active' : ''} onClick={() => setTimeframe('All')}>All</button> */}
            </div>
          </div>
          <div className="chart-container stories-read-chart">
             {loadingStats ? (
                <div className="loading-container"><div className="spinner"></div></div>
             ) : (statsData?.dailyCounts?.length > 0) ? (
                 <Line options={storiesReadOptions} data={storiesReadData} />
             ) : (
                <p className="no-data-msg">No reading data for this period.</p>
             )}
          </div>
          {/* <p className="comparison-text">You've read X% fewer stories than last week.</p> */}
        </div>

        {/* --- Analysis Section Title --- */}
        <h2 className="section-title">Analysis</h2>

        {/* --- Most Read Sources (Placeholder) --- */}
        <div className="dashboard-card locked">
           <div className="card-header">
               <h3>Most Read News Sources</h3>
               <span className="lock-icon">🔒</span>
           </div>
           {/* Placeholder content */}
           <div className="placeholder-content">
               <p>See your most read news sources across the political spectrum.</p>
               <button className="upgrade-btn disabled">Upgrade to Premium</button>
           </div>
        </div>

        {/* --- Article Bias (Lean Distribution Chart) --- */}
         <div className="dashboard-card">
           <h3>Article Bias</h3>
           <div className="chart-container article-bias-chart">
               {loadingStats ? (
                 <div className="loading-container"><div className="spinner"></div></div>
               ) : (totalLeanArticles > 0) ? (
                 <Bar options={leanDistributionOptions} data={leanDistributionData} />
               ): (
                  <p className="no-data-msg">No reading data for this period.</p>
               )}
           </div>
           <p className="chart-description">
             Do you have a balanced news diet? See what side of the political spectrum you prefer to articles from.
           </p>
         </div>


        {/* --- Other Placeholder Cards --- */}
        {/* Add placeholders for Most read topics, Locality Bias, Factuality, Blindspot, etc. */}
         <div className="dashboard-card locked"><div className="card-header"><h3>Most read topics & people</h3><span className="lock-icon">🔒</span></div> {/* ... placeholder ... */} <button className="upgrade-btn disabled">Upgrade to Premium</button> </div>
         <div className="dashboard-card locked"><div className="card-header"><h3>Locality Bias</h3><span className="lock-icon">🔒</span></div> {/* ... placeholder ... */} <button className="upgrade-btn disabled">Upgrade to Premium</button></div>
         <div className="dashboard-card locked"><div className="card-header"><h3>Factuality distribution</h3><span className="lock-icon">🔒</span></div> {/* ... placeholder ... */} <button className="upgrade-btn disabled">Upgrade to Premium</button></div>
         <div className="dashboard-card locked"><div className="card-header"><h3>Blindspot Stories</h3><span className="lock-icon">🔒</span></div> {/* ... placeholder ... */} <button className="upgrade-btn disabled">Upgrade to Vantage</button></div>
         <div className="dashboard-card locked"><div className="card-header"><h3>Media Ownership</h3><span className="lock-icon">🔒</span></div> {/* ... placeholder ... */} <button className="upgrade-btn disabled">Upgrade to Vantage</button></div>
         <div className="dashboard-card locked"><div className="card-header"><h3>Topic Insights</h3><span className="lock-icon">🔒</span></div> {/* ... placeholder ... */} <button className="upgrade-btn disabled">Upgrade to Vantage</button></div>
         <div className="dashboard-card locked"><div className="card-header"><h3>Countries you've read news about</h3><span className="lock-icon">🔒</span></div> {/* ... placeholder ... */} <button className="upgrade-btn disabled">Upgrade to Vantage</button></div>
         <div className="dashboard-card locked"><div className="card-header"><h3>Civic Lens</h3><span className="lock-icon">🔒</span></div> {/* ... placeholder ... */} <button className="upgrade-btn disabled">Upgrade to Vantage</button></div>


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
