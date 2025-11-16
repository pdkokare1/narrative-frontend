// In file: src/MyDashboard.js
// --- FIX: Component now accepts `theme` as a prop ---
// --- FIX: Removed the line `const theme = document.body.className...` ---
// --- FIX: Re-added 'Your Activity' h2 (desktop-only) ---
// --- FIX: Re-structured header to align 'Stats' to the right ---
// --- FIX: Moved 'Account Settings' link to a new 'dashboard-left-footer' div ---
// --- FIX (2025-11-15): New header layout per user request ---
// --- FIX (2025-11-16): Removed Account Settings button (moved to Sidebar) ---
// --- FIX (2025-11-16): Added sticky-header-wrapper to right column ---
// --- FIX (2025-11-16b): Removed 'no-border-bottom' from left header ---
// --- FIX (2025-11-16c): Moved 'Viewing All-Time Stats' to right header ---
// --- FIX (2025-11-16d): ALIGNMENT FIX per user screenshot ---
// --- FIX (2025-11-16g): Changed left column <span> to <h2> to match right column ---
// --- FIX (2025-11-16i): REMOVED sticky wrapper from left column (it was the problem) ---
// --- *** THIS IS THE FIX: Added Account Settings button to left footer *** ---
// --- *** BUILD FIX: Corrected </Doughnut> closing tag to </p> *** ---
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Use Link for Back to Articles
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css'; // For theme variables
import './DashboardPages.css'; // Shared CSS file

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, TimeScale
);

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// --- Data & Color Helpers ---
const getActionCount = (totals, action) => {
  const item = totals.find(t => t.action === action);
  return item ? item.count : 0;
};
const leanOrder = ['Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];

// --- UPDATED: Center color is now green ---
const leanColors = {
    'Left': '#dc2626', 'Left-Leaning': '#f87171', 'Center': '#4CAF50', // Was '#6b7280'
    'Right-Leaning': '#60a5fa', 'Right': '#2563eb', 'Not Applicable': '#a1a1aa'
};
// --- END UPDATE ---

const sentimentColors = {
  'Positive': '#2563eb',
  'Negative': '#dc2626',
  'Neutral': '#6b7280'
};
const categoryColorsDark = ['#B38F5F', '#CCA573', '#D9B98A', '#E6CB9F', '#9C7C50', '#8F6B4D', '#C19A6B', '#AE8A53', '#D0B48F', '#B8860B'];
const categoryColorsLight = ['#2E4E6B', '#3E6A8E', '#5085B2', '#63A0D6', '#243E56', '#1A2D3E', '#4B77A3', '#395D7D', '#5D92C1', '#004E8A'];
// --- End Helpers ---


// --- Main Component ---
// --- (FIX) Accept `theme` as a prop ---
function MyDashboard({ theme }) {
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  // --- (FIX) Removed this line:
  // const theme = document.body.className.includes('dark') ? 'dark' : 'light';

   const chartColors = useMemo(() => {
      // --- (FIX) Use the `theme` prop directly ---
      const isDark = theme === 'dark';
      return {
         textPrimary: isDark ? '#EAEAEA' : '#2C2C2C',
         textSecondary: isDark ? '#B0B0B0' : '#555555',
         textTertiary: isDark ? '#757575' : '#888888',
         borderColor: isDark ? '#333333' : '#EAEAEA',
         tooltipBg: isDark ? '#2C2C2C' : '#FDFDFD',
         categoryPalette: isDark ? categoryColorsDark : categoryColorsLight,
         accentPrimary: isDark ? '#B38F5F' : '#2E4E6B',
         // --- ADDED: Hardcoded trend colors ---
         trendUp: isDark ? '#4CAF50' : '#2E7D32',
         trendDown: isDark ? '#E57373' : '#C62828',
      };
   }, [theme]); // (FIX) Now depends on the `theme` prop

  // Fetch aggregated stats
  useEffect(() => {
    const fetchStats = async () => {
      setError('');
      setLoadingStats(true);
      try {
        const response = await axios.get(`${API_URL}/profile/stats`);
        setStatsData(response.data);
      }
      catch (err) {
        console.error('Error fetching stats:', err);
        setError('Could not load statistics data. ');
      }
      finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);


  // --- Chart Options ---
  const getDoughnutChartOptions = useCallback((title) => ({
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: chartColors.textSecondary, boxWidth: 12, padding: 15 } },
        tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary },
        title: { display: true, text: title, color: chartColors.textPrimary, font: { size: 14 } }
      },
      cutout: '60%',
   }), [chartColors]);

    const getBarChartOptions = useCallback((title, axisLabel = 'Number of Articles') => ({
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: axisLabel, color: chartColors.textSecondary },
          ticks: { color: chartColors.textTertiary, stepSize: 1 },
          grid: { color: chartColors.borderColor }
        },
        y: {
          ticks: { color: chartColors.textSecondary },
          grid: { display: false }
        },
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
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'MMM d, yyyy', displayFormats: { day: 'MMM d' }},
          title: { display: true, text: 'Date', color: chartColors.textSecondary },
          ticks: { color: chartColors.textTertiary },
          grid: { color: chartColors.borderColor }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Stories Analyzed', color: chartColors.textSecondary },
          ticks: { color: chartColors.textTertiary, stepSize: 1 },
          grid: { color: chartColors.borderColor }
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary },
        title: {
          display: true,
          text: 'Stories Analyzed Over Time',
          color: chartColors.textPrimary,
          font: { size: 14 }
        }
      },
   }), [chartColors]);

  // --- Chart Data Preparation ---
  const prepareLeanData = (rawData) => {
    const counts = (rawData || []).reduce((acc, item) => { acc[item.lean] = item.count; return acc; }, {});
    const data = leanOrder.map(lean => counts[lean] || 0);
    const backgroundColors = leanOrder.map(lean => leanColors[lean]);
    const filteredLabels = leanOrder.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    return { labels: filteredLabels, datasets: [{ label: 'Articles', data: filteredData, backgroundColor: filteredColors, borderColor: chartColors.borderColor, borderWidth: 1 }] };
  };

  const prepareCategoryData = (rawData) => {
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10).reverse();
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

  const prepareTopSourcesData = (rawData) => {
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10).reverse();
    // --- UPDATED: Use same logic as prepareCategoryData ---
    const themeCategoryColors = chartColors.categoryPalette;
    return {
      labels: sortedData.map(d => d.source),
      datasets: [{
        label: 'Articles Analyzed',
        data: sortedData.map(d => d.count),
        backgroundColor: sortedData.map((_, i) => themeCategoryColors[i % themeCategoryColors.length]),
        borderColor: chartColors.borderColor,
        borderWidth: 1,
      }],
    };
  };

  const prepareSentimentData = (rawData) => {
    const counts = (rawData || []).reduce((acc, item) => { acc[item.sentiment] = item.count; return acc; }, {});
    const labels = ['Positive', 'Neutral', 'Negative'];
    const data = labels.map(label => counts[label] || 0);
    const backgroundColors = labels.map(label => sentimentColors[label]);
    const filteredLabels = labels.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    return {
      labels: filteredLabels,
      datasets: [{
        label: 'Articles',
        data: filteredData,
        backgroundColor: filteredColors,
        borderColor: chartColors.borderColor,
        borderWidth: 1
      }]
    };
  };

  const storiesReadData = useMemo(() => {
    const labels = statsData?.dailyCounts?.map(item => item.date) || [];
    const data = statsData?.dailyCounts?.map(item => item.count) || [];
    
    // --- UPDATED: Conditional coloring logic ---
    const getSegmentBorderColor = (ctx) => {
      const y1 = ctx.p0.parsed.y;
      const y2 = ctx.p1.parsed.y;
      if (y2 > y1) return chartColors.trendUp;
      if (y2 < y1) return chartColors.trendDown;
      return chartColors.textTertiary; // Neutral color for no change
    };

    const getPointBackgroundColor = (ctx) => {
      if (ctx.dataIndex === 0) return chartColors.accentPrimary; // First point
      const y1 = ctx.chart.data.datasets[0].data[ctx.dataIndex - 1];
      const y2 = ctx.chart.data.datasets[0].data[ctx.dataIndex];
      if (y2 > y1) return chartColors.trendUp;
      if (y2 < y1) return chartColors.trendDown;
      return chartColors.textTertiary;
    };
    
    return {
      labels: labels,
      datasets: [{
        label: 'Stories Analyzed',
        data: data,
        fill: false,
        tension: 0.1,
        // --- UPDATED: Use conditional segment/point colors ---
        segment: {
          borderColor: getSegmentBorderColor,
        },
        pointBackgroundColor: getPointBackgroundColor,
        pointBorderColor: (ctx) => getPointBackgroundColor(ctx), // Match border
        // --- END OF UPDATE ---
      }],
    };
  }, [statsData?.dailyCounts, chartColors]);
  // --- END OF UPDATE ---

  const leanReadData = prepareLeanData(statsData?.leanDistribution_read);
  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const topSourcesData = prepareTopSourcesData(statsData?.topSources_read);
  const sentimentReadData = prepareSentimentData(statsData?.sentimentDistribution_read);
  const qualityReadData = useMemo(() => {
    const qualityLabels = ['A+ Excellent (90-100)', 'A High (80-89)', 'B Professional (70-79)', 'C Acceptable (60-69)', 'D-F Poor (0-59)', 'N/A (Review/Opinion)'];
    const qualityColorsMap = {'A+ Excellent (90-100)': '#2563eb', 'A High (80-89)': '#60a5fa', 'B Professional (70-79)': '#4CAF50', 'C Acceptable (60-69)': '#F59E0B', 'D-F Poor (0-59)': '#dc2626', 'N/A (Review/Opinion)': '#a1a1aa'};
    const rawData = statsData?.qualityDistribution_read;
    const rawCountsMap = (rawData || []).reduce((acc, item) => { acc[item.grade] = item.count; return acc; }, {});
    const dbCounts = rawCountsMap;
    const data = [dbCounts['A+'] || 0, (dbCounts['A'] || 0) + (dbCounts['A-'] || 0), (dbCounts['B+'] || 0) + (dbCounts['B'] || 0) + (dbCounts['B-'] || 0), (dbCounts['C+'] || 0) + (dbCounts['C'] || 0) + (dbCounts['C-'] || 0), (dbCounts['D+'] || 0) + (dbCounts['D'] || 0) + (dbCounts['D-'] || 0) + (dbCounts['F'] || 0) + (dbCounts['D-F'] || 0), dbCounts[null] || 0];
    const backgroundColors = qualityLabels.map(label => qualityColorsMap[label] || '#a1a1aa');
    const filteredLabels = qualityLabels.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    return { labels: filteredLabels, datasets: [{ label: 'Articles Read', data: filteredData, backgroundColor: filteredColors, borderColor: chartColors.borderColor, borderWidth: 1 }] };
  }, [statsData?.qualityDistribution_read, chartColors.borderColor]);
  const leanSharedData = prepareLeanData(statsData?.leanDistribution_shared);

  // Calculate totals
  const totals = statsData?.totalCounts || [];
  const totalAnalyzed = getActionCount(totals, 'view_analysis');
  const totalShared = getActionCount(totals, 'share_article');
  const totalCompared = getActionCount(totals, 'view_comparison');
  const totalRead = getActionCount(totals, 'read_external');

  // Calculate lean percentages for BAR
  const leanReadCounts = (statsData?.leanDistribution_read || []).reduce((acc, item) => { acc[item.lean] = item.count; return acc; }, {});
  const totalApplicableLeanArticles = (leanReadCounts['Left'] || 0) + (leanReadCounts['Left-Leaning'] || 0) + (leanReadCounts['Center'] || 0) + (leanReadCounts['Right-Leaning'] || 0) + (leanReadCounts['Right'] || 0);

  const calculateBarPercentage = (leanTypes) => {
    if (totalApplicableLeanArticles === 0) return 0;
    const count = leanTypes.reduce((sum, type) => sum + (leanReadCounts[type] || 0), 0);
    return Math.round((count / totalApplicableLeanArticles) * 100);
  };

  const leftCombinedPerc = calculateBarPercentage(['Left', 'Left-Leaning']);
  const centerPerc = calculateBarPercentage(['Center']);
  const rightCombinedPerc = calculateBarPercentage(['Right-Leaning', 'Right']);
  // --- END BAR CALC ---

  const statBoxes = [
    { key: 'analyzed', title: 'Articles Analyzed', value: totalAnalyzed, desc: 'No. of articles you have analyzed.' },
    { key: 'read', title: 'Articles Read', value: totalRead, desc: 'No. of articles you have read.' },
    { key: 'shared', title: 'Articles Shared', value: totalShared, desc: 'No. of articles shared with others.' },
    { key: 'compared', title: 'Comparisons Viewed', value: totalCompared, desc: "No. of articles you've compared." }
  ];

  // --- RENDER LOGIC ---
  return (
    <div className="dashboard-page">
      <div className="dashboard-content-wrapper">

        {/* --- Left Column --- */}
        <div className="dashboard-left-column">
          {/* --- This new div handles scrolling --- */}
          <div className="dashboard-left-scroll">
            
            {/* --- *** THIS IS THE FIX *** --- */}
            {/* The sticky wrapper has been REMOVED from the left column. */}
            <div className="section-title-header">
              <h2 className="section-title">Your Activity</h2>
              <div className="header-actions">
                <Link to="/" className="btn-secondary btn-small" style={{ textDecoration: 'none' }}>
                  Back to Articles
                </Link>
              </div>
            </div>
            {/* --- *** END OF FIX *** --- */}


            {/* Activity Stat Boxes (now wrapped) */}
            <div className="dashboard-card no-padding"> {/* Add no-padding if needed */}
              <div className="stat-box-grid">
                {statBoxes.map(box => (
                  <div key={box.key} className="stat-box"> {/* Removed dashboard-card from here */}
                    <h3>{box.title}</h3>
                    <p className="stat-number">{loadingStats ? '...' : box.value}</p>
                    <p className="stat-description">{box.desc}</p>
                  </div>
                ))}
              </div>
            </div>


            {/* Reading Bias Card */}
            <h2 className="section-title reading-bias-title">Reading Bias</h2> {/* ADDED CLASS */}
            <div className="dashboard-card lean-summary-card"> {/* Already a card */}
                {loadingStats ? <div className="loading-container simple"><div className="spinner small"></div></div> : totalApplicableLeanArticles > 0 ? ( // USE APPLICABLE TOTAL
                  <>
                    {/* --- NEW: Visual Key / Legend --- */}
                    <div className="lean-legend">
                      <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: leanColors['Left'] }}></span> Left
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: leanColors['Center'] }}></span> Center
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: leanColors['Right'] }}></span> Right
                      </div>
                    </div>
                    {/* --- END NEW --- */}

                    <div className="lean-bar">
                      {/* --- UPDATED: Use calculated percentages --- */}
                      { leftCombinedPerc > 0 && <div className="lean-segment left" style={{ width: `${leftCombinedPerc}%` }}>{leftCombinedPerc >= 10 ? `L ${leftCombinedPerc}%` : ''}</div> }
                      { centerPerc > 0 && <div className="lean-segment center" style={{ width: `${centerPerc}%` }}>{centerPerc >= 10 ? `C ${centerPerc}%` : ''}</div> }
                      { rightCombinedPerc > 0 && <div className="lean-segment right" style={{ width: `${rightCombinedPerc}%` }}>{rightCombinedPerc >= 10 ? `R ${rightCombinedPerc}%` : ''}</div> }
                    </div>
                    <ul className="lean-details">
                      {/* --- UPDATED: Use calculated percentages --- */}
                      {leftCombinedPerc > 0 && (<li><span>{leftCombinedPerc}%</span> analyzed lean left.</li>)}
                      {centerPerc > 0 && (<li><span>{centerPerc}%</span> analyzed were balanced.</li>)}
                      {rightCombinedPerc > 0 && (<li><span>{rightCombinedPerc}%</span> analyzed lean right.</li>)}
                    </ul>
                  </>
                ) : ( <p className="no-data-msg small">No applicable analysis data available yet.</p> )}
              </div>
          </div> 
          {/* --- End of dashboard-left-scroll --- */}

          {/* --- *** THIS IS THE FIX: ADDED FOOTER FOR BUTTON *** --- */}
          <div className="dashboard-left-footer">
            <Link to="/account-settings" className="account-settings-link-dashboard">
              Account Settings
            </Link>
          </div>
          {/* --- *** END OF FIX *** --- */}

        </div> {/* --- End Left Column --- */}

        {/* --- Right Column --- */}
        <div className="dashboard-right-column">
          
          {/* --- *** THIS IS THE FIX *** --- */}
          {/* Renamed class back to 'sticky-header-wrapper' */}
          <div className="sticky-header-wrapper">
            <div className="section-title-header">
                <h2 className="section-title">Your Reading Habits</h2>
                <div className="date-range-selector"> 
                  <span>Viewing All-Time Stats</span> 
                </div>
            </div>
          </div>
          {/* --- *** END OF FIX *** --- */}


          {/* Stories Analyzed Over Time (Full Width) */}
          <div className="dashboard-card full-width-chart-card stories-read-card"> {/* Already a card */}
              <div className="chart-container stories-read-chart">
                 {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                  : (statsData?.dailyCounts?.length > 0) ? ( <Line options={storiesReadOptions} data={storiesReadData} /> )
                  : ( <p className="no-data-msg">No analysis data for this period.</p> )}
              </div>
          </div>

          {/* Grid for Remaining Charts */}
          <div className="dashboard-grid">

            {/* Each chart is now wrapped in dashboard-card */}
             <div className="dashboard-card">
               <h3>Top Categories (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && categoryReadData.labels.length > 0) ? ( <Bar options={getBarChartOptions('', 'Articles Analyzed')} data={categoryReadData} /> ) // Remove title from options
                   : ( <p className="no-data-msg">No category data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Top Sources (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && topSourcesData.labels.length > 0) ? ( <Bar options={getBarChartOptions('', 'Articles Analyzed')} data={topSourcesData} /> ) // Remove title from options
                   : ( <p className="no-data-msg">No source data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Political Lean (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalApplicableLeanArticles > 0) ? ( <Doughnut options={getDoughnutChartOptions('')} data={leanReadData} /> ) // USE APPLICABLE TOTAL
                   : ( <p className="no-data-msg">No lean data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Sentiment Breakdown (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && sentimentReadData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('')} data={sentimentReadData} /> ) // Remove title from options
                   : ( <p className="no-data-msg">No sentiment data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Article Quality (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && qualityReadData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('')} data={qualityReadData} /> ) // Remove title from options
                   : ( <p className="no-data-msg">No quality data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Political Lean (Shared)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalShared > 0 && leanSharedData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('')} data={leanSharedData} /> ) // Remove title from options
                   : ( <p className="no-data-msg">You haven't shared articles yet.</p> )}
               </div>
             </div>

          </div> {/* End dashboard-grid (right column) */}

          {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}

        </div> {/* --- End Right Column --- */}
      </div> {/* --- End Content Wrapper --- */}
    </div> // End dashboard-page
  );
}

export default MyDashboard;
