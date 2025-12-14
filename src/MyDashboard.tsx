// src/MyDashboard.tsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom'; 
import { useQuery } from '@tanstack/react-query'; 
import * as api from './services/api'; 
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useAuth } from './context/AuthContext'; 
import useIsMobile from './hooks/useIsMobile';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, TimeScale,
  ChartData
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css';
import './MyDashboard.css';

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
const getActionCount = (totals: any[], action: string) => {
  const item = (totals || []).find(t => t.action === action);
  return item ? item.count : 0;
};

interface MyDashboardProps {
  theme: string;
}

const MyDashboard: React.FC<MyDashboardProps> = ({ theme }) => {
  const { user } = useAuth(); 
  const isMobile = useIsMobile();
  const themeColors = useMemo(() => getChartTheme(theme), [theme]);
  
  // Mobile Tabs State
  const [activeTab, setActiveTab] = useState<'overview' | 'bias' | 'interests' | 'quality'>('overview');

  // --- QUERY 1: User Statistics ---
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ['dashboardStats', user?.uid],
    queryFn: async () => {
      const { data } = await api.getStats();
      return data;
    },
    enabled: !!user, 
  });

  // --- QUERY 2: Weekly Digest ---
  const { 
    data: digestData, 
    isLoading: digestLoading 
  } = useQuery({
    queryKey: ['dashboardDigest', user?.uid],
    queryFn: async () => {
      const { data } = await api.getWeeklyDigest();
      return data;
    },
    enabled: !!user,
  });

  // --- Data Preparation Logic ---
  const prepareCategoryData = (rawData: any[]): ChartData<'bar'> => {
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

  const prepareTopSourcesData = (rawData: any[]): ChartData<'bar'> => {
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

  const prepareSentimentData = (rawData: any[]): ChartData<'doughnut'> => {
    const counts = (rawData || []).reduce((acc: any, item: any) => { acc[item.sentiment] = item.count; return acc; }, {});
    const labels = ['Positive', 'Neutral', 'Negative'];
    const data = labels.map(label => counts[label] || 0);
    const backgroundColors = labels.map(label => sentimentColors[label]);
    
    const filteredIndices = data.map((val, i) => val > 0 ? i : -1).filter(i => i !== -1);
    
    return {
      labels: filteredIndices.map(i => labels[i]),
      datasets: [{ 
        label: 'Articles', 
        data: filteredIndices.map(i => data[i]), 
        backgroundColor: filteredIndices.map(i => backgroundColors[i]), 
        borderColor: themeColors.borderColor, 
        borderWidth: 1 
      }]
    };
  };

  if (statsLoading || digestLoading) return <DashboardSkeleton />;

  if (statsError) {
      return (
        <div className="dashboard-page">
            <div className="no-data-msg">
                <p>Could not load dashboard data. Please try refreshing.</p>
            </div>
        </div>
      );
  }

  // --- Data Calculations ---
  const storiesReadData: ChartData<'line'> = {
    labels: statsData?.dailyCounts?.map((item: any) => item.date) || [],
    datasets: [{
      label: 'Stories Analyzed',
      data: statsData?.dailyCounts?.map((item: any) => item.count) || [],
      fill: false,
      tension: 0.1,
      // @ts-ignore
      segment: { 
          borderColor: (ctx: any) => {
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

  const qualityCounts = (statsData?.qualityDistribution_read || []).reduce((acc: any, item: any) => { acc[item.grade] = item.count; return acc; }, {});
  const qualityLabels = Object.keys(qualityColors);
  const qualityDataMap: Record<string, number> = {
      'A+ Excellent (90-100)': qualityCounts['A+'] || 0,
      'A High (80-89)': (qualityCounts['A'] || 0) + (qualityCounts['A-'] || 0),
      'B Professional (70-79)': (qualityCounts['B+'] || 0) + (qualityCounts['B'] || 0) + (qualityCounts['B-'] || 0),
      'C Acceptable (60-69)': (qualityCounts['C+'] || 0) + (qualityCounts['C'] || 0) + (qualityCounts['C-'] || 0),
      'D-F Poor (0-59)': (qualityCounts['D+'] || 0) + (qualityCounts['D'] || 0) + (qualityCounts['D-'] || 0) + (qualityCounts['F'] || 0) + (qualityCounts['D-F'] || 0),
      'N/A (Review/Opinion)': qualityCounts['null'] || 0 
  };
  const filteredQLabels = qualityLabels.filter(label => qualityDataMap[label] > 0);
  const qualityReadData: ChartData<'doughnut'> = { 
      labels: filteredQLabels, 
      datasets: [{ 
        label: 'Articles Read', 
        data: filteredQLabels.map(l => qualityDataMap[l]), 
        backgroundColor: filteredQLabels.map(l => qualityColors[l]), 
        borderColor: themeColors.borderColor, 
        borderWidth: 1 
      }] 
  };

  const categoryReadData = prepareCategoryData(statsData?.categoryDistribution_read);
  const topSourcesData = prepareTopSourcesData(statsData?.topSources_read);
  const sentimentReadData = prepareSentimentData(statsData?.sentimentDistribution_read);
  
  const totals = statsData?.totalCounts || [];
  const totalAnalyzed = getActionCount(totals, 'view_analysis');
  const totalShared = getActionCount(totals, 'share_article');
  const totalCompared = getActionCount(totals, 'view_comparison');
  const totalRead = getActionCount(totals, 'read_external');

  const leanReadCounts = (statsData?.leanDistribution_read || []).reduce((acc: any, item: any) => { acc[item.lean] = item.count; return acc; }, {});
  const totalApplicableLeanArticles = (leanReadCounts['Left'] || 0) + (leanReadCounts['Left-Leaning'] || 0) + (leanReadCounts['Center'] || 0) + (leanReadCounts['Right-Leaning'] || 0) + (leanReadCounts['Right'] || 0);

  const calculateBarPercentage = (leanTypes: string[]) => {
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

  // --- MOBILE TAB RENDERER ---
  const renderMobileTabs = () => (
    <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'bias' ? 'active' : ''} onClick={() => setActiveTab('bias')}>Bias Map</button>
        <button className={activeTab === 'interests' ? 'active' : ''} onClick={() => setActiveTab('interests')}>Interests</button>
        <button className={activeTab === 'quality' ? 'active' : ''} onClick={() => setActiveTab('quality')}>Quality</button>
    </div>
  );

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

          {/* MOBILE: Tabs | DESKTOP: Grid */}
          {isMobile ? (
              <>
                {renderMobileTabs()}
                <div className="dashboard-mobile-content">
                    {activeTab === 'overview' && (
                        <div className="dashboard-card full-width-card">
                            <h3>Stories Read Over Time</h3>
                            <div className="chart-container">
                                {(statsData?.dailyCounts?.length || 0) > 0 ? ( 
                                    <Line options={getLineChartOptions(theme)} data={storiesReadData} /> 
                                ) : ( <p className="no-data-msg">No data available.</p> )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'bias' && (
                        <div className="dashboard-card full-width-card">
                            <h3>Bias vs. Trust Map</h3>
                            <div className="chart-container-large">
                                {(statsData?.allArticles?.length || 0) > 0 ? (
                                    <BiasMap articles={statsData.allArticles} theme={theme} />
                                ) : ( <p className="no-data-msg">Read more to populate map.</p> )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'interests' && (
                        <>
                            <div className="dashboard-card">
                                <h3>Top Categories</h3>
                                <div className="chart-container">
                                    {totalAnalyzed > 0 && (categoryReadData.labels?.length || 0) > 0 ? ( 
                                        <Bar options={getBarChartOptions('', 'Articles', theme)} data={categoryReadData} /> 
                                    ) : ( <p className="no-data-msg">No data.</p> )}
                                </div>
                            </div>
                            <div className="dashboard-card">
                                <h3>Top Sources</h3>
                                <div className="chart-container">
                                    {totalAnalyzed > 0 && (topSourcesData.labels?.length || 0) > 0 ? ( 
                                        <Bar options={getBarChartOptions('', 'Articles', theme)} data={topSourcesData} /> 
                                    ) : ( <p className="no-data-msg">No data.</p> )}
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === 'quality' && (
                        <>
                            <div className="dashboard-card">
                                <h3>Sentiment</h3>
                                <div className="chart-container">
                                    {totalAnalyzed > 0 && (sentimentReadData.labels?.length || 0) > 0 ? ( 
                                        <Doughnut options={getDoughnutChartOptions('', theme)} data={sentimentReadData} /> 
                                    ) : ( <p className="no-data-msg">No data.</p> )}
                                </div>
                            </div>
                            <div className="dashboard-card">
                                <h3>Quality Grade</h3>
                                <div className="chart-container">
                                    {totalAnalyzed > 0 && (qualityReadData.labels?.length || 0) > 0 ? ( 
                                        <Doughnut options={getDoughnutChartOptions('', theme)} data={qualityReadData} /> 
                                    ) : ( <p className="no-data-msg">No data.</p> )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
              </>
          ) : (
              /* DESKTOP GRID LAYOUT (Unchanged) */
              <>
                <div className="dashboard-card full-width-card">
                    <h3>Stories Read Over Time</h3>
                    <div className="chart-container">
                        {(statsData?.dailyCounts?.length || 0) > 0 ? ( 
                            <Line options={getLineChartOptions(theme)} data={storiesReadData} /> 
                        ) : ( <p className="no-data-msg">No data available.</p> )}
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card full-width-card">
                        <h3>Bias vs. Trust Map</h3>
                        <div className="chart-container-large">
                            {(statsData?.allArticles?.length || 0) > 0 ? (
                                <BiasMap articles={statsData.allArticles} theme={theme} />
                            ) : ( <p className="no-data-msg">Read more to populate map.</p> )}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Top Categories</h3>
                        <div className="chart-container">
                            {totalAnalyzed > 0 && (categoryReadData.labels?.length || 0) > 0 ? ( 
                                <Bar options={getBarChartOptions('', 'Articles', theme)} data={categoryReadData} /> 
                            ) : ( <p className="no-data-msg">No data.</p> )}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Top Sources</h3>
                        <div className="chart-container">
                            {totalAnalyzed > 0 && (topSourcesData.labels?.length || 0) > 0 ? ( 
                                <Bar options={getBarChartOptions('', 'Articles', theme)} data={topSourcesData} /> 
                            ) : ( <p className="no-data-msg">No data.</p> )}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Sentiment</h3>
                        <div className="chart-container">
                            {totalAnalyzed > 0 && (sentimentReadData.labels?.length || 0) > 0 ? ( 
                                <Doughnut options={getDoughnutChartOptions('', theme)} data={sentimentReadData} /> 
                            ) : ( <p className="no-data-msg">No data.</p> )}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Quality Grade</h3>
                        <div className="chart-container">
                            {totalAnalyzed > 0 && (qualityReadData.labels?.length || 0) > 0 ? ( 
                                <Doughnut options={getDoughnutChartOptions('', theme)} data={qualityReadData} /> 
                            ) : ( <p className="no-data-msg">No data.</p> )}
                        </div>
                    </div>
                </div>
              </>
          )}

          <div className="mobile-only-footer">
            <Link to="/account-settings" className="btn-secondary btn-full">Account Settings</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MyDashboard;
