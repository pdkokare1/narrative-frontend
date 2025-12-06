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
import './DashboardPages.css';

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

  // Get current theme colors
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

  // --- Data Preparation ---
  const prepareLeanData = (rawData) => {
    const counts = (rawData || []).reduce((acc, item) => { acc[item.lean] = item.count; return acc; }, {});
    const data = leanOrder.map(lean => counts[lean] || 0);
    const backgroundColors = leanOrder.map(lean => leanColors[lean]);
    const filteredLabels = leanOrder.filter((_, index) => data[index] > 0);
    const filteredData = data.filter(count => count > 0);
    const filteredColors = backgroundColors.filter((_, index) => data[index] > 0);
    return { labels: filteredLabels, datasets: [{ label: 'Articles', data: filteredData, backgroundColor: filteredColors, borderColor: themeColors.borderColor, borderWidth: 1 }] };
  };

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
      
      // Map DB grades to Chart Labels
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

  // --- Stats Calculations ---
  const leanReadData = prepareLeanData(statsData?.leanDistribution_read);
  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const topSourcesData = prepareTopSourcesData(statsData?.topSources_read);
  const sentimentReadData = prepareSentimentData(statsData?.sentimentDistribution_read);
  const leanSharedData = prepareLeanData(statsData?.leanDistribution_shared);

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
    { key: 'analyzed', title: 'Articles Analyzed', value: totalAnalyzed, desc: 'No. of articles you have analyzed.' },
    { key: 'read', title: 'Articles Read', value: totalRead, desc: 'No. of articles you have read.' },
    { key: 'shared', title: 'Articles Shared', value: totalShared, desc: 'No. of articles shared with others.' },
    { key: 'compared', title: 'Comparisons Viewed', value: totalCompared, desc: "No. of articles you've compared." }
  ];

  // --- Weekly Pulse Render ---
  const renderWeeklyPulse = () => {
    if (!digestData || digestData.status === 'Insufficient Data') return null;

    const isBubble = digestData.status.includes('Bubble');
    const rec = digestData.recommendation;

    return (
      <div className="dashboard-card" style={{ 
          borderLeft: isBubble ? '4px solid #E57373' : '4px solid #4CAF50',
          background: 'var(--bg-card-flat)',
          marginTop: '0' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', borderBottom: 'none', paddingBottom: '5px' }}>
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
                        <a href={`/?article=${rec._id}`} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none' }}>
                            View
                        </a>
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
        <div className="dashboard-left-column">
          <div className="dashboard-left-scroll">
            <div className="section-title-header">
              <h2 className="section-title">Your Activity</h2>
              <div className="header-actions">
                <Link to="/" className="btn-secondary btn-small" style={{ textDecoration: 'none' }}>Back to Articles</Link>
              </div>
            </div>

            <div className="dashboard-header-mobile">
              <h2 className="section-title-mobile">Your Activity</h2>
              <div className="header-actions-mobile">
                <Link to="/" className="btn-secondary btn-small" style={{ textDecoration: 'none' }}>Back to Articles</Link>
                <div className="date-range-selector"><span>Viewing All-Time Stats</span></div>
              </div>
            </div>

            <div className="dashboard-card no-padding"> 
              <div className="stat-box-grid">
                {statBoxes.map(box => (
                  <div key={box.key} className="stat-box"> 
                    <h3>{box.title}</h3>
                    <p className="stat-number">{loadingStats ? '...' : box.value}</p>
                    <p className="stat-description">{box.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="section-title reading-bias-title">Reading Bias</h2>
            <div className="dashboard-card lean-summary-card"> 
                {loadingStats ? <div className="loading-container simple"><div className="spinner small"></div></div> : totalApplicableLeanArticles > 0 ? ( 
                  <>
                    <div className="lean-legend">
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Left'] }}></span> Left</div>
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Center'] }}></span> Center</div>
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Right'] }}></span> Right</div>
                    </div>

                    <div className="lean-bar">
                      { leftCombinedPerc > 0 && <div className="lean-segment left" style={{ width: `${leftCombinedPerc}%` }}>{leftCombinedPerc >= 10 ? `L ${leftCombinedPerc}%` : ''}</div> }
                      { centerPerc > 0 && <div className="lean-segment center" style={{ width: `${centerPerc}%` }}>{centerPerc >= 10 ? `C ${centerPerc}%` : ''}</div> }
                      { rightCombinedPerc > 0 && <div className="lean-segment right" style={{ width: `${rightCombinedPerc}%` }}>{rightCombinedPerc >= 10 ? `R ${rightCombinedPerc}%` : ''}</div> }
                    </div>
                    <ul className="lean-details">
                      {leftCombinedPerc > 0 && (<li><span>{leftCombinedPerc}%</span> analyzed lean left.</li>)}
                      {centerPerc > 0 && (<li><span>{centerPerc}%</span> analyzed were balanced.</li>)}
                      {rightCombinedPerc > 0 && (<li><span>{rightCombinedPerc}%</span> analyzed lean right.</li>)}
                    </ul>
                  </>
                ) : ( <p className="no-data-msg small">No applicable analysis data available yet.</p> )}
              </div>
          </div> 

          <div className="dashboard-left-footer">
            <Link to="/account-settings" className="account-settings-link-dashboard">Account Settings</Link>
          </div>
        </div>

        <div className="dashboard-right-column">
          <div className="sticky-header-wrapper">
            <div className="section-title-header">
                <h2 className="section-title">Your Reading Habits</h2>
                <div className="date-range-selector"><span>Viewing All-Time Stats</span></div>
            </div>
          </div>
          
          <div className="dashboard-header-mobile">
            <h2 className="section-title-mobile">Your Reading Habits</h2>
          </div>

          {renderWeeklyPulse()}

          <div className="dashboard-card full-width-chart-card stories-read-card"> 
              <div className="chart-container stories-read-chart">
                 {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                  : (statsData?.dailyCounts?.length > 0) ? ( <Line options={getLineChartOptions(theme)} data={storiesReadData} /> )
                  : ( <p className="no-data-msg">No analysis data for this period.</p> )}
              </div>
          </div>

          <div className="dashboard-grid">
             <div className="dashboard-card">
               <h3>Top Categories (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && categoryReadData.labels.length > 0) ? ( <Bar options={getBarChartOptions('', 'Articles Analyzed', theme)} data={categoryReadData} /> ) 
                   : ( <p className="no-data-msg">No category data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Top Sources (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && topSourcesData.labels.length > 0) ? ( <Bar options={getBarChartOptions('', 'Articles Analyzed', theme)} data={topSourcesData} /> ) 
                   : ( <p className="no-data-msg">No source data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Political Lean (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalApplicableLeanArticles > 0) ? ( <Doughnut options={getDoughnutChartOptions('', theme)} data={leanReadData} /> ) 
                   : ( <p className="no-data-msg">No lean data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Sentiment Breakdown (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && sentimentReadData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('', theme)} data={sentimentReadData} /> ) 
                   : ( <p className="no-data-msg">No sentiment data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Article Quality (Analyzed)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalAnalyzed > 0 && qualityReadData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('', theme)} data={qualityReadData} /> ) 
                   : ( <p className="no-data-msg">No quality data for this period.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Political Lean (Shared)</h3>
               <div className="chart-container article-bias-chart">
                   {loadingStats ? ( <div className="loading-container"><div className="spinner"></div></div> )
                   : (totalShared > 0 && leanSharedData.labels.length > 0) ? ( <Doughnut options={getDoughnutChartOptions('', theme)} data={leanSharedData} /> ) 
                   : ( <p className="no-data-msg">You haven't shared articles yet.</p> )}
               </div>
             </div>
          </div> 

          {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}
          
          <div className="mobile-only-footer">
            <Link to="/account-settings" className="account-settings-link-dashboard">Account Settings</Link>
          </div>
        </div> 
      </div> 
    </div> 
  );
}

export default MyDashboard;
