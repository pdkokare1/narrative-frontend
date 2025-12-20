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
// --- NEW COMPONENTS ---
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import SectionHeader from './components/ui/SectionHeader';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'bias' | 'interests' | 'quality'>('overview');

  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboardStats', user?.uid],
    queryFn: async () => { const { data } = await api.getStats(); return data; },
    enabled: !!user, 
  });

  const { data: digestData, isLoading: digestLoading } = useQuery({
    queryKey: ['dashboardDigest', user?.uid],
    queryFn: async () => { const { data } = await api.getWeeklyDigest(); return data; },
    enabled: !!user,
  });

  if (statsLoading || digestLoading) return <DashboardSkeleton />;

  if (statsError) {
      return (
        <div className="dashboard-page">
            <div className="no-data-msg"><p>Could not load dashboard data.</p></div>
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
      segment: { borderColor: (ctx: any) => ctx.p1.parsed.y > ctx.p0.parsed.y ? themeColors.trendUp : themeColors.trendDown },
      pointBackgroundColor: themeColors.accentPrimary,
      pointBorderColor: themeColors.accentPrimary, 
    }],
  };

  const qualityCounts = (statsData?.qualityDistribution_read || []).reduce((acc: any, item: any) => { acc[item.grade] = item.count; return acc; }, {});
  const qualityDataMap: Record<string, number> = {
      'A+ Excellent (90-100)': qualityCounts['A+'] || 0,
      'A High (80-89)': (qualityCounts['A'] || 0) + (qualityCounts['A-'] || 0),
      'B Professional (70-79)': (qualityCounts['B+'] || 0) + (qualityCounts['B'] || 0) + (qualityCounts['B-'] || 0),
      'C Acceptable (60-69)': (qualityCounts['C+'] || 0) + (qualityCounts['C'] || 0) + (qualityCounts['C-'] || 0),
      'D-F Poor (0-59)': (qualityCounts['D+'] || 0) + (qualityCounts['D'] || 0) + (qualityCounts['D-'] || 0) + (qualityCounts['F'] || 0) + (qualityCounts['D-F'] || 0),
      'N/A (Review/Opinion)': qualityCounts['null'] || 0 
  };
  const filteredQLabels = Object.keys(qualityColors).filter(label => qualityDataMap[label] > 0);
  const qualityReadData: ChartData<'doughnut'> = { 
      labels: filteredQLabels, 
      datasets: [{ label: 'Articles Read', data: filteredQLabels.map(l => qualityDataMap[l]), backgroundColor: filteredQLabels.map(l => qualityColors[l]), borderColor: themeColors.borderColor, borderWidth: 1 }] 
  };

  // Helper for Categories
  const prepareData = (rawData: any[], label: string) => {
      const sorted = (rawData || []).sort((a, b) => b.count - a.count).slice(0, 10).reverse();
      return {
          labels: sorted.map(d => label === 'Source' ? d.source : d.category),
          datasets: [{ label: 'Count', data: sorted.map(d => d.count), backgroundColor: sorted.map((_, i) => themeColors.categoryPalette[i % themeColors.categoryPalette.length]), borderColor: themeColors.borderColor, borderWidth: 1 }]
      };
  };

  const categoryReadData = prepareData(statsData?.categoryDistribution_read, 'Category');
  const topSourcesData = prepareData(statsData?.topSources_read, 'Source');
  
  // Sentiment
  const sCounts = (statsData?.sentimentDistribution_read || []).reduce((acc: any, item: any) => { acc[item.sentiment] = item.count; return acc; }, {});
  const sLabels = ['Positive', 'Neutral', 'Negative'];
  const sData = sLabels.map(l => sCounts[l] || 0);
  const sIndices = sData.map((val, i) => val > 0 ? i : -1).filter(i => i !== -1);
  const sentimentReadData = {
      labels: sIndices.map(i => sLabels[i]),
      datasets: [{ label: 'Articles', data: sIndices.map(i => sData[i]), backgroundColor: sIndices.map(i => sentimentColors[sLabels[i]]), borderColor: themeColors.borderColor, borderWidth: 1 }]
  };

  const totals = statsData?.totalCounts || [];
  const statBoxes = [
    { key: 'analyzed', title: 'Analyzed', value: getActionCount(totals, 'view_analysis'), desc: 'Total requests.' },
    { key: 'read', title: 'Read', value: getActionCount(totals, 'read_external'), desc: 'Full articles.' },
    { key: 'shared', title: 'Shared', value: getActionCount(totals, 'share_article'), desc: 'Spread awareness.' },
    { key: 'compared', title: 'Compared', value: getActionCount(totals, 'view_comparison'), desc: "Cross-checks." }
  ];

  const leanCounts = (statsData?.leanDistribution_read || []).reduce((acc: any, item: any) => { acc[item.lean] = item.count; return acc; }, {});
  const totalLean = (leanCounts['Left'] || 0) + (leanCounts['Left-Leaning'] || 0) + (leanCounts['Center'] || 0) + (leanCounts['Right-Leaning'] || 0) + (leanCounts['Right'] || 0);
  const calcPerc = (keys: string[]) => totalLean === 0 ? 0 : Math.round((keys.reduce((s, k) => s + (leanCounts[k] || 0), 0) / totalLean) * 100);
  const leftPerc = calcPerc(['Left', 'Left-Leaning']);
  const centerPerc = calcPerc(['Center']);
  const rightPerc = calcPerc(['Right-Leaning', 'Right']);

  return (
    <div className="dashboard-page">
      <div className="dashboard-content-wrapper">
        
        {/* --- LEFT COLUMN --- */}
        <div className="dashboard-left-column">
            
            <SectionHeader 
                title="Your Activity" 
                align="between"
                action={<Link to="/" style={{textDecoration:'none'}}><Button variant="secondary" className="btn-mini">Feed</Button></Link>}
            />

            <Card padding="sm" className="margin-bottom-20">
              <div className="stat-box-grid">
                {statBoxes.map(box => (
                  <div key={box.key} className="stat-box">
                    <h3>{box.title}</h3>
                    <p className="stat-number">{box.value}</p>
                    <p className="stat-desc">{box.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            <SectionHeader title="Bias Profile" />
            <Card>
                {totalLean > 0 ? (
                  <>
                    <div className="lean-legend">
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Left'] }}></span> Left</div>
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Center'] }}></span> Center</div>
                      <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: leanColors['Right'] }}></span> Right</div>
                    </div>
                    <div className="lean-bar-container">
                      { leftPerc > 0 && <div className="lean-segment left" style={{ width: `${leftPerc}%`, backgroundColor: leanColors['Left'] }}></div> }
                      { centerPerc > 0 && <div className="lean-segment center" style={{ width: `${centerPerc}%`, backgroundColor: leanColors['Center'] }}></div> }
                      { rightPerc > 0 && <div className="lean-segment right" style={{ width: `${rightPerc}%`, backgroundColor: leanColors['Right'] }}></div> }
                    </div>
                    <ul className="lean-details">
                      <li><span>{leftPerc}%</span> Left Leaning</li>
                      <li><span>{centerPerc}%</span> Balanced</li>
                      <li><span>{rightPerc}%</span> Right Leaning</li>
                    </ul>
                  </>
                ) : ( <p className="no-data-msg small">Read more to see your profile.</p> )}
            </Card>

            <div className="dashboard-left-footer">
               <Link to="/account-settings" style={{textDecoration:'none'}}>
                   <Button variant="secondary" className="btn-full">Account Settings</Button>
               </Link>
            </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="dashboard-right-column">
          <SectionHeader title="Deep Insights" subtitle="Visualizing your consumption habits" />

          {/* Weekly Pulse Card */}
          {digestData && digestData.status !== 'Insufficient Data' && (
              <Card className={`pulse-card ${digestData.status.includes('Bubble') ? 'bubble' : 'balanced'}`}>
                <div className="pulse-layout">
                    <div className="pulse-text-col">
                        <h3 className="pulse-title">Weekly Pulse: {digestData.status}</h3>
                        <p className="pulse-desc">
                            {digestData.status.includes('Bubble') 
                             ? `You've focused heavily on one perspective this week.`
                             : `Great job! Your reading habits are well-distributed.`}
                        </p>
                    </div>
                    {digestData.recommendation && (
                        <div className="pulse-rec-box">
                            <div className="pulse-rec-label">Recommended Read</div>
                            <div className="pulse-rec-headline">{digestData.recommendation.headline}</div>
                            <a href={`/?article=${digestData.recommendation._id}`} style={{textDecoration:'none'}}>
                                <Button variant="text" style={{fontSize:'10px', marginTop:'5px'}}>Read Now</Button>
                            </a>
                        </div>
                    )}
                </div>
              </Card>
          )}

          {/* Tabs (Mobile) or Grid (Desktop) */}
          {isMobile ? (
              <>
                <div className="dashboard-tabs">
                    {['Overview', 'Bias', 'Interests', 'Quality'].map(tab => (
                        <button 
                            key={tab}
                            className={activeTab === tab.toLowerCase() ? 'active' : ''} 
                            onClick={() => setActiveTab(tab.toLowerCase() as any)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="dashboard-mobile-content">
                    {activeTab === 'overview' && (
                        <Card>
                            <h3>History</h3>
                            <div className="chart-container"><Line options={getLineChartOptions(theme)} data={storiesReadData} /></div>
                        </Card>
                    )}
                    {activeTab === 'bias' && (
                        <Card>
                            <h3>Reliability Map</h3>
                            <div className="chart-container-large"><BiasMap articles={statsData?.allArticles || []} theme={theme} /></div>
                        </Card>
                    )}
                    {activeTab === 'interests' && (
                        <>
                            <Card>
                                <h3>Top Categories</h3>
                                <div className="chart-container"><Bar options={getBarChartOptions('', 'Articles', theme)} data={categoryReadData} /></div>
                            </Card>
                            <Card>
                                <h3>Top Sources</h3>
                                <div className="chart-container"><Bar options={getBarChartOptions('', 'Articles', theme)} data={topSourcesData} /></div>
                            </Card>
                        </>
                    )}
                    {activeTab === 'quality' && (
                        <>
                            <Card>
                                <h3>Sentiment</h3>
                                <div className="chart-container"><Doughnut options={getDoughnutChartOptions('', theme)} data={sentimentReadData} /></div>
                            </Card>
                            <Card>
                                <h3>Quality Grade</h3>
                                <div className="chart-container"><Doughnut options={getDoughnutChartOptions('', theme)} data={qualityReadData} /></div>
                            </Card>
                        </>
                    )}
                </div>
              </>
          ) : (
              <div className="dashboard-grid">
                  <Card className="full-width-card">
                      <h3>Stories Read Over Time</h3>
                      <div className="chart-container"><Line options={getLineChartOptions(theme)} data={storiesReadData} /></div>
                  </Card>

                  <Card className="full-width-card">
                      <h3>Bias vs. Trust Map</h3>
                      <div className="chart-container-large"><BiasMap articles={statsData?.allArticles || []} theme={theme} /></div>
                  </Card>

                  <Card>
                      <h3>Top Categories</h3>
                      <div className="chart-container"><Bar options={getBarChartOptions('', 'Articles', theme)} data={categoryReadData} /></div>
                  </Card>

                  <Card>
                      <h3>Top Sources</h3>
                      <div className="chart-container"><Bar options={getBarChartOptions('', 'Articles', theme)} data={topSourcesData} /></div>
                  </Card>

                  <Card>
                      <h3>Sentiment</h3>
                      <div className="chart-container"><Doughnut options={getDoughnutChartOptions('', theme)} data={sentimentReadData} /></div>
                  </Card>

                  <Card>
                      <h3>Quality Grade</h3>
                      <div className="chart-container"><Doughnut options={getDoughnutChartOptions('', theme)} data={qualityReadData} /></div>
                  </Card>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyDashboard;
