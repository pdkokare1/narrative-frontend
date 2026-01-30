// src/components/NewsFeed.tsx
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import UnifiedFeed from './feeds/UnifiedFeed';
import NarrativeModal from './modals/NarrativeModal'; 
import LoginModal from './modals/LoginModal'; 
import useIsMobile from '../hooks/useIsMobile';
import useHaptic from '../hooks/useHaptic';
import { useAuth } from '../context/AuthContext'; 
import { LockIcon } from './ui/Icons'; 
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

// UPDATED: Removed 'balanced' mode
type FeedMode = 'latest' | 'infocus';

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
  
  // Modals
  const [selectedNarrative, setSelectedNarrative] = useState<INarrative | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null); 
  
  const isMobile = useIsMobile();
  const vibrate = useHaptic();
  const { isGuest } = useAuth();

  // --- MODE SWITCHER ---
  const attemptChangeMode = (newMode: FeedMode, direction: 'enter-right' | 'enter-left') => {
      vibrate();
      setAnimDirection(direction);
      setMode(newMode);
  };

  // --- SWIPE LOGIC ---
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 90; 

  const onTouchStart = (e: React.TouchEvent) => {
    const y = e.targetTouches[0].clientY;
    const windowHeight = window.innerHeight;
    const topSafeZone = 150; 
    const bottomSafeZone = 120; 

    if (y < topSafeZone || y > (windowHeight - bottomSafeZone)) {
        touchStart.current = null;
        touchStartY.current = null;
        return;
    }

    touchEnd.current = null; 
    touchStart.current = e.targetTouches[0].clientX;
    touchEndY.current = null;
    touchStartY.current = y;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    if (!touchStartY.current || !touchEndY.current) return;

    const xDistance = touchStart.current - touchEnd.current;
    const yDistance = touchStartY.current - touchEndY.current;

    if (Math.abs(yDistance) > Math.abs(xDistance)) return;

    const isLeftSwipe = xDistance > minSwipeDistance;
    const isRightSwipe = xDistance < -minSwipeDistance;

    // Simplified Swipe Logic (Only 2 modes)
    if (isLeftSwipe && mode === 'latest') { 
        attemptChangeMode('infocus', 'enter-right');
    }
    if (isRightSwipe && mode === 'infocus') { 
        attemptChangeMode('latest', 'enter-left');
    }
  };

  const getPageTitle = () => {
    if (mode === 'infocus') return 'Narratives | The Gamut';
    if (filters.category && filters.category !== 'All Categories') return `${filters.category} News | The Gamut`;
    return 'The Gamut - Analyse The Full Spectrum';
  };

  // --- DESKTOP TOGGLE ---
  const renderDesktopToggle = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', background: 'var(--bg-elevated)', borderRadius: '25px', 
        padding: '4px', border: '1px solid var(--border-color)', position: 'relative' 
      }}>
        {['latest', 'infocus'].map((m) => (
            <button
              key={m}
              onClick={() => attemptChangeMode(m as FeedMode, 'enter-right')}
              style={{
                background: mode === m ? 'var(--accent-primary)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-secondary)',
                border: 'none', borderRadius: '20px', padding: '8px 16px',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease',
                textTransform: 'capitalize',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {m === 'infocus' ? 'Narratives' : 'Top Stories'}
            </button>
        ))}
      </div>
    </div>
  );

  // --- MOBILE TOGGLE ---
  const renderMobileNav = () => (
    <div style={{ 
        position: 'sticky', top: 0, zIndex: 900, 
        background: 'var(--bg-primary)', 
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '5px', marginTop: 0, paddingTop: '0px' 
    }}>
        <div style={{ display: 'flex', width: '100%' }}>
            {[
                { id: 'latest', label: 'Latest' },
                { id: 'infocus', label: 'Narratives' }
            ].map(tab => {
                const isActive = mode === tab.id;
                // Calculate slide direction based on active tab
                let clickDirection: 'enter-right' | 'enter-left' = 'enter-right';
                if (mode === 'latest' && tab.id === 'infocus') clickDirection = 'enter-right';
                if (mode === 'infocus' && tab.id === 'latest') clickDirection = 'enter-left';

                return (
                    <div 
                        key={tab.id}
                        onClick={() => { if (!isActive) attemptChangeMode(tab.id as FeedMode, clickDirection); }}
                        style={{
                            flex: 1, textAlign: 'center', padding: '8px 0', 
                            cursor: 'pointer', position: 'relative',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                            transition: 'color 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                    >
                        {tab.label}
                        <div style={{ 
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                            background: 'var(--accent-primary)',
                            opacity: isActive ? 1 : 0,
                            transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                            transition: 'all 0.3s'
                        }} />
                    </div>
                );
            })}
        </div>
    </div>
  );

  return (
    <main 
        /* UPDATED: Reset padding/overflow for Feed page to allow full width control */
        className="content"
        style={isMobile ? { padding: 0, overflow: 'hidden', height: '100vh' } : undefined}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <Helmet><title>{getPageTitle()}</title></Helmet>

      {isMobile ? renderMobileNav() : renderDesktopToggle()}

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

      {selectedNarrative && <NarrativeModal data={selectedNarrative} onClose={() => setSelectedNarrative(null)} />}
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        message="Login to access this feature."
      />
    </main>
  );
};

export default NewsFeed;
