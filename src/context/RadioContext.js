// src/context/RadioContext.js
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const RadioContext = createContext();

export const useRadio = () => useContext(RadioContext);

// --- PERSONAS ---
const VOICES = {
  ANCHOR: { id: 'SmLgXu8CcwHJvjiqq2rw', name: 'Mira', role: 'The Anchor' },
  ANALYST: { id: 'czw3FmTwixwtnkpOKXZ0', name: 'Rajat', role: 'The Analyst' }, 
  CURATOR: { id: 'AwEl6phyzczpCHHDxyfO', name: 'Shubhi', role: 'The Curator' }
};

export const RadioProvider = ({ children }) => {
  // --- STATE ---
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentArticle, setCurrentArticle] = useState(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Playback State
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [isVisible, setIsVisible] = useState(false); 

  // Autoplay Timer
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [autoplayTimer, setAutoplayTimer] = useState(0);

  // Refs
  const audioRef = useRef(new Audio());
  const timerIntervalRef = useRef(null);
  const hasPrefetchedRef = useRef(false); 

  // --- HELPER: Select Persona ---
  const getPersonaForCategory = (category) => {
      if (!category) return VOICES.ANCHOR;
      const cat = category.toLowerCase();
      if (cat.includes('economy') || cat.includes('business') || cat.includes('tech') || cat.includes('science') || cat.includes('finance') || cat.includes('crypto')) return VOICES.ANALYST;
      if (cat.includes('entertainment') || cat.includes('lifestyle') || cat.includes('culture') || cat.includes('human') || cat.includes('gaming') || cat.includes('sports')) return VOICES.CURATOR;
      return VOICES.ANCHOR;
  };

  // --- HELPER: Format Text for Audio (Tone & Pause) ---
  const prepareAudioText = (headline, summary) => {
      // 1. Clean the headline: Remove trailing periods to prevent "falling" tone.
      // This often keeps the pitch slightly higher/suspended.
      const cleanHeadline = headline.replace(/[.]+$/, '');

      // 2. The "Pause Bridge": 
      // We use a double-dash for a natural clause break, plus an explicit break tag if supported, 
      // plus a newline. This forces the AI to take a solid breath.
      // Note: ElevenLabs handles "..." or " - " as a pause. 
      // We structure it to sound like: "HEADLINE [pause] BODY"
      
      return `${cleanHeadline} ... \n\n ${summary}`;
  };

  // --- CORE: Play Audio ---
  const playArticle = useCallback(async (article) => {
      if (!article) return;

      setIsLoading(true);
      setIsPlaying(true);
      setIsPaused(false);
      setIsWaitingForNext(false);
      setCurrentArticle(article);
      setIsVisible(true);
      
      // Reset state for new track
      setCurrentTime(0);
      setDuration(0);
      hasPrefetchedRef.current = false; 

      try {
          // 1. Setup Speaker
          const persona = getPersonaForCategory(article.category);
          setCurrentSpeaker(persona);

          // 2. Fetch Audio (Cache First)
          // --- UPDATED: Use the new text formatter ---
          const textToSpeak = prepareAudioText(article.headline, article.summary);
          
          const response = await api.getAudio(textToSpeak, persona.id, article._id);

          if (response.data && response.data.audioUrl) {
              const audio = audioRef.current;
              audio.src = response.data.audioUrl;
              audio.playbackRate = playbackRate; 
              await audio.play();
          } else {
              throw new Error("No audio URL");
          }

          // 3. Media Session (Lock Screen Metadata)
          if ('mediaSession' in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                  title: article.headline,
                  artist: `The Gamut • ${persona.name}`,
                  artwork: article.imageUrl ? [{ src: article.imageUrl, sizes: '512x512', type: 'image/jpeg' }] : []
              });
              navigator.mediaSession.playbackState = "playing";
          }

      } catch (error) {
          console.error("Radio Error:", error);
          setIsLoading(false);
          setIsPlaying(false);
      }
  }, [playbackRate]);

  // --- QUEUE LOGIC ---
  const playNext = useCallback(() => {
      if (currentIndex + 1 < playlist.length) {
          setCurrentIndex(prev => prev + 1);
      } else {
          stop(); 
      }
  }, [currentIndex, playlist]);

  const playPrevious = useCallback(() => {
      if (audioRef.current.currentTime > 3) {
          audioRef.current.currentTime = 0;
          return;
      }
      if (currentIndex - 1 >= 0) {
          setCurrentIndex(prev => prev - 1);
      }
  }, [currentIndex]);

  // Trigger play when index changes
  useEffect(() => {
      if (currentIndex >= 0 && playlist[currentIndex]) {
          playArticle(playlist[currentIndex]);
      }
  }, [currentIndex, playlist, playArticle]);

  // --- CONTROLS ---
  const stop = useCallback(() => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      setIsPlaying(false);
      setIsPaused(false);
      setIsWaitingForNext(false);
      setIsLoading(false);
      setIsVisible(false);
      setCurrentArticle(null);
      setCurrentIndex(-1);
      setPlaylist([]);
      setCurrentTime(0);
      setDuration(0);
      hasPrefetchedRef.current = false;
      
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "none";
  }, []);

  const pause = useCallback(() => {
      audioRef.current.pause();
      setIsPaused(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
  }, []);

  const resume = useCallback(() => {
      audioRef.current.play();
      setIsPaused(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
  }, []);

  const seekTo = useCallback((time) => {
      if (audioRef.current) {
          const safeTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
          audioRef.current.currentTime = safeTime;
          setCurrentTime(safeTime);
      }
  }, []);

  const changeSpeed = useCallback((newSpeed) => {
      if (audioRef.current) {
          audioRef.current.playbackRate = newSpeed;
          setPlaybackRate(newSpeed);
      }
  }, []);

  // --- PUBLIC API ---
  const startRadio = useCallback((articles, startIndex = 0) => {
      setPlaylist(articles);
      setCurrentIndex(startIndex); 
  }, []);

  const playSingle = useCallback((article) => {
      setPlaylist([article]);
      setCurrentIndex(0);
  }, []);

  // --- AUTOPLAY COUNTDOWN ---
  const startAutoplayCountdown = useCallback(() => {
      if (currentIndex >= playlist.length - 1) {
          stop();
          return;
      }
      setIsPlaying(false);
      setIsWaitingForNext(true);
      setAutoplayTimer(5);

      timerIntervalRef.current = setInterval(() => {
          setAutoplayTimer((prev) => {
              if (prev <= 1) {
                  clearInterval(timerIntervalRef.current);
                  setIsWaitingForNext(false);
                  setCurrentIndex(idx => idx + 1); 
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  }, [currentIndex, playlist, stop]);

  const cancelAutoplay = useCallback(() => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stop();
  }, [stop]);

  // --- EVENT LISTENERS & PRE-FETCHING ---
  useEffect(() => {
      const audio = audioRef.current;

      const handleTimeUpdate = () => {
          const cTime = audio.currentTime;
          const dur = audio.duration;
          setCurrentTime(cTime);

          // --- SMART PRE-FETCH LOGIC ---
          if (dur > 0 && (dur - cTime) < 15 && !hasPrefetchedRef.current && playlist[currentIndex + 1]) {
              hasPrefetchedRef.current = true; 
              
              const nextArticle = playlist[currentIndex + 1];
              const nextPersona = getPersonaForCategory(nextArticle.category);
              
              // Apply the same text formatting for the pre-fetch
              const nextText = prepareAudioText(nextArticle.headline, nextArticle.summary);
              
              console.log(`🎧 Pre-fetching audio for next track: "${nextArticle.headline}"`);
              api.prefetchAudio(nextText, nextPersona.id, nextArticle._id);
          }
      };

      const handleDurationChange = () => setDuration(audio.duration);
      const handleLoadStart = () => setIsLoading(true);
      const handlePlaying = () => { setIsLoading(false); setIsPlaying(true); };
      
      const handleEnded = () => {
          setIsPlaying(false);
          setIsPaused(false);
          startAutoplayCountdown();
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('ended', handleEnded);

      if ('mediaSession' in navigator) {
          try {
              navigator.mediaSession.setActionHandler('play', resume);
              navigator.mediaSession.setActionHandler('pause', pause);
              navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
              navigator.mediaSession.setActionHandler('nexttrack', playNext);
              navigator.mediaSession.setActionHandler('seekto', (details) => {
                  if (details.seekTime && audio) {
                      audio.currentTime = details.seekTime;
                  }
              });
          } catch (e) {
              console.warn("Media Session API warning:", e);
          }
      }

      return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('durationchange', handleDurationChange);
          audio.removeEventListener('loadstart', handleLoadStart);
          audio.removeEventListener('playing', handlePlaying);
          audio.removeEventListener('ended', handleEnded);
          
          if ('mediaSession' in navigator) {
              navigator.mediaSession.setActionHandler('play', null);
              navigator.mediaSession.setActionHandler('pause', null);
              navigator.mediaSession.setActionHandler('previoustrack', null);
              navigator.mediaSession.setActionHandler('nexttrack', null);
              navigator.mediaSession.setActionHandler('seekto', null);
          }
      };
  }, [resume, pause, playNext, playPrevious, startAutoplayCountdown, playlist, currentIndex]);

  return (
      <RadioContext.Provider value={{
          currentArticle,
          currentSpeaker,
          isPlaying,
          isPaused,
          isLoading,
          isVisible,
          isWaitingForNext,
          autoplayTimer,
          
          currentTime,
          duration,
          playbackRate,

          startRadio,
          playSingle,
          stop,
          pause,
          resume,
          playNext, 
          playPrevious, 
          seekTo, 
          changeSpeed, 
          cancelAutoplay
      }}>
          {children}
      </RadioContext.Provider>
  );
};
