// In file: src/MyNewsBias.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css';
import './MyNewsBias.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
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
const leanColors = { /* ... (colors remain the same) ... */
    'Left': '#dc2626', 'Left-Leaning': '#f87171', 'Center': '#6b7280',
    'Right-Leaning': '#60a5fa', 'Right': '#2563eb', 'Not Applicable': '#a1a1aa'
};
const qualityLabels = [ /* ... (labels remain the same) ... */
    'A+ Excellent (90-100)', 'A High (80-89)', 'B Professional (70-79)',
    'C Acceptable (60-69)', 'D-F Poor (0-59)', 'N/A (Review/Opinion)'
];
const qualityColors = { /* ... (colors remain the same) ... */
    'A+ Excellent (90-100)': '#2563eb', 'A High (80-89)': '#60a5fa',
    'B Professional (70-79)': '#4CAF50', 'C Acceptable (60-69)': '#F59E0B',
    'D-F Poor (0-59)': '#dc2626', 'N/A (Review/Opinion)': '#a1a1aa'
};
const categoryColorsDark = ['#B38F5F', '#CCA573', '#D9B98A', '#E6CB9F', '#9C7C50', '#8F6B4D', '#C19A6B', '#AE8A53', '#D0B48F', '#B8860B'];
const categoryColorsLight = ['#2E4E6B', '#3E6A8E', '#5085B2', '#63A0D6', '#243E56', '#1A2D3E', '#4B77A3', '#395D7D', '#5D92C1', '#004E8A'];


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
      };
   }, [currentTheme]);

  // Fetch aggregated stats
  useEffect(() => {
    const fetchStats = async () => { /* ... (no changes) ... */
      setError(''); setLoadingStats(true);
      try { const response = await axios.get(`${API_URL}/profile/stats`); setStatsData(response.data); }
      catch (err) { console.error('Error fetching stats:', err); setError(prev => prev + 'Could not load statistics data. '); }
      finally { setLoadingStats(false); }
    }; fetchStats();
  }, []);


  // --- Chart Options ---

   const getDoughnutChartOptions = useCallback((title) => ({
      responsive: true, maintainAspectRatio: false,
      plugins: {
         legend: { position: 'bottom', labels: { color: chartColors.textSecondary } },
         tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary },
         title: { display: true, text: title, color: chartColors.textPrimary, font: { size: 14 } }
      }, cutout: '60%',
   }), [chartColors]);

    const getBarChartOptions = useCallback((title) => ({ // For Vertical Categories
      responsive: true, maintainAspectRatio: false,
      scales: {
         x: { ticks: { color: chartColors.textTertiary }, grid: { display: false } }, // Categories
         y: { beginAtZero: true, title: { display: true, text: 'Number of Articles', color: chartColors.textSecondary }, ticks: { color: chartColors.textTertiary, stepSize: 1 }, grid: { color: chartColors.borderColor } }, // Values
      },
      plugins: {
         legend: { display: false },
         tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary },
         title: { display: true, text: title, color: chartColors.textPrimary, font: { size: 14 } }
      },
   }), [chartColors]);


   const storiesReadOptions = useMemo(() => ({
      responsive: true, maintainAspectRatio: false,
      scales: {
         x: { type: 'time', time: { unit: 'day', tooltipFormat: 'MMM d, yyyy', displayFormats: { day: 'MMM d' }}, title: { display: true, text: 'Date', color: chartColors.textSecondary }, ticks: { color: chartColors.textTertiary }, grid: { color: chartColors.borderColor }},
         y: { beginAtZero: true, title: { display: true, text: 'Number of Stories', color: chartColors.textSecondary }, ticks: { color: chartColors.textTertiary, stepSize: 1 }, grid: { color: chartColors.borderColor }},
      },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary } },
   }), [chartColors]);

  // --- Chart Data Preparation (Functions remain the same) ---
  const prepareLeanData = (rawData) => { /* ... (no changes) ... */
    const counts = (rawData || []).reduce((acc, item) => { acc[item.lean] = item.count; return acc; }, {});
    const data = leanOrder.map(lean => counts[lean] || 0);
    const backgroundColors = leanOrder.map(lean => leanColors[lean]);
    const filteredLabels = leanOrder.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    return { labels: filteredLabels, datasets: [{ label: 'Articles', data: filteredData, backgroundColor: filteredColors, borderColor: chartColors.borderColor, borderWidth: 1 }] };
  };
  const prepareCategoryData = (rawData) => { /* ... (no changes) ... */
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10);
    const themeCategoryColors = chartColors.categoryPalette;
    return {
      labels: sortedData.map(d => d.category),
      datasets: [{
        label: 'Articles Read',
        data: sortedData.map(d => d.count),
        backgroundColor: sortedData.map((_, i) => themeCategoryColors[i % themeCategoryColors.length]),
        borderColor: chartColors.borderColor,
        borderWidth: 1,
      }],
    };
  };
  const prepareQualityData = (rawData) => { /* ... (no changes) ... */
    const rawCountsMap = (rawData || []).reduce((acc, item) => { acc[item.grade] = item.count; return acc; }, {});
    const dbCounts = rawCountsMap;
    const data = [ dbCounts['A+'] || 0, dbCounts['A'] || 0, dbCounts['B'] || 0, dbCounts['C'] || 0, (dbCounts['D'] || 0) + (dbCounts['F'] || 0) + (dbCounts['D-F'] || 0), dbCounts[null] || 0 ];
    const backgroundColors = qualityLabels.map(label => qualityColors[label] || '#a1a1aa');
    const filteredLabels = qualityLabels.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    return { labels: filteredLabels, datasets: [{ label: 'Articles Read', data: filteredData, backgroundColor: filteredColors, borderColor: chartColors.borderColor, borderWidth: 1 }] };
  };

  const storiesReadData = useMemo(() => ({ /* ... (no changes) ... */
    labels: statsData?.dailyCounts?.map(item => item.date) || [],
    datasets: [{ label: 'Stories Analyzed', data: statsData?.dailyCounts?.map(item => item.count) || [], fill: false, borderColor: 'var(--accent-primary)', tension: 0.1 }],
  }), [statsData?.dailyCounts]);

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
  
  // Combine left/right lean percentages
  const leftCombinedPerc = leanPercentages['Left'] + leanPercentages['Left-Leaning'];
  const centerPerc = leanPercentages['Center'];
  const rightCombinedPerc = leanPercentages['Right'] + leanPercentages['Right-Leaning'];

  const statBoxes = [ /* ... (no changes) ... */
    { key: 'analyzed', title: 'Articles Analyzed', value: totalAnalyzed, desc: 'Total times you viewed the "Analysis" popup.' },
    { key: 'read', title: 'Articles Read', value: totalRead, desc: 'Total times you clicked "Read Article".' },
    { key: 'shared', title: 'Articles Shared', value: totalShared, desc: "Total articles you've shared with others." },
    { key: 'compared', title: 'Comparisons Viewed', value: totalCompared, desc: 'Total times you clicked "Compare Coverage".' }
  ];

  // --- RENDER LOGIC ---
  return (
    <div className="bias-dashboard-page">
      <div className="dashboard-content-wrapper">

        {/* --- Left Column (Fixed) --- */}
        <div className="dashboard-left-column">
           {/* Section Title + Time Selector + Back Button Aligned */}
           <div className="section-title-header">
             <h2 className="section-title no-border">Your Activity</h2>
             <div className="header-actions"> {/* Wrapper for right side items */}
                 <div className="date-range-selector"> <span>Viewing All-Time Stats</span> </div>
                 {/* --- *** MOVED Back Button HERE *** --- */}
                 <Link to="/" className="btn-secondary btn-small" style={{ textDecoration: 'none' }}>
                   Back to Articles
                 </Link>
             </div>
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
              {loadingStats ? <div className="loading-container simple"><div className="spinner small"></div></div> : totalLeanArticles > 0 ? (
                <>
                  <div className="lean-bar">
                     { leftCombinedPerc > 0 &&
                       <div className="lean-segment left" style={{ width: `${leftCombinedPerc}%` }}>
                          {/* --- *** UPDATED THRESHOLD *** --- */}
                          {leftCombinedPerc >= 10 ? `L ${leftCombinedPerc}%` : ''} 
                       </div> }
                     { centerPerc > 0 &&
                       <div className="lean-segment center" style={{ width: `${centerPerc}%` }}>
                           {/* --- *** UPDATED THRESHOLD *** --- */}
                           {centerPerc >= 10 ? `C ${centerPerc}%` : ''} 
                       </div> }
                     { rightCombinedPerc > 0 &&
                       <div className="lean-segment right" style={{ width: `${rightCombinedPerc}%` }}>
                           {/* --- *** UPDATED THRESHOLD *** --- */}
                           {rightCombinedPerc >= 10 ? `R ${rightCombinedPerc}%` : ''} 
                       </div> }
                  </div>
                  <ul className="lean-details">
                     {leftCombinedPerc > 0 && (
                        <li><span>{leftCombinedPerc}%</span> of analyzed stories lean left.</li>
                     )}
                      {centerPerc > 0 && (
                         <li><span>{centerPerc}%</span> of analyzed stories were balanced.</li>
                      )}
                       {rightCombinedPerc > 0 && (
                         <li><span>{rightCombinedPerc}%</span> of analyzed stories lean right.</li>
                       )}
                  </ul>
                </>
              ) : (
                <p className="no-data-msg small">No analysis data available yet.</p>
              )}
            </div>

        </div> {/* --- End Left Column --- */}

        {/* --- Right Column (Scrollable) --- */}
        <div className="dashboard-right-column">
          {/* --- *** Sticky Header Wrapper *** --- */}
          <div className="sticky-header-wrapper">
             {/* --- *** CHANGED TITLE HERE *** --- */}
             <h2 className="section-title">Your Reading Habits Dashboard</h2> 
          </div>

          {/* --- *** SWAPPED CHART POSITIONS *** --- */}

          {/* Stories Analyzed Over Time (Full Width) */}
          <div className="dashboard-card full-width-chart-card stories-read-card"> {/* Added class */}
              {/* <div className="card-header"> <h3>Stories Analyzed Over Time</h3> </div> Removed Title */}
              <div className="chart-container stories-read-chart">
                 {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                  : (statsData?.dailyCounts?.length > 0) ? ( <Line options={storiesReadOptions} data={storiesReadData} /> )
                  : ( <p className="no-data-msg">No analysis data for this period.</p> )}
              </div>
          </div>

          {/* Grid for Remaining Charts */}
          <div className="dashboard-grid">

            {/* Top Categories (Column/Bar Chart) */}
             <div className="dashboard-card">
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && categoryReadData.labels.length > 0) ? ( <Bar options={getBarChartOptions('Top Categories (Analyzed)')} data={categoryReadData} /> ) 
                   : ( <p className="no-data-msg">No analysis data for this period.</p> )}
               </div>
             </div>

            {/* Political Lean (Analyzed - Doughnut) */}
             <div className="dashboard-card">
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalLeanArticles > 0) ? ( <Doughnut options={getDoughnutChartOptions('Political Lean (Analyzed)')} data={leanReadData} /> )
                   : ( <p className="no-data-msg">No analysis data for this period.</p> )}
               </div>
             </div>
             
             {/* Article Quality (Doughnut Chart) */}
             <div className="dashboard-card">
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && qualityReadData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('Article Quality (Analyzed)')} data={qualityReadData} /> )
                   : ( <p className="no-data-msg">No analysis data for this period.</p> )}
               </div>
             </div>

            {/* Political Lean (Shared - Doughnut) */}
             <div className="dashboard-card">
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalShared > 0) ? ( <Doughnut options={getDoughnutChartOptions('Political Lean (Shared)')} data={leanSharedData} /> )
                   : ( <p className="no-data-msg">You haven't shared any articles yet.</p> )}
               </div>
             </div>
             
          </div> {/* End dashboard-grid (right column) */}

          {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}

          {/* --- *** REMOVED Back Button from here *** --- */}

        </div> {/* --- End Right Column --- */}
      </div> {/* --- End Content Wrapper --- */}
    </div> // End bias-dashboard-page
  );
}

export default MyNewsBias;
