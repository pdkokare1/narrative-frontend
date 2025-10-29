// In file: src/ReadingHabits.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js';
import './DashboardPages.css'; // Use the new CSS file

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend
);

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// --- Chart Colors & Order Definitions ---
const leanOrder = ['Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];
const leanColors = {
    'Left': '#dc2626', 'Left-Leaning': '#f87171', 'Center': '#6b7280',
    'Right-Leaning': '#60a5fa', 'Right': '#2563eb', 'Not Applicable': '#a1a1aa'
};
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
// This component is primarily for mobile, but based on feature parity,
// it could be linked from desktop too. It just shows all the charts.
function ReadingHabits({ theme }) {
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  // Define chart colors based on theme
  const chartColors = useMemo(() => {
    const isDark = theme === 'dark';
    return {
       textPrimary: isDark ? '#EAEAEA' : '#2C2C2C',
       textSecondary: isDark ? '#B0B0B0' : '#555555',
       textTertiary: isDark ? '#757575' : '#888888',
       borderColor: isDark ? '#333333' : '#EAEAEA',
       tooltipBg: isDark ? '#2C2C2C' : '#FDFDFD',
       categoryPalette: isDark ? categoryColorsDark : categoryColorsLight,
       sourcePalette: isDark ? sourceColorsDark : sourceColorsLight,
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
   

  // --- Chart Data Preparation Functions (Copied from MyDashboard) ---

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
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count);
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
  
  const prepareQualityData = (rawData) => {
    const rawCountsMap = (rawData || []).reduce((acc, item) => { acc[item.grade] = item.count; return acc; }, {});
    const dbCounts = rawCountsMap;
    const data = [ 
      dbCounts['A+'] || 0, 
      (dbCounts['A'] || 0) + (dbCounts['A-'] || 0), 
      (dbCounts['B+'] || 0) + (dbCounts['B'] || 0) + (dbCounts['B-'] || 0), 
      (dbCounts['C+'] || 0) + (dbCounts['C'] || 0) + (dbCounts['C-'] || 0), 
      (dbCounts['D+'] || 0) + (dbCounts['D'] || 0) + (dbCounts['D-'] || 0) + (dbCounts['F'] || 0) + (dbCounts['D-F'] || 0), 
      dbCounts[null] || 0 
    ];
    const backgroundColors = qualityLabels.map(label => qualityColors[label] || '#a1a1aa');
    const filteredLabels = qualityLabels.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    return { labels: filteredLabels, datasets: [{ label: 'Articles Analyzed', data: filteredData, backgroundColor: filteredColors, borderColor: chartColors.borderColor, borderWidth: 1 }] };
  };

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
  
  // Helper to render a chart box
  const renderChartBox = (title, data, chartType, options) => {
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
      }
    } else {
      chartContent = <p className="no-data-msg">No data available for this chart yet.</p>;
    }
    
    return (
      <div className="dashboard-card">
        <div className='chart-container article-bias-chart'>
          {chartContent}
        </div>
      </div>
    );
  };
  
  // This is the main component render
  return (
    <div className="dashboard-page mobile-only-page">
      <div className="dashboard-content-wrapper">
        {/* --- This page uses a single-column layout --- */}
        <div className="dashboard-left-column">
           <div className="section-title-header">
             <h2 className="section-title no-border">Reading Habits</h2>
             <div className="header-actions"> 
                 <Link to="/my-dashboard" className="btn-secondary btn-small" style={{ textDecoration: 'none' }}>
                   &lt; Back to Dashboard
                 </Link>
             </div>
           </div>
           
            <div className="mobile-charts-column full-details-page">
                
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
                
              {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}
            </div>

        </div> {/* --- End Left Column --- */}
      </div> {/* --- End Content Wrapper --- */}
    </div> // End dashboard-page
  );
}

export default ReadingHabits;
