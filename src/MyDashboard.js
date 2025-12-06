// In file: src/MyDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; 
import * as api from './services/api'; 
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css';
import './MyDashboard.css'; // <--- NEW: Using modular styles

// --- Import Centralized Config ---
import { 
    leanColors, 
    sentimentColors, 
    qualityColors, 
    getChartTheme, 
    getDoughnutChartOptions, 
    getBarChartOptions, 
    getLineChartOptions 
} from './utils/ChartConfig';

import BiasMap from './components/BiasMap';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, TimeScale
);

// --- Helpers ---
const getActionCount = (totals, action) => {
  const item = totals.find(t => t.action === action);
  return item ? item.count : 0;
};
const leanOrder = ['Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];

function MyDashboard({ theme }) {
  const [statsData, setStatsData] = useState(null);
  const [digestData, setDigestData] = useState(null); 
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  const themeColors = useMemo(() => getChartTheme(theme), [theme]);

  useEffect(() => {
    const fetchData = async () => {
      setError('');
      setLoadingStats(true);
      try {
        const [statsRes, digestRes] = await Promise.all([
            api.getStats(),
            api.getWeeklyDigest()
        ]);
        setStatsData(statsRes.data);
        setDigestData(digestRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not load statistics data.');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchData();
  }, []);

  // --- Data Preparation Logic ---
  const prepareCategoryData = (rawData) => {
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10).reverse();
    return {
      labels: sortedData.map(d => d.category),
      datasets: [{
        label: 'Articles Read',
        data: sortedData.map(d => d.count),
        backgroundColor: sortedData.map((_, i) => themeColors.categoryPalette[i % themeColors.categoryPalette.length]),
        borderColor: themeColors.borderColor,
        borderWidth: 1,
      }],
    };
  };

  const prepareTopSourcesData = (rawData) => {
    const sortedData = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10).reverse();
    return {
      labels: sortedData.map(d => d.source),
      datasets: [{
        label: 'Articles Analyzed',
        data: sortedData.map(d => d.count),
        backgroundColor: sortedData.map((_, i) => themeColors.categoryPalette[i % themeColors.categoryPalette.length]),
        borderColor: themeColors.borderColor,
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
      datasets: [{ label: 'Articles', data: filteredData, backgroundColor: filteredColors, borderColor: themeColors.borderColor, borderWidth: 1 }]
    };
  };

  const prepareLeanData = (rawData) => {
    const counts = (rawData || []).reduce((acc, item) => { acc[item.lean] = item.count; return acc; }, {});
    const data = leanOrder.map(lean => counts[lean] || 0);
    const backgroundColors = leanOrder.map(lean => leanColors[lean]);
    const filteredLabels = leanOrder.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    return { labels: filteredLabels, datasets: [{ label: 'Articles', data: filteredData, backgroundColor: filteredColors, borderColor: themeColors.borderColor, borderWidth: 1 }] };
  };

  const storiesReadData = useMemo(() => {
    const labels = statsData?.dailyCounts?.map(item => item.date) || [];
    const data = statsData?.dailyCounts?.map(item => item.count) || [];
    
    const getSegmentBorderColor = (ctx) => {
      const y1 = ctx.p0.parsed.y;
      const y2 = ctx.p1.parsed.y;
      if (y2 > y1) return themeColors.trendUp;
      if (y2 < y1) return themeColors.trendDown;
      return themeColors.textTertiary; 
    };

    return {
      labels: labels,
      datasets: [{
        label: 'Stories Analyzed',
        data: data,
        fill: false,
        tension: 0.1,
        segment: { borderColor: getSegmentBorderColor },
        pointBackgroundColor: themeColors.accentPrimary,
        pointBorderColor: themeColors.accentPrimary, 
      }],
    };
  }, [statsData?.dailyCounts, themeColors]);

  const qualityReadData = useMemo(() => {
      const counts = (statsData?.qualityDistribution_read || []).reduce((acc, item) => { acc[item.grade] = item.count; return acc; }, {});
      const labels = Object.keys(qualityColors);
      const dataMap = {
          'A+ Excellent (90-100)': counts['A+'] || 0,
          'A High (80-89)': (counts['A'] || 0) + (counts['A-'] || 0),
          'B Professional (70-79)': (counts['B+'] || 0) + (counts['B'] || 0) + (counts['B-'] || 0),
          'C Acceptable (60-69)': (counts['C+'] || 0) + (counts['C'] || 0) + (counts['C-'] || 0),
          'D-F Poor (0-59)': (counts['D+'] || 0) + (counts['D'] || 0) + (counts['D-'] || 0) + (counts['F'] || 0) + (counts['D-F'] || 0),
          'N/A (Review/Opinion)': counts[null] || 0
      };
      const filteredLabels = labels.filter(label => dataMap[label] > 0);
      const filteredData = filteredLabels.map(label => dataMap[label]);
      const filteredColors = filteredLabels.map(label => qualityColors[label]);
      return { labels: filteredLabels, datasets: [{ label: 'Articles Read', data: filteredData, backgroundColor: filteredColors, borderColor: themeColors.borderColor, borderWidth: 1 }] };
  }, [statsData?.qualityDistribution_read, themeColors]);

  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const topSourcesData = prepareTopSourcesData(statsData?.topSources_read);
  const sentimentReadData = prepareSentimentData(statsData?.sentimentDistribution_read);
  
  // Calculate Totals & Percentages
  const totals = statsData?.totalCounts || [];
  const totalAnalyzed = getActionCount(totals, 'view_analysis');
  const totalShared = getActionCount(totals, 'share_article');
  const totalCompared = getActionCount(totals, 'view_comparison');
  const totalRead = getActionCount(totals, 'read_external');

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

  const statBoxes = [
    { key: 'analyzed', title: 'Articles Analyzed', value: totalAnalyzed, desc: 'Total analysis requests.' },
    { key: 'read', title: 'Articles Read', value: totalRead, desc: 'Click-throughs to sources.' },
    { key: 'shared', title: 'Shared', value: totalShared, desc: 'Articles shared.' },
    { key: 'compared', title: 'Comparisons', value: totalCompared, desc: "Coverage comparisons." }
  ];

  // --- Render Pulse ---
  const renderWeeklyPulse = () => {
    if (!digestData || digestData.status === 'Insufficient Data') return null;
    const isBubble = digestData.status.includes('Bubble');
    const rec = digestData.recommendation;

    return (
      <div className="dashboard-card" style={{ 
          borderLeft: isBubble ? '4px solid #E57373' : '4px solid #4CAF50',
          marginTop: '0' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: '5px' }}>
                    Weekly Pulse: <span style={{ color: isBubble ? '#E57373' : '#4CAF50' }}>{digestData.status}</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '5px 0' }}>
                    {isBubble 
                     ? `You've focused heavily on one perspective this week. Try diversifying.`
                     : `Great job! Your reading habits are well-distributed across the spectrum.`}
                </p>
            </div>
            {isBubble && rec && (
                <div style={{ 
                    background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', 
                    border: '1px solid var(--border-color)', width: '100%', maxWidth: '300px' 
                }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>
                        Recommended Palate Cleanser
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', lineHeight: '1.4' }}>
                        {rec.headline}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>{rec.politicalLean} Perspective</span>
                        <a href={`/?article=${rec._id}`} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none' }}>View</a>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-content-wrapper">
        
        {/* --- LEFT COLUMN: Stats & Bias --- */}
        <div className="dashboard-left-column">
            
            {/* Header */}
            <div className="section-title-header">
              <h2 className="section-title">Your Activity</h2>
              <div className="header-actions">
                <Link to="/" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}>Back to Feed</Link>
              </div>
            </div>

            {/* Stat Boxes */}
            <div className="dashboard-card" style={{ padding: '15px' }}>
              <div className="stat-box-grid">
                {statBoxes.map(box => (
                  <div key={box.key} className="stat-box">
                    <h3>{box.title}</h3>
                    <p className="stat-number">{loadingStats ? '...' : box.value}</p>
                    <p className="stat-desc">{box.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lean Summary */}
            <h2 className="section-title" style={{ marginTop: '20px', marginBottom: '15px' }}>Reading Bias</h2>
            <div className="dashboard-card">
                {loadingStats ? <div className="loading-container simple"><div className="spinner small"></div></div> : totalApplicableLeanArticles > 0 ? (
                  <>
                    <div className="lean-legend">
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Left'], width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginRight: '5px' }}></span> Left</div>
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Center'], width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginRight: '5px' }}></span> Center</div>
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Right'], width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginRight: '5px' }}></span> Right</div>
                    </div>

                    <div className="lean-bar-container">
                      { leftCombinedPerc > 0 && <div className="lean-segment left" style={{ width: `${leftCombinedPerc}%`, backgroundColor: leanColors['Left'] }}></div> }
                      { centerPerc > 0 && <div className="lean-segment center" style={{ width: `${centerPerc}%`, backgroundColor: leanColors['Center'] }}></div> }
                      { rightCombinedPerc > 0 && <div className="lean-segment right" style={{ width: `${rightCombinedPerc}%`, backgroundColor: leanColors['Right'] }}></div> }
                    </div>
                    <ul className="lean-details">
                      <li><span>{leftCombinedPerc}%</span> Left Leaning</li>
                      <li><span>{centerPerc}%</span> Center / Balanced</li>
                      <li><span>{rightCombinedPerc}%</span> Right Leaning</li>
                    </ul>
                  </>
                ) : ( <p className="no-data-msg small" style={{textAlign:'center', padding:'10px'}}>No analysis data yet.</p> )}
            </div>

            <div className="dashboard-left-footer">
               <Link to="/account-settings" className="btn-secondary" style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none' }}>Account Settings</Link>
            </div>
        </div>

        {/* --- RIGHT COLUMN: Charts --- */}
        <div className="dashboard-right-column">
          
          <div className="section-title-header">
              <h2 className="section-title">Reading Habits</h2>
              <span className="date-range-badge">All Time</span>
          </div>

          {renderWeeklyPulse()}

          <div className="dashboard-card full-width-card">
              <h3>Stories Read Over Time</h3>
              <div className="chart-container">
                 {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                  : (statsData?.dailyCounts?.length > 0) ? ( <Line options={getLineChartOptions(theme)} data={storiesReadData} /> )
                  : ( <p className="no-data-msg" style={{textAlign:'center', padding:'40px'}}>No data available.</p> )}
              </div>
          </div>

          <div className="dashboard-grid">
             {/* Bias Map */}
             <div className="dashboard-card full-width-card">
               <h3>Bias vs. Trust Map</h3>
               <div className="chart-container" style={{ minHeight: '300px' }}>
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (statsData?.allArticles?.length > 0) ? (
                      <BiasMap articles={statsData.allArticles} theme={theme} />
                   )
                   : ( <p className="no-data-msg" style={{textAlign:'center', padding:'40px'}}>Read more to populate map.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Top Categories</h3>
               <div className="chart-container">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && categoryReadData.labels.length > 0) ? ( <Bar options={getBarChartOptions('', 'Articles', theme)} data={categoryReadData} /> )
                   : ( <p className="no-data-msg" style={{textAlign:'center', padding:'40px'}}>No data.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Top Sources</h3>
               <div className="chart-container">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && topSourcesData.labels.length > 0) ? ( <Bar options={getBarChartOptions('', 'Articles', theme)} data={topSourcesData} /> )
                   : ( <p className="no-data-msg" style={{textAlign:'center', padding:'40px'}}>No data.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Sentiment</h3>
               <div className="chart-container">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && sentimentReadData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('', theme)} data={sentimentReadData} /> )
                   : ( <p className="no-data-msg" style={{textAlign:'center', padding:'40px'}}>No data.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Quality Grade</h3>
               <div className="chart-container">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && qualityReadData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('', theme)} data={qualityReadData} /> )
                   : ( <p className="no-data-msg" style={{textAlign:'center', padding:'40px'}}>No data.</p> )}
               </div>
             </div>
          </div>

          <div className="mobile-only-footer">
            <Link to="/account-settings" className="btn-secondary" style={{ width: '100%', display: 'block', textDecoration: 'none' }}>Account Settings</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MyDashboard;
