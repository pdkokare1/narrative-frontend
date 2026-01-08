import React, { useState, useEffect, useRef } from 'react';
import { useRadio } from '../context/RadioContext';
import useHaptic from '../hooks/useHaptic';
import useIsMobile from '../hooks/useIsMobile';
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
  CloseRounded
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

  const vibrate = useHaptic();
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const autoHideRef = useRef<NodeJS.Timeout | null>(null);

  // --- AUTO-HIDE LOGIC ---
  const resetAutoHide = () => {
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
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

  if (!isVisible || !playerOpen) return null;

  // --- HANDLERS ---
  const handleControl = (fn: () => void) => () => { 
      vibrate(); 
      fn(); 
      resetAutoHide(); 
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
      <Box className="global-player-bar" onClick={resetAutoHide}>
        
        {/* SECTION 1: CONTEXT (Left) */}
        <Box className="player-section left">
           {currentSpeaker && (
             <Typography variant="caption" sx={{ 
                 color: 'var(--accent-primary)', // FIXED: Matches theme Gold/Bronze
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
               color: 'var(--text-primary)' // FIXED: High contrast text from variables
           }}>
             {isLoading ? "Buffering..." : currentArticle?.headline}
           </Typography>
        </Box>

        {/* SECTION 2: CONTROLS (Center) */}
        <Box className="player-section center">
            <Stack direction="row" alignItems="center" spacing={isMobile ? 1 : 2} sx={{ mb: 0 }}>
                
                {/* PREVIOUS Button */}
                <IconButton size="small" onClick={handleControl(playPrevious)} sx={{ color: 'var(--text-primary)' }}>
                    <SkipPreviousRounded />
                </IconButton>

                {/* PLAY/PAUSE FAB */}
                <Fab 
                    size={isMobile ? "small" : "medium"} 
                    onClick={handleControl(isPaused ? resume : pause)}
                    sx={{ 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
                        zIndex: 10,
                        width: isMobile ? 40 : 48,
                        height: isMobile ? 40 : 48,
                        minHeight: 'auto',
                        // FIXED: Uses Theme Variables for Adaptive Color
                        bgcolor: 'var(--accent-primary)',
                        color: 'var(--bg-primary)', 
                        '&:hover': { bgcolor: 'var(--accent-hover)' }
                    }}
                >
                    {isPaused ? <PlayArrowRounded fontSize="medium" /> : <PauseRounded fontSize="medium" />}
                </Fab>

                {/* NEXT Button */}
                <IconButton size="small" onClick={handleControl(playNext)} sx={{ color: 'var(--text-primary)' }}>
                    <SkipNextRounded />
                </IconButton>
            </Stack>
            
            {/* Scrubber Row */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', mt: 0.5 }}>
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
                        color: 'var(--accent-primary)', // FIXED: Slider matches theme
                        height: 3,
                        padding: '10px 0', 
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
                    borderColor: 'var(--border-color)', // FIXED: Adaptive border
                    borderRadius: 2,
                    px: 1,
                    py: 0.5,
                    width: 'auto',
                    mr: 1,
                    color: 'var(--text-secondary)' // FIXED: Adaptive text
                }}>
                   {playbackRate}x
                </IconButton>
            </Tooltip>
            
            {isMobile && (
                <IconButton onClick={() => { vibrate(); closePlayer(); }} size="small" sx={{ color: 'var(--text-secondary)' }}>
                    <CloseRounded fontSize="small" />
                </IconButton>
            )}
        </Box>

      </Box>
    </Fade>
  );
};

export default GlobalPlayerBar;
