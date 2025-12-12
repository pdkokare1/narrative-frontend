// src/components/GlobalPlayerBar.js
import React, { useState, useEffect } from 'react';
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
    playPrevious, // <--- NEW
    isWaitingForNext,
    autoplayTimer,
    cancelAutoplay,
    // --- NEW PROPS ---
    currentTime,
    duration,
    seekTo,
    playbackRate,
    changeSpeed
  } = useRadio();

  // Local state for smooth scrubbing (prevents jitter while dragging)
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  // Sync local drag time with actual time (only when NOT dragging)
  useEffect(() => {
    if (!isDragging) {
      setDragTime(currentTime);
    }
  }, [currentTime, isDragging]);

  if (!isVisible) return null;

  // --- UP NEXT MODE (Unchanged) ---
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

  // --- HELPER: Time Formatter (mm:ss) ---
  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // --- HELPER: Speed Cycler ---
  const handleSpeedClick = () => {
    const speeds = [1.0, 1.25, 1.5, 0.5, 0.75];
    const currentIndex = speeds.indexOf(playbackRate);
    // Find next speed, default to 1.0 if not found
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % speeds.length;
    changeSpeed(speeds[nextIndex]);
  };

  // --- HANDLERS ---
  const handleSeekChange = (e) => {
    setDragTime(Number(e.target.value));
  };

  const handleSeekStart = () => setIsDragging(true);

  const handleSeekEnd = (e) => {
    setIsDragging(false);
    seekTo(Number(e.target.value));
  };

  // --- ACTIVE PLAYING MODE ---
  return (
    <div className="global-player-bar">
      
      {/* 1. Scrubber (Top Edge) */}
      <div className="scrubber-container">
        <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={dragTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="scrubber-range"
            style={{ 
                // Dynamic gradient for filled vs empty part
                backgroundSize: `${(dragTime / (duration || 1)) * 100}% 100%` 
            }}
        />
      </div>

      <div className="player-main-row">
        
        {/* 2. Info Section */}
        <div className="player-info">
            <div className="player-meta-top">
                {currentSpeaker && (
                    <span className="speaker-name-small">
                        <span className={`pulse-dot-small ${isPlaying ? 'active' : ''}`}></span>
                        {currentSpeaker.name}
                    </span>
                )}
                <span className="time-display">
                    {formatTime(dragTime)} / {formatTime(duration)}
                </span>
            </div>
            <div className="player-text-content">
                <span className="player-headline">
                    {isLoading ? "Buffering..." : currentArticle?.headline}
                </span>
            </div>
        </div>

        {/* 3. Controls Section */}
        <div className="player-controls">
            {isLoading ? (
                <div className="spinner-small white"></div>
            ) : (
                <>
                   {/* Speed Toggle */}
                   <button onClick={handleSpeedClick} className="player-btn text-btn" title="Playback Speed">
                       {playbackRate}x
                   </button>

                   {/* Previous */}
                   <button onClick={playPrevious} className="player-btn icon-only" title="Previous / Replay">
                       ⏮
                   </button>

                   {/* Play/Pause */}
                   {isPaused ? (
                     <button onClick={resume} className="player-btn icon-only primary-play" title="Resume">▶</button>
                   ) : (
                     <button onClick={pause} className="player-btn icon-only primary-play" title="Pause">⏸</button>
                   )}
                   
                   {/* Next */}
                   <button onClick={playNext} className="player-btn icon-only" title="Next Story">
                       ⏭
                   </button>
                   
                   {/* Stop */}
                   <button onClick={stop} className="player-btn close-action" title="Stop Radio">×</button>
                </>
            )}
        </div>
      </div>
    </div>
  );
}

export default GlobalPlayerBar;
