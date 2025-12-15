// src/components/NewsFeed.tsx
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import UnifiedFeed from './feeds/UnifiedFeed';
import InFocusBar from './InFocusBar'; 
import useIsMobile from '../hooks/useIsMobile';
import useHaptic from '../hooks/useHaptic';
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

type FeedMode = 'latest' | 'foryou' | 'personalized';

const NewsFeed: React.FC<NewsFeedProps> = ({ 
  filters, 
  onFilterChange, 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) => {
  const [mode, setMode] = useState<FeedMode>('latest'); 
  const contentRef = useRef<HTMLDivElement>(null); 
  const isMobile = useIsMobile();
  const vibrate = useHaptic();

  // --- SWIPE LOGIC ---
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const minSwipeDistance = 50; 

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null; 
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) { // Next
        if (mode === 'latest') { vibrate(); setMode('foryou'); }
        else if (mode === 'foryou') { vibrate(); setMode('personalized'); }
    }
    if (isRightSwipe) { // Prev
        if (mode === 'personalized') { vibrate(); setMode('foryou'); }
        else if (mode === 'foryou') { vibrate(); setMode('latest'); }
    }
  };

  const getPageTitle = () => {
    if (mode === 'foryou') return 'Balanced For You | The Gamut';
    if (mode === 'personalized') return 'My Mix | The Gamut';
    if (filters.category && filters.category !== 'All Categories') return `${filters.category} News | The Gamut`;
    return 'The Gamut - Analyse The Full Spectrum';
  };

  // --- DESKTOP TOGGLE (Pills) ---
  const renderDesktopToggle = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', background: 'var(--bg-elevated)', borderRadius: '25px', 
        padding: '4px', border: '1px solid var(--border-color)', position: 'relative' 
      }}>
        {['latest', 'foryou', 'personalized'].map((m) => (
            <button
              key={m}
              onClick={() => { vibrate(); setMode(m as FeedMode); }}
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

  // --- MOBILE COLOR BAR TOGGLE ---
  const renderMobileNav = () => {
      return (
        <div style={{ 
            position: 'sticky', top: 0, zIndex: 900, 
            background: 'var(--bg-primary)', 
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '15px',
            marginTop: 0, // Removed negative margin to fit tight to header
            paddingTop: '5px' // Slight internal padding
        }}>
            <div style={{ display: 'flex', width: '100%' }}>
                {[
                    { id: 'latest', label: 'Latest', color: 'var(--accent-primary)' },
                    { id: 'foryou', label: 'Balanced', color: '#4E9F54' },
                    { id: 'personalized', label: 'For You', color: '#8DABE0' }
                ].map(tab => (
                    <div 
                        key={tab.id}
                        onClick={() => { vibrate(); setMode(tab.id as FeedMode); }}
                        style={{
                            flex: 1, textAlign: 'center', padding: '10px 0',
                            cursor: 'pointer', position: 'relative',
                            color: mode === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontWeight: mode === tab.id ? 700 : 500,
                            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                            transition: 'color 0.2s'
                        }}
                    >
                        {tab.label}
                        {/* Animated Underline */}
                        <div style={{ 
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                            background: tab.color,
                            opacity: mode === tab.id ? 1 : 0,
                            transform: mode === tab.id ? 'scaleX(1)' : 'scaleX(0)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                        }} />
                    </div>
                ))}
            </div>
        </div>
      );
  };

  return (
    <main 
        className="content" 
        ref={contentRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      <Helmet>
        <title>{getPageTitle()}</title>
      </Helmet>

      {isMobile ? renderMobileNav() : renderDesktopToggle()}

      {/* In Focus Bar stays, but below the nav on mobile */}
      <InFocusBar />

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
