// In file: src/MyNewsBias.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css';
import './MyNewsBias.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Filler, BarElement, ArcElement,
  Title, Tooltip, Legend, TimeScale
);

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper to get total count
const getActionCount = (totals, action) => { /* ... (no changes) ... */ };

// Colors and Order definitions
const leanOrder = ['Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];
const leanColors = { /* ... */ };
const qualityLabels = [ /* ... */ ];
const qualityColors = { /* ... */ };
const categoryColorsDark = ['#B38F5F', '#CCA573', '#D9B98A', '#E6CB9F', '#9C7C50', '#8F6B4D', '#C19A6B', '#AE8A53', '#D0B48F', '#B8860B'];
const categoryColorsLight = ['#2E4E6B', '#3E6A8E', '#5085B2', '#63A0D6', '#243E56', '#1A2D3E', '#4B77A3', '#395D7D', '#5D92C1', '#004E8A'];
const lineColors = { up: '#4CAF50', down: '#dc2626', neutral: '#B38F5F' };


// --- Main Component ---
function MyNewsBias() {
  const [profileData, setProfileData] = useState(null); // <-- Added profileData back
  const [statsData, setStatsData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // <-- Added loadingProfile back
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  const [currentTheme, setCurrentTheme] = useState('dark');
   useEffect(() => {
     const savedTheme = localStorage.getItem('theme') || 'dark';
     setCurrentTheme(savedTheme);
   }, []);

   const chartColors = useMemo(() => { /* ... (no changes) ... */ }, [currentTheme]);

  // --- *** ADDED Profile Fetch Back *** ---
  useEffect(() => {
    const fetchProfile = async () => {
      setError(''); setLoadingProfile(true);
      try { const response = await axios.get(`${API_URL}/profile/me`); setProfileData(response.data); }
      catch (err) { console.error('Error fetching profile:', err); setError(prev => prev + 'Could not load profile data. '); }
      finally { setLoadingProfile(false); }
    }; fetchProfile();
  }, []);

  // Fetch aggregated stats
  useEffect(() => {
    const fetchStats = async () => { /* ... (no changes) ... */ }; fetchStats();
  }, []);


  // --- Chart Options (Functions remain the same) ---
   const getDoughnutChartOptions = useCallback((title) => ({ /* ... */ }), [chartColors, currentTheme]);
   const getBarChartOptions = useCallback((title) => ({ /* ... */ }), [chartColors, currentTheme]);
   const storiesReadOptions = useMemo(() => ({ /* ... */ }), [chartColors, currentTheme]);

  // --- Chart Data Preparation (Functions remain the same) ---
  const prepareLeanData = (rawData) => { /* ... */ };
  const prepareCategoryData = (rawData) => { /* ... */ };
  const prepareQualityData = (rawData) => { /* ... */ };
  const storiesReadData = useMemo(() => { /* ... dynamic line color logic ... */
      const counts = statsData?.dailyCounts || [];
      if (counts.length === 0) { return { labels: [], datasets: [] }; }
      const dataPoints = counts.map(item => ({ x: item.date, y: item.count }));
      const segmentColors = dataPoints.map((point, index, arr) => {
          if (index === 0) return chartColors.accent;
          const prevPoint = arr[index - 1];
          if (point.y > prevPoint.y) return lineColors.up;
          if (point.y < prevPoint.y) return lineColors.down;
          return chartColors.accent;
      });
      return {
          datasets: [{
              label: 'Stories Analyzed', data: dataPoints, fill: false, tension: 0.1,
              segment: { borderColor: ctx => segmentColors[ctx.p0DataIndex] },
              pointBackgroundColor: segmentColors, pointBorderColor: segmentColors,
              pointRadius: dataPoints.length < 50 ? 3 : 1.5, pointHoverRadius: 5,
          }],
      };
   }, [statsData?.dailyCounts, chartColors.accent]);

  // Prepare data for all charts
  const leanReadData = prepareLeanData(statsData?.leanDistribution_read);
  const leanSharedData = prepareLeanData(statsData?.leanDistribution_shared);
  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const qualityReadData = prepareQualityData(statsData?.qualityDistribution_read);

  // Calculate totals
  const totals = statsData?.totalCounts || [];
  const totalAnalyzed = getActionCount(totals, 'view_analysis');
  const totalShared = getActionCount(totals, 'share_article');
  const totalCompared = getActionCount(totals, 'view_comparison');
  const totalRead = getActionCount(totals, 'read_external');

  // Calculate lean percentages
  const totalLeanArticles = statsData?.leanDistribution_read?.reduce((sum, item) => sum + item.count, 0) || 0;
  const leanReadCounts = (statsData?.leanDistribution_read || []).reduce((acc, item) => { acc[item.lean] = item.count; return acc; }, {});
  const leanPercentages = leanOrder.reduce((acc, lean) => { const count = leanReadCounts[lean] || 0; acc[lean] = totalLeanArticles > 0 ? Math.round((count / totalLeanArticles) * 100) : 0; return acc; }, {});
  const leftCombinedPerc = leanPercentages['Left'] + leanPercentages['Left-Leaning'];
  const centerPerc = leanPercentages['Center'];
  const rightCombinedPerc = leanPercentages['Right'] + leanPercentages['Right-Leaning'];

  const statBoxes = [ /* ... */ ];

  // --- RENDER LOGIC ---
  return (
    <div className="bias-dashboard-page">
      {/* --- *** REVERTED Header Section *** --- */}
      <div className="dashboard-header">
        <div className="user-info-header">
          <div className="user-avatar">
            {profileData?.username ? profileData.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="user-details">
            {/* Using h1 for semantic main title */}
            <h1>{profileData?.username || (loadingProfile ? 'Loading...' : 'User')}'s Dashboard</h1>
            <p>Your Reading Habits Analysis</p>
          </div>
        </div>
        <div className="date-range-selector"> <span>Viewing All-Time Stats</span> </div>
      </div>

       {/* --- *** NEW: Wrapper for Title + Button *** --- */}
       <div className="section-title-header">
           <h2 className="section-title no-border">Your Activity</h2>
           <Link to="/" className="btn-secondary btn-small btn-back-activity" style={{ textDecoration: 'none' }}>
              Back to Articles
           </Link>
       </div>

      {/* Activity Stat Boxes */}
      <div className="stat-box-grid">
         {statBoxes.map(box => (
              <div key={box.key} className="dashboard-card stat-box">
                 <h3>{box.title}</h3>
                 <p className="stat-number">{loadingStats ? '...' : box.value}</p>
                 <p className="stat-description">{box.desc}</p>
              </div>
         ))}
      </div>

      {/* Reading Bias Card */}
      <h2 className="section-title">Reading Bias</h2>
      <div className="dashboard-card lean-summary-card">
         {/* ... (Bias Bar + Details Logic - no changes needed) ... */}
         {loadingStats ? <div className="loading-container simple"><div className="spinner small"></div></div> : totalLeanArticles > 0 ? ( <> ... </> ) : ( <p className="no-data-msg small">No analysis data available yet.</p> )}
      </div>

      {/* --- *** REVERTED: Now using a single grid for charts *** --- */}
      <h2 className="section-title">Analysis Charts</h2>
      <div className="dashboard-grid">

        {/* Stories Analyzed Over Time (Now takes 1 column) */}
        <div className="dashboard-card stories-read-card">
            <div className="card-header"> <h3>Stories Analyzed Over Time</h3> </div>
            <div className="chart-container stories-read-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                : (statsData?.dailyCounts?.length > 0) ? ( <Line key={currentTheme} options={storiesReadOptions} data={storiesReadData} /> )
                : ( <p className="no-data-msg">No analysis data for this period.</p> )}
            </div>
        </div>

        {/* Top Categories (Column/Bar Chart) */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
               : (totalAnalyzed > 0 && categoryReadData.labels.length > 0) ? ( <Bar key={currentTheme} options={getBarChartOptions('Top Categories (Analyzed)')} data={categoryReadData} /> )
               : ( <p className="no-data-msg">No analysis data for this period.</p> )}
           </div>
         </div>

        {/* Political Lean (Analyzed - Doughnut) */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
               : (totalLeanArticles > 0) ? ( <Doughnut key={currentTheme} options={getDoughnutChartOptions('Political Lean (Analyzed)')} data={leanReadData} /> )
               : ( <p className="no-data-msg">No analysis data for this period.</p> )}
           </div>
         </div>

         {/* Article Quality (Doughnut Chart) */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
               : (totalAnalyzed > 0 && qualityReadData.labels.length > 0) ? ( <Doughnut key={currentTheme} options={getDoughnutChartOptions('Article Quality (Analyzed)')} data={qualityReadData} /> )
               : ( <p className="no-data-msg">No analysis data for this period.</p> )}
           </div>
         </div>

        {/* Political Lean (Shared - Doughnut) */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
               : (totalShared > 0) ? ( <Doughnut key={currentTheme} options={getDoughnutChartOptions('Political Lean (Shared)')} data={leanSharedData} /> )
               : ( <p className="no-data-msg">You haven't shared any articles yet.</p> )}
           </div>
         </div>

      </div> {/* End dashboard-grid */}

      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}

      {/* --- *** REMOVED Back Button from here *** --- */}

    </div> // End bias-dashboard-page
  );
}

export default MyNewsBias;

// --- Helper Functions (need to be defined outside or imported if used in JSX directly like this) ---
// Example: Assuming prepareLeanData etc. are defined above or imported
