// src/components/BiasMap.tsx
import React, { useMemo } from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { getScatterChartOptions, leanColors } from '../utils/ChartConfig';
import { IArticle } from '../types';

// Register necessary Chart.js components
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

interface BiasMapProps {
  articles: IArticle[];
  theme: string;
}

const BiasMap: React.FC<BiasMapProps> = ({ articles, theme }) => {
  
  // --- Data Transformation Logic ---
  const chartData: ChartData<'scatter'> = useMemo(() => {
    // 1. Filter out articles without scores
    const validArticles = (articles || []).filter(a => 
      a.politicalLean && 
      a.politicalLean !== 'Not Applicable' &&
      typeof a.trustScore === 'number'
    );

    // 2. Map Leans to X-Axis Numbers
    const getLeanValue = (lean: string) => {
      switch(lean) {
        case 'Left': return -10;
        case 'Left-Leaning': return -5;
        case 'Center': return 0;
        case 'Right-Leaning': return 5;
        case 'Right': return 10;
        default: return 0;
      }
    };

    // 3. Create Data Points
    const points = validArticles.map(article => ({
      x: getLeanValue(article.politicalLean),
      y: article.trustScore || 0,
      headline: article.headline // Attached for tooltip
    }));

    // 4. Assign Colors based on Lean
    const backgroundColors = validArticles.map(a => leanColors[a.politicalLean] || '#888');

    return {
      datasets: [
        {
          label: 'Articles',
          data: points,
          backgroundColor: backgroundColors,
          pointRadius: 6, // Size of the dots
          pointHoverRadius: 8,
          pointBorderColor: theme === 'dark' ? '#ffffff' : '#000000',
          pointBorderWidth: 1,
        },
      ],
    };
  }, [articles, theme]);

  const options: ChartOptions<'scatter'> = getScatterChartOptions(theme);

  // --- Render ---
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {(!articles || articles.length === 0) ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          color: 'var(--text-tertiary)',
          fontSize: '12px'
        }}>
          No data available for map.
        </div>
      ) : (
        <Scatter options={options} data={chartData} />
      )}
    </div>
  );
};

export default BiasMap;
