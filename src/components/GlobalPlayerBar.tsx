// src/components/GlobalPlayerBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useRadio } from '../context/RadioContext';
import useHaptic from '../hooks/useHaptic'; // NEW
import './GlobalPlayerBar.css';

const GlobalPlayerBar: React.FC = () => {
  const { 
    currentArticle, 
    currentSpeaker, 
    isPlaying, 
    isPaused, 
    isLoading,
    isVisible, 
    playerOpen, 
    closePlayer,
    stop, 
    pause, 
    resume, 
    playNext,
    playPrevious, 
    isWaitingForNext,
    autoplayTimer,
    cancelAutoplay,
    currentTime,
    duration,
    seekTo,
    playbackRate,
    changeSpeed
  } = useRadio();

  const vibrate = useHaptic(); // NEW
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const autoHideRef = useRef<NodeJS.Timeout | null>(null);

  // --- AUTO-HIDE LOGIC ---
  const resetAutoHide = () => {
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
    if (isPlaying && playerOpen) { 
        autoHideRef.current = setTimeout(() => {
            closePlayer();
        }, 7000); 
    }
  };

  useEffect(() => {
    if (playerOpen) {
        resetAutoHide();
    } else {
        if (autoHideRef.current) clearTimeout(autoHideRef.current);
    }
    return () => { if (autoHideRef.current) clearTimeout(autoHideRef.current); };
  }, [playerOpen, isPlaying]);

  useEffect(() => {
    if (!isDragging) setDragTime(currentTime);
  }, [currentTime, isDragging]);

  if (!isVisible || !playerOpen) return null;

  // --- HANDLERS (Combine Haptic + Logic + Timer Reset) ---
  const handleControl = (fn: () => void) => () => { 
      vibrate(); 
      fn(); 
      resetAutoHide(); 
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDragTime(Number(e.target.value));
    resetAutoHide();
  };

  const handleSeekStart = () => { setIsDragging(true); resetAutoHide(); };
  const handleSeekEnd = (e: any) => {
    setIsDragging(false);
    seekTo(Number(e.currentTarget.value));
    resetAutoHide();
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSpeedClick = () => {
    vibrate();
    const speeds = [1.0, 1.25, 1.5, 0.5, 0.75];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    changeSpeed(speeds[nextIndex]);
    resetAutoHide();
  };

  // --- UP NEXT BUBBLE ---
  if (isWaitingForNext) {
    return (
      <div className="global-player-bar up-next-mode bubble-mode" onClick={resetAutoHide}>
        <div className="up-next-content">
          <span className="up-next-label">Up Next in {autoplayTimer}s...</span>
          <div className="up-next-loader-track">
             <div className="up-next-loader-fill" style={{ width: `${((autoplayTimer || 0)/5)*100}%` }}></div>
          </div>
        </div>
        <div className="player-controls">
            <button onClick={handleControl(playNext)} className="player-btn primary">Play Now</button>
            <button onClick={handleControl(cancelAutoplay)} className="player-btn secondary">Cancel</button>
        </div>
      </div>
    );
  }

  // --- ACTIVE PLAYER BUBBLE ---
  return (
    <div className="global-player-bar bubble-mode" onClick={resetAutoHide}>
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
            style={{ backgroundSize: `${(dragTime / (duration || 1)) * 100}% 100%` }}
        />
      </div>

      <div className="player-main-row">
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

        <div className="player-controls">
            {isLoading ? (
                <div className="spinner-small white"></div>
            ) : (
                <>
                   <button onClick={handleSpeedClick} className="player-btn text-btn">{playbackRate}x</button>
                   <button onClick={handleControl(playPrevious)} className="player-btn icon-only">⏮</button>
                   {isPaused ? (
                     <button onClick={handleControl(resume)} className="player-btn icon-only primary-play">▶</button>
                   ) : (
                     <button onClick={handleControl(pause)} className="player-btn icon-only primary-play">⏸</button>
                   )}
                   <button onClick={handleControl(playNext)} className="player-btn icon-only">⏭</button>
                   <button onClick={() => { vibrate(); closePlayer(); }} className="player-btn close-action" title="Hide Player">⌄</button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default GlobalPlayerBar;
