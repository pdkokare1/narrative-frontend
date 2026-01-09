// src/components/NewsFeed.tsx
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import UnifiedFeed from './feeds/UnifiedFeed';
import NarrativeModal from './modals/NarrativeModal'; 
import useIsMobile from '../hooks/useIsMobile';
import useHaptic from '../hooks/useHaptic';
import '../App.css'; 
import { IArticle, IFilters, INarrative } from '../types';

interface NewsFeedProps {
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

// UPDATE: Changed modes to match new hierarchy
type FeedMode = 'latest' | 'infocus' | 'balanced';

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
  const [animDirection, setAnimDirection] = useState<'enter-right' | 'enter-left'>('enter-right');
  
  // Narrative Modal State
  const [selectedNarrative, setSelectedNarrative] = useState<INarrative | null>(null);

  // Ref passed to UnifiedFeed for scrolling. 
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

  const changeMode = (newMode: FeedMode, direction: 'enter-right' | 'enter-left') => {
      vibrate();
      setAnimDirection(direction);
      setMode(newMode);
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // UPDATE: New Swipe Logic for Latest -> In Focus -> Balanced
    if (isLeftSwipe) { 
        if (mode === 'latest') changeMode('infocus', 'enter-right');
        else if (mode === 'infocus') changeMode('balanced', 'enter-right');
    }
    if (isRightSwipe) { 
        if (mode === 'balanced') changeMode('infocus', 'enter-left');
        else if (mode === 'infocus') changeMode('latest', 'enter-left');
    }
  };

  const getPageTitle = () => {
    if (mode === 'balanced') return 'Balanced Perspectives | The Gamut';
    if (mode === 'infocus') return 'In Focus | The Gamut';
    if (filters.category && filters.category !== 'All Categories') return `${filters.category} News | The Gamut`;
    return 'The Gamut - Analyse The Full Spectrum';
  };

  // --- DESKTOP TOGGLE (Pills) ---
  const renderDesktopToggle = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', background: 'var(--bg-elevated)', borderRadius: '25px', 
        padding: '4px', border: '1px solid var(--border-color)', position: 'relative' 
      }}>
        {['latest', 'infocus', 'balanced'].map((m) => (
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
              {m === 'infocus' ? 'In Focus' : m === 'balanced' ? 'Balanced' : 'Top Stories'}
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
            marginBottom: '5px', 
            marginTop: 0, 
            paddingTop: '0px' 
        }}>
            <div style={{ display: 'flex', width: '100%' }}>
                {[
                    { id: 'latest', label: 'Latest' },
                    { id: 'infocus', label: 'In Focus' },
                    { id: 'balanced', label: 'Balanced' }
                ].map(tab => {
                    const isActive = mode === tab.id;
                    // Smart direction calculation for animation
                    let clickDirection: 'enter-right' | 'enter-left' = 'enter-right';
                    
                    if (mode === 'latest') clickDirection = 'enter-right';
                    else if (mode === 'balanced') clickDirection = 'enter-left';
                    else if (mode === 'infocus') {
                        clickDirection = tab.id === 'balanced' ? 'enter-right' : 'enter-left';
                    }

                    return (
                        <div 
                            key={tab.id}
                            onClick={() => { 
                                if (!isActive) changeMode(tab.id as FeedMode, clickDirection); 
                            }}
                            style={{
                                flex: 1, textAlign: 'center', padding: '8px 0', 
                                cursor: 'pointer', position: 'relative',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                fontWeight: isActive ? 700 : 500,
                                fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                                transition: 'color 0.2s'
                            }}
                        >
                            {tab.label}
                            <div style={{ 
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                                background: 'var(--accent-primary)',
                                opacity: isActive ? 1 : 0,
                                transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                            }} />
                        </div>
                    );
                })}
            </div>
        </div>
      );
  };

  return (
    <main 
        className="content" 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      <Helmet>
        <title>{getPageTitle()}</title>
      </Helmet>

      {isMobile ? renderMobileNav() : renderDesktopToggle()}

      {/* Removed InFocusBar - Now integrated as a main tab */}

      <div key={mode} className={`feed-anim-wrapper ${animDirection}`}>
          <UnifiedFeed 
              mode={mode}
              filters={filters}
              onFilterChange={onFilterChange}
              onAnalyze={onAnalyze}
              onCompare={onCompare}
              onOpenNarrative={setSelectedNarrative} 
              savedArticleIds={savedArticleIds}
              onToggleSave={onToggleSave}
              showTooltip={showTooltip}
              scrollToTopRef={contentRef}
          />
      </div>

      {selectedNarrative && (
          <NarrativeModal 
              data={selectedNarrative} 
              onClose={() => setSelectedNarrative(null)} 
          />
      )}
    </main>
  );
};

export default NewsFeed;
