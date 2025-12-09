// src/components/GlobalPlayerBar.js
import React from 'react';
import { useRadio } from '../context/RadioContext';
import './GlobalPlayerBar.css';

function GlobalPlayerBar() {
  const { 
    currentArticle, 
    currentSpeaker, 
    isPlaying, 
    isPaused, 
    isLoading,
    isVisible,
    stop, 
    pause, 
    resume, 
    playNext,
    isWaitingForNext,
    autoplayTimer,
    cancelAutoplay
  } = useRadio();

  if (!isVisible) return null;

  // --- UP NEXT MODE ---
  if (isWaitingForNext) {
    return (
      <div className="global-player-bar up-next-mode">
        <div className="up-next-content">
          <span className="up-next-label">Up Next in {autoplayTimer}s...</span>
          <div className="up-next-loader-track">
             <div className="up-next-loader-fill" style={{ width: `${(autoplayTimer/5)*100}%` }}></div>
          </div>
        </div>
        <div className="player-controls">
            <button onClick={playNext} className="player-btn primary">Play Now</button>
            <button onClick={cancelAutoplay} className="player-btn secondary">Cancel</button>
        </div>
      </div>
    );
  }

  // --- ACTIVE PLAYING MODE ---
  return (
    <div className="global-player-bar">
      
      {/* 1. Info Section */}
      <div className="player-info">
        {currentSpeaker && (
            <div className="player-speaker-tag">
                <div className={`pulse-dot ${isPlaying ? 'active' : ''}`}></div>
                <span className="speaker-name">{currentSpeaker.name}</span>
            </div>
        )}
        <div className="player-text-content">
            <span className="player-headline">
                {isLoading ? "Buffering Audio..." : currentArticle?.headline}
            </span>
        </div>
      </div>

      {/* 2. Controls Section */}
      <div className="player-controls">
        {isLoading ? (
            <div className="spinner-small white"></div>
        ) : (
            <>
               {isPaused ? (
                 <button onClick={resume} className="player-btn icon-only" title="Resume">▶</button>
               ) : (
                 <button onClick={pause} className="player-btn icon-only" title="Pause">⏸</button>
               )}
               
               <button onClick={playNext} className="player-btn icon-only" title="Next Story">⏭</button>
               <button onClick={stop} className="player-btn close-action" title="Stop Radio">×</button>
            </>
        )}
      </div>
    </div>
  );
}

export default GlobalPlayerBar;
