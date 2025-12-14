// src/components/NewsFeed.tsx
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import UnifiedFeed from './feeds/UnifiedFeed';
import InFocusBar from './InFocusBar'; 
import '../App.css'; 
import { IArticle, IFilters } from '../types';

interface NewsFeedProps {
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ 
  filters, 
  onFilterChange, 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) => {
  const [mode, setMode] = useState<'latest' | 'foryou' | 'personalized'>('latest'); 
  const contentRef = useRef<HTMLDivElement>(null); 

  const getPageTitle = () => {
    if (mode === 'foryou') return 'Balanced For You | The Gamut';
    if (mode === 'personalized') return 'My Mix | The Gamut';
    if (filters.category && filters.category !== 'All Categories') return `${filters.category} News | The Gamut`;
    return 'The Gamut - Analyse The Full Spectrum';
  };

  const renderToggle = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
      <div style={{ 
        display: 'flex', background: 'var(--bg-elevated)', borderRadius: '25px', 
        padding: '4px', border: '1px solid var(--border-color)', position: 'relative' 
      }}>
        {['latest', 'foryou', 'personalized'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              style={{
                background: mode === m ? 'var(--accent-primary)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-secondary)',
                border: 'none', borderRadius: '20px', padding: '8px 16px',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease',
                textTransform: 'capitalize'
              }}
            >
              {m === 'foryou' ? 'Balanced' : m === 'personalized' ? 'For You' : 'Latest'}
            </button>
        ))}
      </div>
    </div>
  );

  return (
    <main className="content" ref={contentRef}>
      <Helmet>
        <title>{getPageTitle()}</title>
      </Helmet>

      {/* --- In Focus Bar --- */}
      <InFocusBar />

      {renderToggle()}

      <UnifiedFeed 
          mode={mode}
          filters={filters}
          onFilterChange={onFilterChange}
          onAnalyze={onAnalyze}
          onCompare={onCompare}
          savedArticleIds={savedArticleIds}
          onToggleSave={onToggleSave}
          showTooltip={showTooltip}
          scrollToTopRef={contentRef}
      />
    </main>
  );
};

export default NewsFeed;
