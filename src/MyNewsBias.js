// In file: src/MyNewsBias.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, // <-- Added Filler
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
// Import segment styling utilities if needed (Chart.js v3+ handles basic cases)
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
const getActionCount = (totals, action) => {
  const item = totals.find(t => t.action === action);
  return item ? item.count : 0;
};

// Colors and Order definitions
const leanOrder = ['Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];
const leanColors = { /* ... */ };
const qualityLabels = [ /* ... */ ];
const qualityColors = { /* ... */ };
const categoryColorsDark = ['#B38F5F', '#CCA573', '#D9B98A', '#E6CB9F', '#9C7C50', '#8F6B4D', '#C19A6B', '#AE8A53', '#D0B48F', '#B8860B'];
const categoryColorsLight = ['#2E4E6B', '#3E6A8E', '#5085B2', '#63A0D6', '#243E56', '#1A2D3E', '#4B77A3', '#395D7D', '#5D92C1', '#004E8A'];
// --- *** NEW: Line Chart Colors *** ---
const lineColors = {
    up: '#4CAF50', // Green
    down: '#dc2626', // Red
    neutral: '#B38F5F', // Accent color (use variable later if possible)
};


// --- Main Component ---
function MyNewsBias() {
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  
  const [currentTheme, setCurrentTheme] = useState('dark');
   useEffect(() => {
     const savedTheme = localStorage.getItem('theme') || 'dark';
     setCurrentTheme(savedTheme);
   }, []);

   const chartColors = useMemo(() => {
      const isDark = currentTheme === 'dark';
      return {
         textPrimary: isDark ? '#EAEAEA' : '#2C2C2C',
         textSecondary: isDark ? '#B0B0B0' : '#555555',
         textTertiary: isDark ? '#757575' : '#888888',
         borderColor: isDark ? '#333333' : '#EAEAEA',
         tooltipBg: isDark ? '#2C2C2C' : '#FDFDFD',
         categoryPalette: isDark ? categoryColorsDark : categoryColorsLight,
         accent: isDark ? '#B38F5F' : '#2E4E6B', // Store accent for line chart default
      };
   }, [currentTheme]);

  // Fetch aggregated stats
  useEffect(() => {
    const fetchStats = async () => { /* ... */ }; fetchStats();
  }, []);


  // --- Chart Options ---

   const getDoughnutChartOptions = useCallback((title) => ({ /* ... depends on chartColors ... */
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: chartColors.textSecondary } }, tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary }, title: { display: true, text: title, color: chartColors.textPrimary, font: { size: 14 } } }, cutout: '60%',
   }), [chartColors, currentTheme]); // <-- Added currentTheme dependency

    const getBarChartOptions = useCallback((title) => ({ /* ... depends on chartColors ... */
      responsive: true, maintainAspectRatio: false,
      scales: { x: { ticks: { color: chartColors.textTertiary }, grid: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'Number of Articles', color: chartColors.textSecondary }, ticks: { color: chartColors.textTertiary, stepSize: 1 }, grid: { color: chartColors.borderColor } }, },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary }, title: { display: true, text: title, color: chartColors.textPrimary, font: { size: 14 } } },
   }), [chartColors, currentTheme]); // <-- Added currentTheme dependency


   const storiesReadOptions = useMemo(() => ({ /* ... depends on chartColors ... */
      responsive: true, maintainAspectRatio: false,
      scales: { x: { type: 'time', time: { unit: 'day', tooltipFormat: 'MMM d, yyyy', displayFormats: { day: 'MMM d' }}, title: { display: true, text: 'Date', color: chartColors.textSecondary }, ticks: { color: chartColors.textTertiary }, grid: { color: chartColors.borderColor }}, y: { beginAtZero: true, title: { display: true, text: 'Number of Stories', color: chartColors.textSecondary }, ticks: { color: chartColors.textTertiary, stepSize: 1 }, grid: { color: chartColors.borderColor }}, },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary } },
      // Segment styling is now defined in the dataset
   }), [chartColors, currentTheme]); // <-- Added currentTheme dependency

  // --- Chart Data Preparation ---
  const prepareLeanData = (rawData) => { /* ... */ };
  const prepareCategoryData = (rawData) => { /* ... */ };
  const prepareQualityData = (rawData) => { /* ... */ };

  // --- *** MODIFIED Line Chart Data Preparation *** ---
  const storiesReadData = useMemo(() => {
      const counts = statsData?.dailyCounts || [];
      if (counts.length === 0) {
          return { labels: [], datasets: [] };
      }

      const dataPoints = counts.map(item => ({ x: item.date, y: item.count }));
      
      // Calculate segment colors
      const segmentColors = dataPoints.map((point, index, arr) => {
          if (index === 0) return chartColors.accent; // First point color (or lineColors.neutral)
          const prevPoint = arr[index - 1];
          if (point.y > prevPoint.y) return lineColors.up; // Green
          if (point.y < prevPoint.y) return lineColors.down; // Red
          return chartColors.accent; // Neutral/Accent
      });

      return {
          // labels are implicitly handled by the time scale using dataPoints x values
          datasets: [{
              label: 'Stories Analyzed',
              data: dataPoints,
              fill: false,
              tension: 0.1,
              // Define segment styling
              segment: {
                  borderColor: ctx => segmentColors[ctx.p0DataIndex], // Color based on the starting point of the segment
                  // backgroundColor: ctx => ... // Can add area fill colors similarly if needed
              },
              // Optional: Style individual points based on color
              pointBackgroundColor: segmentColors,
              pointBorderColor: segmentColors,
              pointRadius: dataPoints.length < 50 ? 3 : 1.5, // Smaller points for lots of data
              pointHoverRadius: 5,
          }],
      };
  }, [statsData?.dailyCounts, chartColors.accent]); // Depend on data and accent color


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
      <div className="dashboard-content-wrapper">

        {/* --- Left Column (Fixed) --- */}
        <div className="dashboard-left-column">
           {/* Section Title + Back Button Aligned */}
           <div className="section-title-header">
             {/* --- *** MOVED Back Button HERE *** --- */}
             <Link to="/" className="btn-secondary btn-small btn-back-activity" style={{ textDecoration: 'none' }}>
                Back to Articles
             </Link>
             <h2 className="section-title no-border">Your Activity</h2>
             {/* Removed header-actions wrapper */}
           </div>

          {/* Activity Stat Boxes */}
          <div className="stat-box-grid"> { /* ... */ } </div>
          
          {/* Reading Bias Card */}
          <h2 className="section-title">Reading Bias</h2>
           <div className="dashboard-card lean-summary-card">
              {loadingStats ? <div className="loading-container simple"><div className="spinner small"></div></div> : totalLeanArticles > 0 ? (
                <>
                  <div className="lean-bar">
                     { leftCombinedPerc > 0 &&
                       <div className="lean-segment left" style={{ width: `${leftCombinedPerc}%` }}>
                          {leftCombinedPerc >= 10 ? `L ${leftCombinedPerc}%` : ''} 
                       </div> }
                     { centerPerc > 0 &&
                       <div className="lean-segment center" style={{ width: `${centerPerc}%` }}>
                           {centerPerc >= 10 ? `C ${centerPerc}%` : ''} 
                       </div> }
                     { rightCombinedPerc > 0 &&
                       <div className="lean-segment right" style={{ width: `${rightCombinedPerc}%` }}>
                           {rightCombinedPerc >= 10 ? `R ${rightCombinedPerc}%` : ''} 
                       </div> }
                  </div>
                  <ul className="lean-details"> { /* ... list items ... */ } </ul>
                </>
              ) : ( <p className="no-data-msg small">No analysis data available yet.</p> )}
            </div>

        </div> {/* --- End Left Column --- */}

        {/* --- Right Column (Scrollable) --- */}
        <div className="dashboard-right-column">
          {/* Sticky Header Wrapper */}
          <div className="sticky-header-wrapper">
             <h2 className="section-title">Your Reading Habits Dashboard</h2> 
             {/* --- *** MOVED Date Selector HERE *** --- */}
             <div className="date-range-selector"> <span>Viewing All-Time Stats</span> </div>
          </div>

          {/* Stories Analyzed Over Time (Full Width) */}
          <div className="dashboard-card full-width-chart-card stories-read-card"> 
              {/* --- *** ADDED Title Back *** --- */}
              <div className="card-header"> <h3>Stories Analyzed Over Time</h3> </div>
              <div className="chart-container stories-read-chart">
                 {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                  : (statsData?.dailyCounts?.length > 0) ? ( <Line key={currentTheme} options={storiesReadOptions} data={storiesReadData} /> ) // Added Key
                  : ( <p className="no-data-msg">No analysis data for this period.</p> )}
              </div>
          </div>

          {/* Grid for Remaining Charts */}
          <div className="dashboard-grid">

            {/* Top Categories (Column/Bar Chart) */}
             <div className="dashboard-card">
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && categoryReadData.labels.length > 0) ? ( <Bar key={currentTheme} options={getBarChartOptions('Top Categories (Analyzed)')} data={categoryReadData} /> ) // Added Key
                   : ( <p className="no-data-msg">No analysis data for this period.</p> )}
               </div>
             </div>

            {/* Political Lean (Analyzed - Doughnut) */}
             <div className="dashboard-card">
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalLeanArticles > 0) ? ( <Doughnut key={currentTheme} options={getDoughnutChartOptions('Political Lean (Analyzed)')} data={leanReadData} /> ) // Added Key
                   : ( <p className="no-data-msg">No analysis data for this period.</p> )}
               </div>
             </div>
             
             {/* Article Quality (Doughnut Chart) */}
             <div className="dashboard-card">
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && qualityReadData.labels.length > 0) ? ( <Doughnut key={currentTheme} options={getDoughnutChartOptions('Article Quality (Analyzed)')} data={qualityReadData} /> ) // Added Key
                   : ( <p className="no-data-msg">No analysis data for this period.</p> )}
               </div>
             </div>

            {/* Political Lean (Shared - Doughnut) */}
             <div className="dashboard-card">
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalShared > 0) ? ( <Doughnut key={currentTheme} options={getDoughnutChartOptions('Political Lean (Shared)')} data={leanSharedData} /> ) // Added Key
                   : ( <p className="no-data-msg">You haven't shared any articles yet.</p> )}
               </div>
             </div>
             
          </div> {/* End dashboard-grid (right column) */}

          {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}

        </div> {/* --- End Right Column --- */}
      </div> {/* --- End Content Wrapper --- */}
    </div> // End bias-dashboard-page
  );
}

export default MyNewsBias;
