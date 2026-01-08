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
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                    Up Next in {autoplayTimer}s...
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={((autoplayTimer || 0)/5)*100} 
                    sx={{ height: 4, borderRadius: 2, mt: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }} 
                />
            </Box>
            <Stack direction="row" spacing={1}>
                <Fab size="small" variant="extended" color="primary" onClick={handleControl(playNext)}>
                    <PlayArrowRounded sx={{ mr: 1, fontSize: 18 }} /> Play Now
                </Fab>
                <IconButton size="small" onClick={handleControl(cancelAutoplay)} sx={{ color: 'text.secondary' }}>
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
             <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box className={`pulse-dot-small ${isPlaying ? 'active' : ''}`} />
                {currentSpeaker.name}
             </Typography>
           )}
           <Typography variant="subtitle2" sx={{ 
               fontWeight: 600, 
               whiteSpace: 'nowrap', 
               overflow: 'hidden', 
               textOverflow: 'ellipsis',
               maxWidth: '100%',
               lineHeight: 1.2
           }}>
             {isLoading ? "Buffering..." : currentArticle?.headline}
           </Typography>
        </Box>

        {/* SECTION 2: CONTROLS (Center) */}
        <Box className="player-section center">
            <Stack direction="row" alignItems="center" spacing={isMobile ? 1 : 2} sx={{ mb: 0.5 }}>
                <IconButton size="small" onClick={handleControl(playPrevious)} sx={{ color: 'text.secondary' }}>
                    <SkipPreviousRounded />
                </IconButton>

                <Fab 
                    size={isMobile ? "small" : "medium"} 
                    color="primary" 
                    onClick={handleControl(isPaused ? resume : pause)}
                    sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10 }}
                >
                    {isPaused ? <PlayArrowRounded fontSize="large" /> : <PauseRounded fontSize="large" />}
                </Fab>

                <IconButton size="small" onClick={handleControl(playNext)} sx={{ color: 'text.secondary' }}>
                    <SkipNextRounded />
                </IconButton>
            </Stack>
            
            {/* Scrubber Row */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35, textAlign: 'right' }}>
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
                        color: theme.palette.mode === 'dark' ? '#fff' : 'primary.main',
                        height: 4,
                        '& .MuiSlider-thumb': {
                            width: 8,
                            height: 8,
                            transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                            '&:before': { boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)' },
                            '&:hover, &.Mui-focusVisible': { boxShadow: `0px 0px 0px 8px ${'rgba(255,255,255,0.16)'}` },
                            '&.Mui-active': { width: 12, height: 12 },
                        },
                        '& .MuiSlider-rail': { opacity: 0.28 },
                    }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
                    {formatTime(duration)}
                </Typography>
            </Stack>
        </Box>

        {/* SECTION 3: UTILITY (Right) */}
        <Box className="player-section right">
            <Tooltip title="Playback Speed">
                <IconButton onClick={handleSpeedClick} size="small" sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 2,
                    px: 1,
                    width: 'auto',
                    mr: 1
                }}>
                   {playbackRate}x
                </IconButton>
            </Tooltip>
            
            {isMobile && (
                <IconButton onClick={() => { vibrate(); closePlayer(); }} size="small">
                    <CloseRounded fontSize="small" />
                </IconButton>
            )}
        </Box>

      </Box>
    </Fade>
  );
};

export default GlobalPlayerBar;
