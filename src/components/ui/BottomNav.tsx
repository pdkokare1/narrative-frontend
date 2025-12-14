// src/components/ui/BottomNav.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useRadio } from '../../context/RadioContext';
import * as api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  const { 
    isPlaying, 
    isPaused, 
    startRadio, 
    currentArticle, 
    togglePlayer,
    playerOpen 
  } = useRadio();
  
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Interaction: Tap Headphone Icon
  const handleRadioClick = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (loading) return;

    // 1. If Audio is Active (Playing OR Paused) -> Toggle the Bubble
    if (isPlaying || (isPaused && currentArticle)) {
        togglePlayer();
        return;
    }

    // 2. If Stopped -> Start Fresh
    setLoading(true);
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

  const renderIcon = () => {
      if (loading) {
          return <div className="spinner-small" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', marginRight: 0 }}></div>;
      }
      
      if (isPlaying || isPaused) {
          return (
              <div className="wave-container">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
              </div>
          );
      }

      // Default Headphone Icon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
      );
  };

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <div className="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
        <span className="nav-label">Feed</span>
      </NavLink>

      <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <span className="nav-label">Search</span>
      </NavLink>

      {/* --- CENTER: GAMUT RADIO --- */}
      <div 
        className={`nav-item radio-action ${isPlaying ? 'playing' : ''} ${isPaused ? 'paused' : ''}`} 
        onClick={handleRadioClick}
      >
        <div className="nav-icon">
          {renderIcon()}
        </div>
        <span className="nav-label">
            {loading ? 'Loading' : (isPlaying || isPaused) ? (playerOpen ? 'Close' : 'Player') : 'Radio'}
        </span>
      </div>

      <NavLink to="/my-dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
        </div>
        <span className="nav-label">Stats</span>
      </NavLink>

      <NavLink to="/saved-articles" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div className="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <span className="nav-label">Saved</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
