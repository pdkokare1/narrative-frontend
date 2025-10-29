// In file: src/ReadingHabits.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css'; // For theme variables
import './DashboardPages.css'; // New shared CSS file

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
const leanColors = {
    'Left': '#dc2626', 'Left-Leaning': '#f87171', 'Center': '#6b7280',
    'Right-Leaning': '#60a5fa', 'Right': '#2563eb', 'Not Applicable': '#a1a1aa'
};
const sentimentColors = {
  'Positive': '#2563eb',
  'Negative': '#dc2626',
  'Neutral': '#6b7280'
};
const categoryColorsDark = ['#B38F5F', '#CCA573', '#D9B98A', '#E6CB9F', '#9C7C50', '#8F6B4D', '#C19A6B', '#AE8A53', '#D0B48F', '#B8860B'];
const categoryColorsLight = ['#2E4E6B', '#3E6A8E', '#5085B2', '#63A0D6', '#243E56', '#1A2D3E', '#4B77A3', '#395D7D', '#5D92C1', '#004E8A'];
// --- End Helpers ---


// --- Main Component ---
function ReadingHabits() {
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  
  // Get theme from body class (App.js sets this)
  const theme = document.body.className.includes('dark') ? 'dark' : 'light';

   const chartColors = useMemo(() => {
      const isDark = theme === 'dark';
      return {
         textPrimary: isDark ? '#EAEAEA' : '#2C2C2C',
         textSecondary: isDark ? '#B0B0B0' : '#555555',
         textTertiary: isDark ? '#757575' : '#888888',
         borderColor: isDark ? '#333333' : '#EAEAEA',
         tooltipBg: isDark ? '#2C2C2C' : '#FDFDFD',
         categoryPalette: isDark ? categoryColorsDark : categoryColorsLight,
         accentPrimary: isDark ? '#B38F5F' : '#2E4E6B'
      };
   }, [theme]);

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
      indexAxis: 'y', // --- Make it horizontal ---
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
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10).reverse(); // Reverse for horizontal bar
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
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10).reverse(); // Reverse for horizontal bar
    return {
      labels: sortedData.map(d => d.source),
      datasets: [{
        label: 'Articles Analyzed',
        data: sortedData.map(d => d.count),
        backgroundColor: chartColors.accentPrimary, // Use single accent color
        borderWidth: 0,
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
    const defaultColor = chartColors.accentPrimary;
    return {
      labels: labels,
      datasets: [{
        label: 'Stories Analyzed',
        data: data,
        fill: false,
        tension: 0.1,
        borderColor: defaultColor, 
        pointBackgroundColor: defaultColor,
        pointBorderColor: defaultColor,
      }],
    };
  }, [statsData?.dailyCounts, chartColors]);

  // Prepare data for all charts
  const leanReadData = prepareLeanData(statsData?.leanDistribution_read);
  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const topSourcesData = prepareTopSourcesData(statsData?.topSources_read);
  const sentimentReadData = prepareSentimentData(statsData?.sentimentDistribution_read);
  
  const totals = statsData?.totalCounts || [];
  const totalAnalyzed = getActionCount(totals, 'view_analysis');
  const totalLeanArticles = statsData?.leanDistribution_read?.reduce((sum, item) => sum + item.count, 0) || 0;

  // --- RENDER LOGIC ---
  return (
    <div className="dashboard-page reading-habits-page">
      
      {/* --- Page Header --- */}
      <div className="dashboard-header">
        <h1>Reading Habits</h1>
        <nav className="dashboard-nav-links">
          <NavLink to="/my-dashboard" className={({isActive}) => isActive ? "active" : ""}>My Dashboard</NavLink>
          <NavLink to="/reading-habits" className={({isActive}) => isActive ? "active" : ""}>Reading Habits</NavLink>
          <NavLink to="/saved-articles" className={({isActive}) => isActive ? "active" : ""}>Saved Articles</NavLink>
          <NavLink to="/account-settings" className={({isActive}) => isActive ? "active" : ""}>Account</NavLink>
        </nav>
      </div>

      {/* --- Section: Detailed Charts --- */}
      <div className="section-title-header">
        <h2 className="section-title">Detailed Breakdowns</h2>
        <div className="header-actions">
            <div className="date-range-selector"> <span>Viewing All-Time Stats</span> </div>
        </div>
      </div>

      {/* --- This grid is VISIBLE on mobile --- */}
      <div className="dashboard-grid">
      
        {/* Stories Analyzed Over Time (Full Width) */}
        <div className="dashboard-card full-width-chart-card stories-read-card"> 
            <div className="chart-container stories-read-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                : (statsData?.dailyCounts?.length > 0) ? ( <Line options={storiesReadOptions} data={storiesReadData} /> )
                : ( <p className="no-data-msg">No analysis data for this period.</p> )}
            </div>
        </div>
        
        {/* Top Categories (Bar Chart) */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
               : (totalAnalyzed > 0 && categoryReadData.labels.length > 0) ? ( <Bar options={getBarChartOptions('Top Categories (Analyzed)')} data={categoryReadData} /> ) 
               : ( <p className="no-data-msg">No category data for this period.</p> )}
           </div>
         </div>

        {/* Top Sources (Bar Chart) */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
               : (totalAnalyzed > 0 && topSourcesData.labels.length > 0) ? ( <Bar options={getBarChartOptions('Top Sources (Analyzed)')} data={topSourcesData} /> ) 
               : ( <p className="no-data-msg">No source data for this period.</p> )}
           </div>
         </div>

        {/* Political Lean (Analyzed - Doughnut) */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
               : (totalLeanArticles > 0) ? ( <Doughnut options={getDoughnutChartOptions('Political Lean (Analyzed)')} data={leanReadData} /> )
               : ( <p className="no-data-msg">No lean data for this period.</p> )}
           </div>
         </div>
         
         {/* Sentiment Breakdown (Doughnut Chart) */}
         <div className="dashboard-card">
           <div className="chart-container article-bias-chart">
               {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
               : (totalAnalyzed > 0 && sentimentReadData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('Sentiment Breakdown (Analyzed)')} data={sentimentReadData} /> ) 
               : ( <p className="no-data-msg">No sentiment data for this period.</p> )}
           </div>
         </div>
         
      </div> {/* End dashboard-grid */}

      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}

    </div> // End dashboard-page
  );
}

export default ReadingHabits;
