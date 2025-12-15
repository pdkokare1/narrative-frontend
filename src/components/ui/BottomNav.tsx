// src/components/ui/BottomNav.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useRadio } from '../../context/RadioContext';
import * as api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import useHaptic from '../../hooks/useHaptic'; 
import './BottomNav.css';

const BottomNav: React.FC = () => {
  const { isPlaying, isPaused, startRadio, currentArticle, togglePlayer } = useRadio();
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
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end onClick={vibrate}>
        <div className="nav-icon"><svg {...iconProps} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
        <span className="nav-label">Feed</span>
      </NavLink>

      <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={vibrate}>
        <div className="nav-icon"><svg {...iconProps} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
        <span className="nav-label">Search</span>
      </NavLink>

      <div className={`nav-item radio-action ${isPlaying ? 'playing' : ''} ${isPaused ? 'paused' : ''}`} onClick={handleRadioClick}>
        <div className="radio-circle">
          {loading ? ( <div className="spinner-small" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', marginRight: 0 }}></div> ) 
          : (isPlaying || isPaused) ? (
              <div className="wave-container"><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div></div>
          ) : ( <svg {...iconProps} strokeWidth={2} viewBox="0 0 24 24" style={{marginLeft: '2px'}}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> )}
        </div>
        <span className="nav-label radio-label">{loading ? '...' : (isPlaying || isPaused) ? 'Player' : 'Radio'}</span>
      </div>

      <NavLink to="/my-dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={vibrate}>
        <div className="nav-icon"><svg {...iconProps} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></div>
        <span className="nav-label">Stats</span>
      </NavLink>

      {/* --- REPLACED: SAVED -> PROFILE MENU --- */}
      <NavLink to="/profile-menu" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={vibrate}>
        <div className="nav-icon"><svg {...iconProps} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
