// src/components/GlobalPlayerBar.js
import React, { useState, useEffect } from 'react';
import { useRadio } from '../context/RadioContext';
import { useLocation } from 'react-router-dom';

const GlobalPlayerBar = () => {
  const {
    isPlaying,
    isPaused,
    currentArticle,
    queue,
    currentIndex,
    progress,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    stop
  } = useRadio();

  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();

  // Reset to maximized if the user manually starts a new track from the feed
  useEffect(() => {
    if (currentArticle) {
        // Optional: Auto-maximize on new track? 
        // setIsMinimized(false); 
    }
  }, [currentArticle]);

  // If nothing is playing/loaded, hide the player entirely
  if (!currentArticle) return null;

  // --- VIEW 1: MINIMIZED BUBBLE ---
  if (isMinimized) {
    return (
      <div 
        className="mini-player-bubble" 
        onClick={() => setIsMinimized(false)}
        title="Expand Player"
      >
        {/* Thumbnail or Icon */}
        {currentArticle.imageUrl ? (
            <img src={currentArticle.imageUrl} alt="Cover" className="mini-player-thumb" />
        ) : (
            <div className="mini-player-icon">🎧</div>
        )}

        {/* Overlay Icon (Play/Pause status) */}
        <div className="mini-player-overlay">
            {isPaused ? (
                <span style={{ marginLeft: '2px' }}>▶</span> 
            ) : (
                <div className="mini-equalizer">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                </div>
            )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: MAXIMIZED BAR ---
  return (
    <div className="global-player-bar">
      {/* Top Progress Line */}
      <div className="player-progress-container">
        <div
          className="player-progress-fill"
          style={{ width: `${(progress / duration) * 100}%` }}
        />
      </div>

      <div className="player-content">
        {/* Left: Article Info */}
        <div className="player-info" onClick={() => setIsMinimized(true)} style={{cursor: 'pointer'}}>
           <div className="player-thumb">
              {currentArticle.imageUrl ? (
                  <img src={currentArticle.imageUrl} alt="" />
              ) : (
                  <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📰</div>
              )}
           </div>
           <div className="player-text">
             <h4 className="player-headline">{currentArticle.headline}</h4>
             <span className="player-sub">
               {currentIndex + 1}/{queue.length} • {currentArticle.source || 'Narrative News'}
             </span>
           </div>
        </div>

        {/* Center: Controls */}
        <div className="player-controls">
          <button 
            onClick={(e) => { e.stopPropagation(); playPrevious(); }} 
            disabled={currentIndex === 0} 
            className="ctrl-btn skip-btn"
          >
            ⏮
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} 
            className="ctrl-btn play-btn"
          >
            {isPaused ? '▶' : 'II'}
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); playNext(); }} 
            disabled={currentIndex === queue.length - 1} 
            className="ctrl-btn skip-btn"
          >
            ⏭
          </button>
        </div>

        {/* Right: Actions */}
        <div className="player-actions">
           {/* Minimize Button */}
           <button 
             onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }} 
             className="ctrl-btn icon-only" 
             title="Minimize"
             style={{ fontSize: '20px', fontWeight: 'bold', paddingBottom: '10px' }}
           >
             −
           </button>
           
           {/* Stop/Close Button */}
           <button 
             onClick={(e) => { e.stopPropagation(); stop(); }} 
             className="ctrl-btn icon-only" 
             title="Stop & Close"
             style={{ fontSize: '18px' }}
           >
             ✕
           </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalPlayerBar;
