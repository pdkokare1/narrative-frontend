// src/components/ui/BottomNav.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useRadio } from '../../context/RadioContext';
import * as api from '../../services/api'; // Still needed for fallback safety
import { useToast } from '../../context/ToastContext';
import useHaptic from '../../hooks/useHaptic'; 
import './BottomNav.css';
import { IFilters } from '../../types';

interface BottomNavProps {
  currentFilters?: IFilters;
  onOpenFilters?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentFilters, onOpenFilters }) => {
  // Now we use contextQueue and contextLabel
  const { isPlaying, isPaused, startRadio, currentArticle, togglePlayer, contextQueue, contextLabel } = useRadio();
  const { addToast } = useToast();
  const vibrate = useHaptic();
  const [loading, setLoading] = useState(false);

  const handleRadioClick = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    vibrate(); 
    if (loading) return;

    if (isPlaying || (isPaused && currentArticle)) {
        togglePlayer(); 
        return;
    }

    setLoading(true);

    // 1. Check if we have a smart queue registered
    if (contextQueue && contextQueue.length > 0) {
        addToast(`Tuning into ${contextLabel}...`, 'info');
        startRadio(contextQueue, 0);
        setLoading(false);
        return;
    }
    
    // 2. Fallback: If no queue (e.g., page load error), fetch default
    addToast('Tuning into Gamut Radio...', 'info');
    try {
        const { data } = await api.fetchArticles({ limit: 20, offset: 0 });
        if (data.articles && data.articles.length > 0) {
            startRadio(data.articles, 0);
        } else {
            addToast('No news available for radio.', 'error');
        }
    } catch (err) {
        console.error("Radio start failed", err);
        addToast('Could not start radio.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const iconProps = { width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as "round", strokeLinejoin: "round" as "round" };

  return (
    <nav className="bottom-nav">
      
      {/* 1. FEED (Grid Icon) */}
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end onClick={vibrate}>
        <div className="nav-icon">
          <svg {...iconProps} viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <span className="nav-label">Feed</span>
      </NavLink>

      {/* 2. STATS (Chart Icon) */}
      <NavLink to="/my-dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={vibrate}>
        <div className="nav-icon">
          <svg {...iconProps} viewBox="0 0 24 24">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <span className="nav-label">Stats</span>
      </NavLink>

      {/* 3. RADIO (Center Floating) */}
      <div className={`nav-item radio-action ${isPlaying ? 'playing' : ''} ${isPaused ? 'paused' : ''}`} onClick={handleRadioClick}>
        <div className="radio-circle">
          {loading ? ( 
            <div className="spinner-small" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', marginRight: 0 }}></div> 
          ) : (isPlaying || isPaused) ? (
              <div className="wave-container">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
          ) : ( 
            <svg {...iconProps} strokeWidth={2} width={26} height={26} viewBox="0 0 24 24" style={{marginLeft: '0'}}>
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg> 
          )}
        </div>
        <span className="nav-label radio-label">{loading ? 'Loading' : (isPlaying || isPaused) ? 'Now Playing' : 'Radio'}</span>
      </div>

      {/* 4. FILTERS (Sliders Icon) */}
      <div className="nav-item" onClick={() => { vibrate(); if(onOpenFilters) onOpenFilters(); }}>
        <div className="nav-icon">
          <svg {...iconProps} viewBox="0 0 24 24">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
        </div>
        <span className="nav-label">Filters</span>
      </div>

      {/* 5. PROFILE (User Icon) */}
      <NavLink to="/profile-menu" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={vibrate}>
        <div className="nav-icon">
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
