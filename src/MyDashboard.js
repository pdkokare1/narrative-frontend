// In file: src/MyDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; 
import * as api from './services/api'; 
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useAuth } from './context/AuthContext'; 
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css';
import './MyDashboard.css';

// --- NEW: Import Skeleton ---
import DashboardSkeleton from './components/ui/DashboardSkeleton';

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

// Cache duration: 15 Minutes
const CACHE_DURATION = 15 * 60 * 1000; 

function MyDashboard({ theme }) {
  const { user } = useAuth(); 
  const [statsData, setStatsData] = useState(null);
  const [digestData, setDigestData] = useState(null); 
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  const themeColors = useMemo(() => getChartTheme(theme), [theme]);

  useEffect(() => {
    const fetchData = async () => {
      setError('');
      setLoadingStats(true);
      
      const userId = user?.uid || 'guest';
      const CACHE_KEY_STATS = `dashboard_stats_${userId}`;
      const CACHE_KEY_DIGEST = `dashboard_digest_${userId}`;

      // 1. Try to load from Cache first
      try {
          const cachedStatsRaw = localStorage.getItem(CACHE_KEY_STATS);
          const cachedDigestRaw = localStorage.getItem(CACHE_KEY_DIGEST);

          if (cachedStatsRaw && cachedDigestRaw) {
              const cachedStats = JSON.parse(cachedStatsRaw);
              const cachedDigest = JSON.parse(cachedDigestRaw);
              const now = Date.now();

              if (now - cachedStats.timestamp < CACHE_DURATION) {
                  console.log("⚡ Dashboard loaded from Cache");
                  setStatsData(cachedStats.data);
                  setDigestData(cachedDigest.data);
                  setLoadingStats(false);
                  return; 
              }
          }
      } catch (e) {
          console.warn("Cache parsing error", e);
      }

      // 2. Cache Miss - Fetch from API
      try {
        const [statsRes, digestRes] = await Promise.all([
            api.getStats(),
            api.getWeeklyDigest()
        ]);
        
        setStatsData(statsRes.data);
        setDigestData(digestRes.data);

        // 3. Save to Cache
        localStorage.setItem(CACHE_KEY_STATS, JSON.stringify({
            data: statsRes.data,
            timestamp: Date.now()
        }));
        localStorage.setItem(CACHE_KEY_DIGEST, JSON.stringify({
            data: digestRes.data,
            timestamp: Date.now()
        }));

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not load statistics data.');
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) fetchData();
  }, [user]);

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

  // --- Early Return: Show Skeleton while loading ---
  if (loadingStats) {
      return <DashboardSkeleton />;
  }

  // --- Normal Render (Data is Ready) ---
  const storiesReadData = {
    labels: statsData?.dailyCounts?.map(item => item.date) || [],
    datasets: [{
      label: 'Stories Analyzed',
      data: statsData?.dailyCounts?.map(item => item.count) || [],
      fill: false,
      tension: 0.1,
      segment: { 
          borderColor: ctx => {
              const y1 = ctx.p0.parsed.y;
              const y2 = ctx.p1.parsed.y;
              if (y2 > y1) return themeColors.trendUp;
              if (y2 < y1) return themeColors.trendDown;
              return themeColors.textTertiary; 
          }
      },
      pointBackgroundColor: themeColors.accentPrimary,
      pointBorderColor: themeColors.accentPrimary, 
    }],
  };

  const qualityCounts = (statsData?.qualityDistribution_read || []).reduce((acc, item) => { acc[item.grade] = item.count; return acc; }, {});
  const qualityLabels = Object.keys(qualityColors);
  const qualityDataMap = {
      'A+ Excellent (90-100)': qualityCounts['A+'] || 0,
      'A High (80-89)': (qualityCounts['A'] || 0) + (qualityCounts['A-'] || 0),
      'B Professional (70-79)': (qualityCounts['B+'] || 0) + (qualityCounts['B'] || 0) + (qualityCounts['B-'] || 0),
      'C Acceptable (60-69)': (qualityCounts['C+'] || 0) + (qualityCounts['C'] || 0) + (qualityCounts['C-'] || 0),
      'D-F Poor (0-59)': (qualityCounts['D+'] || 0) + (qualityCounts['D'] || 0) + (qualityCounts['D-'] || 0) + (qualityCounts['F'] || 0) + (qualityCounts['D-F'] || 0),
      'N/A (Review/Opinion)': qualityCounts[null] || 0
  };
  const filteredQLabels = qualityLabels.filter(label => qualityDataMap[label] > 0);
  const qualityReadData = { 
      labels: filteredQLabels, 
      datasets: [{ label: 'Articles Read', data: filteredQLabels.map(l => qualityDataMap[l]), backgroundColor: filteredQLabels.map(l => qualityColors[l]), borderColor: themeColors.borderColor, borderWidth: 1 }] 
  };

  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const topSourcesData = prepareTopSourcesData(statsData?.topSources_read);
  const sentimentReadData = prepareSentimentData(statsData?.sentimentDistribution_read);
  
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
      <div className={`dashboard-card pulse-card ${isBubble ? 'bubble' : 'balanced'}`}>
        <div className="pulse-layout">
            <div className="pulse-text-col">
                <h3 className="pulse-title">
                    Weekly Pulse: <span className={`pulse-status ${isBubble ? 'bubble' : 'balanced'}`}>{digestData.status}</span>
                </h3>
                <p className="pulse-desc">
                    {isBubble 
                     ? `You've focused heavily on one perspective this week. Try diversifying.`
                     : `Great job! Your reading habits are well-distributed across the spectrum.`}
                </p>
            </div>
            {isBubble && rec && (
                <div className="pulse-rec-box">
                    <div className="pulse-rec-label">Recommended Palate Cleanser</div>
                    <div className="pulse-rec-headline">{rec.headline}</div>
                    <div className="pulse-rec-footer">
                        <span className="pulse-rec-lean">{rec.politicalLean} Perspective</span>
                        <a href={`/?article=${rec._id}`} className="btn-secondary btn-mini">View</a>
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
        
        {/* --- LEFT COLUMN --- */}
        <div className="dashboard-left-column">
            
            <div className="section-title-header">
              <h2 className="section-title">Your Activity</h2>
              <div className="header-actions">
                <Link to="/" className="btn-secondary btn-mini">Back to Feed</Link>
              </div>
            </div>

            <div className="dashboard-card card-tight">
              <div className="stat-box-grid">
                {statBoxes.map(box => (
                  <div key={box.key} className="stat-box">
                    <h3>{box.title}</h3>
                    <p className="stat-number">{box.value}</p>
                    <p className="stat-desc">{box.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="section-title section-margin-top">Reading Bias</h2>
            <div className="dashboard-card">
                {totalApplicableLeanArticles > 0 ? (
                  <>
                    <div className="lean-legend">
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Left'] }}></span> Left</div>
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Center'] }}></span> Center</div>
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Right'] }}></span> Right</div>
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
                ) : ( <p className="no-data-msg small">No analysis data yet.</p> )}
            </div>

            <div className="dashboard-left-footer">
               <Link to="/account-settings" className="btn-secondary btn-full">Account Settings</Link>
            </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="dashboard-right-column">
          
          <div className="section-title-header">
              <h2 className="section-title">Reading Habits</h2>
              <span className="date-range-badge">All Time</span>
          </div>

          {renderWeeklyPulse()}

          <div className="dashboard-card full-width-card">
              <h3>Stories Read Over Time</h3>
              <div className="chart-container">
                 {statsData?.dailyCounts?.length > 0 ? ( 
                    <Line options={getLineChartOptions(theme)} data={storiesReadData} /> 
                 ) : ( <p className="no-data-msg">No data available.</p> )}
              </div>
          </div>

          <div className="dashboard-grid">
             {/* Bias Map */}
             <div className="dashboard-card full-width-card">
               <h3>Bias vs. Trust Map</h3>
               <div className="chart-container-large">
                   {statsData?.allArticles?.length > 0 ? (
                      <BiasMap articles={statsData.allArticles} theme={theme} />
                   ) : ( <p className="no-data-msg">Read more to populate map.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Top Categories</h3>
               <div className="chart-container">
                   {totalAnalyzed > 0 && categoryReadData.labels.length > 0 ? ( 
                      <Bar options={getBarChartOptions('', 'Articles', theme)} data={categoryReadData} /> 
                   ) : ( <p className="no-data-msg">No data.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Top Sources</h3>
               <div className="chart-container">
                   {totalAnalyzed > 0 && topSourcesData.labels.length > 0 ? ( 
                      <Bar options={getBarChartOptions('', 'Articles', theme)} data={topSourcesData} /> 
                   ) : ( <p className="no-data-msg">No data.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Sentiment</h3>
               <div className="chart-container">
                   {totalAnalyzed > 0 && sentimentReadData.labels.length > 0 ? ( 
                      <Doughnut options={getDoughnutChartOptions('', theme)} data={sentimentReadData} /> 
                   ) : ( <p className="no-data-msg">No data.</p> )}
               </div>
             </div>

             <div className="dashboard-card">
               <h3>Quality Grade</h3>
               <div className="chart-container">
                   {totalAnalyzed > 0 && qualityReadData.labels.length > 0 ? ( 
                      <Doughnut options={getDoughnutChartOptions('', theme)} data={qualityReadData} /> 
                   ) : ( <p className="no-data-msg">No data.</p> )}
               </div>
             </div>
          </div>

          <div className="mobile-only-footer">
            <Link to="/account-settings" className="btn-secondary btn-full">Account Settings</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default MyDashboard;
