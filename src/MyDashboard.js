// In file: src/MyDashboard.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './DashboardPages.css'; // Use the new CSS file

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, TimeScale
);

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper to get total count from the new stats object
const getActionCount = (totals, action) => {
  const item = totals.find(t => t.action === action);
  return item ? item.count : 0;
};

// --- Chart Colors & Order Definitions ---
const leanOrder = ['Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];
const leanColors = {
    'Left': '#dc2626', 'Left-Leaning': '#f87171', 'Center': '#6b7280',
    'Right-Leaning': '#60a5fa', 'Right': '#2563eb', 'Not Applicable': '#a1a1aa'
};
// Updated to handle 'null' for Review/Opinion
const qualityLabels = [
    'A+ Excellent (90-100)', 'A High (80-89)', 'B Professional (70-79)',
    'C Acceptable (60-69)', 'D-F Poor (0-59)', 'N/A (Review/Opinion)'
];
const qualityColors = {
    'A+ Excellent (90-100)': '#2563eb', 'A High (80-89)': '#60a5fa',
    'B Professional (70-79)': '#4CAF50', 'C Acceptable (60-69)': '#F59E0B',
    'D-F Poor (0-59)': '#dc2626', 'N/A (Review/Opinion)': '#a1a1aa'
};
const sentimentColors = {
  'Positive': '#4CAF50',
  'Negative': '#dc2626',
  'Neutral': '#6b7280'
};
// Palettes for light/dark themes
const categoryColorsDark = ['#B38F5F', '#CCA573', '#D9B98A', '#E6CB9F', '#9C7C50', '#8F6B4D', '#C19A6B', '#AE8A53', '#D0B48F', '#B8860B'];
const categoryColorsLight = ['#2E4E6B', '#3E6A8E', '#5085B2', '#63A0D6', '#243E56', '#1A2D3E', '#4B77A3', '#395D7D', '#5D92C1', '#004E8A'];
const sourceColorsDark = ['#64B5F6', '#81C784', '#FFB74D', '#E57373', '#BA68C8', '#AED581', '#FFF176', '#FF8A65', '#90A4AE', '#A1887F'];
const sourceColorsLight = ['#1976D2', '#388E3C', '#FFA000', '#D32F2F', '#7B1FA2', '#689F38', '#FBC02D', '#E64A19', '#546E7A', '#5D4037'];


// --- Main Component ---
// Note: We get 'theme' prop from App.js
function MyDashboard({ theme }) {
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Check mobile state on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define chart colors based on theme
  const chartColors = useMemo(() => {
    const isDark = theme === 'dark';
    return {
       textPrimary: isDark ? '#EAEAEA' : '#2C2C2C',
       textSecondary: isDark ? '#B0B0B0' : '#555555',
       textTertiary: isDark ? '#757575' : '#888888',
       borderColor: isDark ? '#333333' : '#EAEAEA',
       tooltipBg: isDark ? '#2C2C2C' : '#FDFDFD',
       accentPrimary: isDark ? '#B38F5F' : '#2E4E6B',
       categoryPalette: isDark ? categoryColorsDark : categoryColorsLight,
       sourcePalette: isDark ? sourceColorsDark : sourceColorsLight,
    };
  }, [theme]);

  // Fetch aggregated stats from our new endpoint
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
  }, []); // Run once


  // --- Chart Options Definitions ---
  const getDoughnutChartOptions = useCallback((title) => ({
      responsive: true, maintainAspectRatio: false,
      plugins: { 
        legend: { position: 'bottom', labels: { color: chartColors.textSecondary, boxWidth: 12, padding: 15 } }, 
        tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary }, 
        title: { display: true, text: title, color: chartColors.textPrimary, font: { size: 14 } } 
      }, 
      cutout: '60%',
  }), [chartColors]);
  
  const getBarChartOptions = useCallback((title, yLabel = 'Number of Articles') => ({
      responsive: true, maintainAspectRatio: false,
      scales: { 
        x: { ticks: { color: chartColors.textTertiary }, grid: { display: false } }, 
        y: { beginAtZero: true, title: { display: true, text: yLabel, color: chartColors.textSecondary }, ticks: { color: chartColors.textTertiary, stepSize: 1 }, grid: { color: chartColors.borderColor } }, 
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
      plugins: { 
        legend: { display: false }, 
        tooltip: { backgroundColor: chartColors.tooltipBg, titleColor: chartColors.textPrimary, bodyColor: chartColors.textSecondary },
        title: { display: true, text: 'Stories Analyzed Over Time', color: chartColors.textPrimary, font: { size: 14 } }
      },
  }), [chartColors]);

  // --- Chart Data Preparation ---

  // Prepare Lean Data (Used for Read & Shared)
  const prepareLeanData = (rawData) => {
    const counts = (rawData || []).reduce((acc, item) => { acc[item.lean] = item.count; return acc; }, {});
    const data = leanOrder.map(lean => counts[lean] || 0);
    const backgroundColors = leanOrder.map(lean => leanColors[lean]);
    
    // Filter out labels/data that are zero
    const filteredLabels = leanOrder.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    
    return { labels: filteredLabels, datasets: [{ label: 'Articles', data: filteredData, backgroundColor: filteredColors, borderColor: chartColors.borderColor, borderWidth: 1 }] };
  };

  // Prepare Category Data (Bar Chart)
  const prepareCategoryData = (rawData) => {
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count); // Already pre-sorted and limited by backend
    const themeCategoryColors = chartColors.categoryPalette;
    return {
      labels: sortedData.map(d => d.category),
      datasets: [{
        label: 'Articles Analyzed',
        data: sortedData.map(d => d.count),
        backgroundColor: sortedData.map((_, i) => themeCategoryColors[i % themeCategoryColors.length]),
        borderColor: chartColors.borderColor,
        borderWidth: 1,
      }],
    };
  };
  
  // Prepare Quality Data (Doughnut)
  const prepareQualityData = (rawData) => {
    const rawCountsMap = (rawData || []).reduce((acc, item) => { acc[item.grade] = item.count; return acc; }, {});
    const dbCounts = rawCountsMap;

    // We now group by the pre-defined labels
    const data = [ 
      dbCounts['A+'] || 0, // A+
      (dbCounts['A'] || 0) + (dbCounts['A-'] || 0), // A
      (dbCounts['B+'] || 0) + (dbCounts['B'] || 0) + (dbCounts['B-'] || 0), // B
      (dbCounts['C+'] || 0) + (dbCounts['C'] || 0) + (dbCounts['C-'] || 0), // C
      (dbCounts['D+'] || 0) + (dbCounts['D'] || 0) + (dbCounts['D-'] || 0) + (dbCounts['F'] || 0) + (dbCounts['D-F'] || 0), // D-F
      dbCounts[null] || 0 // N/A (Review/Opinion) - This is the key change
    ];
    
    const backgroundColors = qualityLabels.map(label => qualityColors[label] || '#a1a1aa');

    // Filter out labels/data that are zero
    const filteredLabels = qualityLabels.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    
    return { labels: filteredLabels, datasets: [{ label: 'Articles Analyzed', data: filteredData, backgroundColor: filteredColors, borderColor: chartColors.borderColor, borderWidth: 1 }] };
  };

  // Prepare Daily Counts (Line Chart)
  const storiesReadData = useMemo(() => {
    const labels = statsData?.dailyCounts?.map(item => item.date) || [];
    const data = statsData?.dailyCounts?.map(item => item.count) || [];
    const defaultColor = chartColors.accentPrimary;
    const upColor = '#4CAF50'; // Green
    const downColor = '#dc2626'; // Red
          
    return {
      labels: labels,
      datasets: [{
        label: 'Stories Analyzed',
        data: data,
        fill: false,
        tension: 0.1,
        segment: {
          borderColor: (ctx) => {
            if (ctx.p0.skip || ctx.p1.skip || !ctx.p1.raw || !ctx.p0.raw) {
              return defaultColor; 
            }
            if (ctx.p1.raw > ctx.p0.raw) {
              return upColor; // Green for increase
            }
            if (ctx.p1.raw < ctx.p0.raw) {
              return downColor; // Red for decrease
            }
            return defaultColor;
          }
        },
        pointBackgroundColor: (ctx) => {
          if (ctx.dataIndex === 0) return defaultColor;
          const current = data[ctx.dataIndex];
          const prev = data[ctx.dataIndex - 1];
          if (current > prev) return upColor;
          if (current < prev) return downColor;
          return defaultColor;
        },
        pointBorderColor: (ctx) => {
          if (ctx.dataIndex === 0) return defaultColor;
          const current = data[ctx.dataIndex];
          const prev = data[ctx.dataIndex - 1];
          if (current > prev) return upColor;
          if (current < prev) return downColor;
          return defaultColor;
        }
      }],
    };
  }, [statsData?.dailyCounts, chartColors]);

  // --- NEW: Prepare Top Sources Data (Bar Chart) ---
  const prepareSourceData = (rawData) => {
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count);
    const themeSourceColors = chartColors.sourcePalette;
    return {
      labels: sortedData.map(d => d.source),
      datasets: [{
        label: 'Articles Analyzed',
        data: sortedData.map(d => d.count),
        backgroundColor: sortedData.map((_, i) => themeSourceColors[i % themeSourceColors.length]),
        borderColor: chartColors.borderColor,
        borderWidth: 1,
      }],
    };
  };
  
  // --- NEW: Prepare Sentiment Data (Doughnut) ---
  const prepareSentimentData = (rawData) => {
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count);
    return {
      labels: sortedData.map(d => d.sentiment),
      datasets: [{
        label: 'Articles',
        data: sortedData.map(d => d.count),
        backgroundColor: sortedData.map(d => sentimentColors[d.sentiment] || '#a1a1aa'),
        borderColor: chartColors.borderColor,
        borderWidth: 1,
      }],
    };
  };

  // --- Get All Chart Data ---
  const leanReadData = prepareLeanData(statsData?.leanDistribution_read);
  const leanSharedData = prepareLeanData(statsData?.leanDistribution_shared);
  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const qualityReadData = prepareQualityData(statsData?.qualityDistribution_read);
  const topSourcesData = prepareSourceData(statsData?.topSources_read);
  const sentimentData = prepareSentimentData(statsData?.sentimentDistribution_read);
  
  // --- Calculate Totals ---
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
  const notApplicablePerc = leanPercentages['Not Applicable'];

  // Stat Boxes for the top
  const statBoxes = [
    { key: 'analyzed', title: 'Articles Analyzed', value: totalAnalyzed, desc: 'No. of articles you have analyzed.' },
    { key: 'read', title: 'Articles Read', value: totalRead, desc: 'No. of articles read from the source.' },
    { key: 'shared', title: 'Articles Shared', value: totalShared, desc: 'No. of articles shared with others.' },
    { key: 'compared', title: 'Comparisons Viewed', value: totalCompared, desc: "No. of articles you've compared." }
  ];

  // --- RENDER LOGIC ---
  
  // Helper to render a chart box
  const renderChartBox = (title, data, chartType, options, linkTo = null) => {
    const isLoading = loadingStats;
    const hasData = data && data.labels && data.labels.length > 0;
    
    let chartContent;
    if (isLoading) {
      chartContent = <div className="loading-container"><div className="spinner"></div></div>;
    } else if (hasData) {
      if (chartType === 'Doughnut') {
        chartContent = <Doughnut options={options} data={data} />;
      } else if (chartType === 'Bar') {
        chartContent = <Bar options={options} data={data} />;
      } else if (chartType === 'Line') {
        chartContent = <Line options={options} data={data} />;
      }
    } else {
      chartContent = <p className="no-data-msg">No data available for this chart yet.</p>;
    }
    
    return (
      <div className="dashboard-card">
        {isMobile && linkTo && hasData && (
          <Link to={linkTo} className="mobile-view-details-link">View Details &gt;</Link>
        )}
        <div className={`chart-container ${chartType === 'Line' ? 'stories-read-chart' : 'article-bias-chart'}`}>
          {chartContent}
        </div>
      </div>
    );
  };
  
  // This is the component for the right-hand (scrollable) column
  // On mobile, it's not rendered.
  const DesktopChartsColumn = () => (
    <div className="dashboard-right-column">
      {/* Sticky Header */}
      <div className="sticky-header-wrapper">
         <div className="section-title-header">
            <h2 className="section-title no-border">Your Reading Habits Dashboard</h2>
            <div className="header-actions">
                <div className="date-range-selector"> <span>Viewing All-Time Stats</span> </div>
            </div>
         </div>
      </div>

      {/* Stories Analyzed Over Time (Full Width) */}
      <div className="dashboard-card full-width-chart-card stories-read-card"> 
          {renderChartBox('Stories Analyzed Over Time', storiesReadData, 'Line', storiesReadOptions)}
      </div>

      {/* Grid for Remaining Charts */}
      <div className="dashboard-grid">
        
        {/* Top Categories */}
         {renderChartBox('Top Categories (Analyzed)', categoryReadData, 'Bar', getBarChartOptions('Top Categories (Analyzed)'))}

        {/* Political Lean (Analyzed) */}
         {renderChartBox('Political Lean (Analyzed)', leanReadData, 'Doughnut', getDoughnutChartOptions('Political Lean (Analyzed)'))}
         
         {/* Article Quality */}
         {renderChartBox('Article Quality (Analyzed)', qualityReadData, 'Doughnut', getDoughnutChartOptions('Article Quality (Analyzed)'))}

        {/* Top Sources */}
         {renderChartBox('Top Sources (Analyzed)', topSourcesData, 'Bar', getBarChartOptions('Top Sources (Analyzed)'))}
         
        {/* Sentiment Breakdown */}
         {renderChartBox('Sentiment Breakdown (Analyzed)', sentimentData, 'Doughnut', getDoughnutChartOptions('Sentiment Breakdown (Analyzed)'))}
         
        {/* Political Lean (Shared) */}
         {renderChartBox('Political Lean (Shared)', leanSharedData, 'Doughnut', getDoughnutChartOptions('Political Lean (Shared)'))}
         
      </div> 

      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}
    </div>
  );
  
  // This is the main component render
  return (
    <div className="dashboard-page">
      <div className="dashboard-content-wrapper">

        {/* --- Left Column (Always Visible) --- */}
        <div className="dashboard-left-column">
           <div className="section-title-header">
             <h2 className="section-title no-border">My Dashboard</h2>
             <div className="header-actions"> 
                 <Link to="/" className="btn-secondary btn-small" style={{ textDecoration: 'none' }}>
                   Back to Articles
                 </Link>
             </div>
           </div>

          {/* Activity Stat Boxes */}
          <h3 className="section-title-small">Your Activity</h3>
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
          <h3 className="section-title-small">Reading Bias</h3>
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
                     { notApplicablePerc > 0 &&
                       <div className="lean-segment not-applicable" style={{ width: `${notApplicablePerc}%` }}>
                           {notApplicablePerc >= 10 ? `N/A ${notApplicablePerc}%` : ''} 
                       </div> }
                  </div>
                  <ul className="lean-details">
                     {leftCombinedPerc > 0 && <li><span>{leftCombinedPerc}%</span> Left-Leaning</li>}
                     {centerPerc > 0 && <li><span>{centerPerc}%</span> Center</li>}
                     {rightCombinedPerc > 0 && <li><span>{rightCombinedPerc}%</span> Right-Leaning</li>}
                     {notApplicablePerc > 0 && <li><span>{notApplicablePerc}%</span> Reviews / N/A</li>}
                  </ul>
                </>
              ) : (
                <p className="no-data-msg small">No analysis data available yet.</p>
              )}
            </div>
            
            {/* --- Mobile Summary Charts --- */}
            {isMobile && (
              <div className="mobile-charts-column">
                <h3 className="section-title-small">Reading Habits Summary</h3>
                
                {/* Mobile Stories Over Time */}
                <div className="dashboard-card stories-read-card"> 
                    {renderChartBox('Stories Analyzed Over Time', storiesReadData, 'Line', storiesReadOptions, '/reading-habits')}
                </div>
                
                {/* Mobile Political Lean */}
                <div className="dashboard-card">
                    {renderChartBox('Political Lean (Analyzed)', leanReadData, 'Doughnut', getDoughnutChartOptions('Political Lean (Analyzed)'), '/reading-habits')}
                </div>
                
                {/* Mobile Top Categories */}
                <div className="dashboard-card">
                    {renderChartBox('Top Categories (Analyzed)', categoryReadData, 'Bar', getBarChartOptions('Top Categories (Analyzed)'), '/reading-habits')}
                </div>
                
                <Link to="/reading-habits" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', marginTop: '10px' }}>
                  View All Reading Habits
                </Link>
              </div>
            )}

        </div> {/* --- End Left Column --- */}

        {/* --- Right Column (Desktop Only) --- */}
        {!isMobile && <DesktopChartsColumn />}

      </div> {/* --- End Content Wrapper --- */}
    </div> // End dashboard-page
  );
}

export default MyDashboard;
