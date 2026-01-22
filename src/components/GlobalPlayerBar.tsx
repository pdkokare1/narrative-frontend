// src/components/GlobalPlayerBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useRadio } from '../context/RadioContext';
import { useToast } from '../context/ToastContext';
import useHaptic from '../hooks/useHaptic';
import useIsMobile from '../hooks/useIsMobile';
import * as api from '../services/api';
import { 
  Box, 
  Typography, 
  IconButton, 
  Slider, 
  Stack, 
  Fab, 
  useTheme, 
  Fade, 
  LinearProgress,
  Tooltip
} from '@mui/material';
import { 
  PlayArrowRounded, 
  PauseRounded, 
  SkipNextRounded, 
  SkipPreviousRounded, 
  CloseRounded,
  RemoveRounded, // For Minimize
  StopRounded,    // For Stop
  KeyboardArrowUpRounded // For Restore
} from '@mui/icons-material';
import './GlobalPlayerBar.css';

const GlobalPlayerBar: React.FC = () => {
  const theme = useTheme();
  const { 
    currentArticle, 
    currentSpeaker, 
    isPlaying, 
    isPaused, 
    isLoading,
    isVisible, 
    playerOpen, 
    openPlayer, // DESTUCTURED: Need this to restore
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
    changeSpeed,
  } = useRadio();

  const { addToast } = useToast();
  const vibrate = useHaptic();
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  
  // --- ANIMATION STATE ---
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [introActive, setIntroActive] = useState(true);

  const autoHideRef = useRef<NodeJS.Timeout | null>(null);

  // --- AUTO-HIDE LOGIC (MOBILE ONLY) ---
  const resetAutoHide = () => {
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
    // Only auto-hide on mobile
    if (isMobile && isPlaying && playerOpen) { 
        autoHideRef.current = setTimeout(() => {
            closePlayer();
        }, 7000); 
    }
  };

  useEffect(() => {
    if (playerOpen) resetAutoHide();
    else if (autoHideRef.current) clearTimeout(autoHideRef.current);
    
    return () => { if (autoHideRef.current) clearTimeout(autoHideRef.current); };
  }, [playerOpen, isPlaying, isMobile]); 

  useEffect(() => {
    if (!isDragging) setDragTime(currentTime);
  }, [currentTime, isDragging]);

  // --- ANIMATION EFFECTS ---
  useEffect(() => {
    const timer = setTimeout(() => setIntroActive(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setHasPlayedOnce(true);
      setIntroActive(false); 
    }
  }, [isPlaying]);

  // --- RENDER LOGIC ---
  
  // 1. If audio is not active/visible, render nothing.
  if (!isVisible) return null;

  // 2. If audio is active BUT player is MINIMIZED (closed), render the Mini Bar.
  if (!playerOpen) {
      return (
        <Fade in={true}>
            <Box 
                className="global-player-bar-container minimized" 
                onClick={() => { vibrate(); openPlayer(); }}
            >
                {/* LAYER 1: Glass BG */}
                <div className="glass-background-layer" />
                
                {/* LAYER 2: Mini Content */}
                <Box className="player-content-layer">
                     <Typography className="mini-bar-text">Gamut Radio</Typography>
                     <KeyboardArrowUpRounded sx={{ fontSize: 20, color: 'var(--accent-primary)' }} />
                </Box>
            </Box>
        </Fade>
      );
  }

  // --- FULL PLAYER LOGIC BELOW ---

  // --- HANDLERS ---
  const handleControl = (fn: () => void) => () => { 
      vibrate(); 
      fn(); 
      resetAutoHide(); 
  };

  const handleStop = () => {
    vibrate();
    stop();
    // Stop implicitly closes/resets, but we ensure UI feedback
    addToast('Radio stopped', 'info');
  };

  const handleMinimize = () => {
    vibrate();
    closePlayer();
    // Audio continues, UI becomes mini-bar
  };

  const handleSeekChange = (_: Event, value: number | number[]) => {
    setDragTime(value as number);
    resetAutoHide();
  };

  const handleSeekStart = () => { setIsDragging(true); resetAutoHide(); };
  
  const handleSeekEnd = (_: any, value: number | number[]) => {
    setIsDragging(false);
    seekTo(value as number);
    resetAutoHide();
  };

  const handleSpeedClick = () => {
    vibrate();
    const speeds = [1.0, 1.25, 1.5, 0.5, 0.75];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    changeSpeed(speeds[nextIndex]);
    resetAutoHide();
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Determine Animation Class
  let pulseClass = '';
  if (isPlaying) {
    pulseClass = 'pulse-active-heartbeat';
  } else if (!hasPlayedOnce && introActive && isVisible) {
    pulseClass = 'pulse-invite-radar';
  }

  // --- UP NEXT BUBBLE ---
  if (isWaitingForNext) {
    return (
      <Fade in={true}>
        <Box className="global-player-bar up-next-mode" onClick={resetAutoHide}>
            <Box sx={{ flex: 1, mr: 2 }}>
                <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: 'var(--accent-primary)' }}>
                    Up Next in {autoplayTimer}s...
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={((autoplayTimer || 0)/5)*100} 
                    sx={{ 
                      height: 4, 
                      borderRadius: 2, 
                      mt: 0.5, 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': { backgroundColor: 'var(--accent-primary)' }
                    }} 
                />
            </Box>
            <Stack direction="row" spacing={1}>
                <Fab 
                  size="small" 
                  variant="extended" 
                  onClick={handleControl(playNext)}
                  sx={{ 
                    bgcolor: 'var(--accent-primary)', 
                    color: 'var(--bg-primary)',
                    '&:hover': { bgcolor: 'var(--accent-hover)' }
                  }}
                >
                    <PlayArrowRounded sx={{ mr: 1, fontSize: 18 }} /> Play Now
                </Fab>
                <IconButton size="small" onClick={handleControl(cancelAutoplay)} sx={{ color: 'var(--text-secondary)' }}>
                    <CloseRounded />
                </IconButton>
            </Stack>
        </Box>
      </Fade>
    );
  }

  // --- ACTIVE PLAYER BUBBLE ---
  return (
    <Fade in={true}>
      <Box className="global-player-bar-container" onClick={resetAutoHide}>
        
        {/* LAYER 1: The Glass Background (Independent) */}
        <div className="glass-background-layer" />

        {/* LAYER 2: The Content (Foreground) */}
        <Box className="player-content-layer">
            
            {/* SECTION 1: CONTEXT (Left) */}
            <Box className="player-section left">
               {currentSpeaker && (
                 <Typography variant="caption" sx={{ 
                     color: 'var(--accent-primary)', 
                     fontWeight: 700, 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: 0.5 
                 }}>
                    <Box className={`pulse-dot-small ${isPlaying ? 'active' : ''}`} sx={{ bgcolor: 'var(--accent-primary)' }} />
                    {currentSpeaker.name}
                 </Typography>
               )}
               <Typography variant="subtitle2" sx={{ 
                   fontWeight: 600, 
                   whiteSpace: 'nowrap', 
                   overflow: 'hidden', 
                   textOverflow: 'ellipsis',
                   maxWidth: '100%',
                   lineHeight: 1.2,
                   color: 'var(--text-primary)'
               }}>
                 {isLoading ? "Buffering..." : currentArticle?.headline}
               </Typography>
            </Box>

            {/* SECTION 2: CONTROLS (Center) */}
            <Box className="player-section center">
                <Stack direction="row" alignItems="center" spacing={isMobile ? 1 : 2} sx={{ mb: 0 }}>
                    
                    <IconButton size="small" onClick={handleControl(playPrevious)} sx={{ color: 'var(--text-primary)' }}>
                        <SkipPreviousRounded />
                    </IconButton>

                    {/* FAB CONTAINER */}
                    <Box className="fab-container">
                        <div className={`pulse-ring ${pulseClass}`} />
                        
                        <Fab 
                            size={isMobile ? "small" : "medium"} 
                            onClick={handleControl(isPaused ? resume : pause)}
                            disableRipple={true} 
                            sx={{ 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
                                zIndex: 10,
                                width: isMobile ? 40 : 48,
                                height: isMobile ? 40 : 48,
                                minHeight: 'auto',
                                bgcolor: 'var(--accent-primary)',
                                color: 'var(--bg-primary)', 
                                '&:hover': { bgcolor: 'var(--accent-hover)' },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div className="morph-container">
                                <div className={`morph-icon ${isPaused ? 'visible' : 'hidden'}`}>
                                    <PlayArrowRounded fontSize="medium" />
                                </div>
                                <div className={`morph-icon ${!isPaused ? 'visible' : 'hidden'}`}>
                                    <PauseRounded fontSize="medium" />
                                </div>
                            </div>
                        </Fab>
                    </Box>

                    <IconButton size="small" onClick={handleControl(playNext)} sx={{ color: 'var(--text-primary)' }}>
                        <SkipNextRounded />
                    </IconButton>
                </Stack>
                
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', mt: 0 }}>
                    <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {formatTime(dragTime)}
                    </Typography>
                    <Slider
                        size="small"
                        value={dragTime}
                        min={0}
                        max={duration || 100}
                        onChange={handleSeekChange}
                        onChangeCommitted={handleSeekEnd}
                        onMouseDown={handleSeekStart}
                        onTouchStart={handleSeekStart}
                        sx={{
                            color: 'var(--accent-primary)',
                            height: 3,
                            padding: '6px 0', 
                            '& .MuiSlider-thumb': {
                                width: 8,
                                height: 8,
                                transition: '0.2s',
                                '&:hover, &.Mui-focusVisible': { boxShadow: `0px 0px 0px 6px var(--accent-glow)` }, 
                                '&.Mui-active': { width: 12, height: 12 },
                            },
                            '& .MuiSlider-rail': { opacity: 0.3, backgroundColor: 'var(--text-secondary)' },
                        }}
                    />
                    <Typography variant="caption" sx={{ minWidth: 35, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {formatTime(duration)}
                    </Typography>
                </Stack>
            </Box>

            {/* SECTION 3: UTILITY (Right) */}
            <Box className="player-section right">
                <Tooltip title="Playback Speed">
                    <IconButton onClick={handleSpeedClick} size="small" sx={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        border: '1px solid',
                        borderColor: 'var(--border-color)', 
                        borderRadius: 2,
                        px: 1,
                        py: 0.5,
                        width: 'auto',
                        mr: 1,
                        color: 'var(--text-secondary)'
                    }}>
                       {playbackRate}x
                    </IconButton>
                </Tooltip>
                
                {/* Desktop: Minimize & Stop */}
                {!isMobile && (
                    <>
                        <Tooltip title="Minimize Player">
                            <IconButton onClick={handleMinimize} size="small" sx={{ color: 'var(--text-secondary)', ml: 1 }}>
                                <RemoveRounded fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Stop Radio">
                            <IconButton onClick={handleStop} size="small" sx={{ color: 'var(--color-error)', ml: 1 }}>
                                <StopRounded fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                )}

                {/* Mobile: Minimize (X) */}
                {isMobile && (
                    <IconButton onClick={handleMinimize} size="small" sx={{ color: 'var(--text-secondary)' }}>
                        <CloseRounded fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default GlobalPlayerBar;
