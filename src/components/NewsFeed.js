// In file: src/components/NewsFeed.js
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import LatestFeed from './feeds/LatestFeed';
import ForYouFeed from './feeds/ForYouFeed';
import InFocusBar from './InFocusBar'; // <--- NEW IMPORT
import '../App.css'; 

function NewsFeed({ 
  filters, 
  onFilterChange, 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) {
  const [mode, setMode] = useState('latest'); 
  const contentRef = useRef(null); 

  const getPageTitle = () => {
    if (mode === 'foryou') return 'Balanced For You | The Gamut';
    if (filters.category && filters.category !== 'All Categories') return `${filters.category} News | The Gamut`;
    return 'The Gamut - Analyse The Full Spectrum';
  };

  const renderToggle = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '10px' }}>
      <div style={{ 
        display: 'flex', background: 'var(--bg-elevated)', borderRadius: '25px', 
        padding: '4px', border: '1px solid var(--border-color)', position: 'relative' 
      }}>
        <button
          onClick={() => setMode('latest')}
          style={{
            background: mode === 'latest' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'latest' ? 'white' : 'var(--text-secondary)',
            border: 'none', borderRadius: '20px', padding: '8px 20px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease',
            boxShadow: mode === 'latest' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
          }}
        >
          Latest News
        </button>
        <button
          onClick={() => setMode('foryou')}
          style={{
            background: mode === 'foryou' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'foryou' ? 'white' : 'var(--text-secondary)',
            border: 'none', borderRadius: '20px', padding: '8px 20px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease',
            boxShadow: mode === 'foryou' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <span>Balanced For You</span>
        </button>
      </div>
    </div>
  );

  return (
    <main className="content" ref={contentRef}>
      <Helmet>
        <title>{getPageTitle()}</title>
      </Helmet>

      {/* --- NEW: In Focus Bar --- */}
      <InFocusBar />

      {renderToggle()}

      {mode === 'latest' ? (
        <LatestFeed 
          filters={filters}
          onFilterChange={onFilterChange}
          onAnalyze={onAnalyze}
          onCompare={onCompare}
          savedArticleIds={savedArticleIds}
          onToggleSave={onToggleSave}
          showTooltip={showTooltip}
          scrollToTopRef={contentRef}
        />
      ) : (
        <ForYouFeed 
          onAnalyze={onAnalyze}
          onCompare={onCompare}
          savedArticleIds={savedArticleIds}
          onToggleSave={onToggleSave}
          showTooltip={showTooltip}
        />
      )}
    </main>
  );
}

export default NewsFeed;
