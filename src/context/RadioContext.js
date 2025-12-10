// src/context/RadioContext.js
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const RadioContext = createContext();

export const useRadio = () => useContext(RadioContext);

// --- PERSONAS ---
const VOICES = {
  ANCHOR: { id: 'SmLgXu8CcwHJvjiqq2rw', name: 'Mira', role: 'The Anchor' },
  ANALYST: { id: 'NnNA7MrsdZZzXTNJ4u8q', name: 'Kabir', role: 'The Analyst' },
  CURATOR: { id: 'AwEl6phyzczpCHHDxyfO', name: 'Tara', role: 'The Curator' }
};

export const RadioProvider = ({ children }) => {
  // --- STATE ---
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentArticle, setCurrentArticle] = useState(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- NEW: Playback State ---
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

  // --- HELPER: Select Persona ---
  const getPersonaForCategory = (category) => {
      if (!category) return VOICES.ANCHOR;
      const cat = category.toLowerCase();
      if (cat.includes('economy') || cat.includes('business') || cat.includes('tech') || cat.includes('science')) return VOICES.ANALYST;
      if (cat.includes('entertainment') || cat.includes('lifestyle') || cat.includes('culture') || cat.includes('human')) return VOICES.CURATOR;
      return VOICES.ANCHOR;
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
      
      // Reset time for new track
      setCurrentTime(0);
      setDuration(0);

      try {
          // 1. Setup Speaker
          const persona = getPersonaForCategory(article.category);
          setCurrentSpeaker(persona);

          // 2. Fetch Audio (Cache First)
          const textToSpeak = `${article.headline}. ${article.summary}`;
          const response = await api.getAudio(textToSpeak, persona.id, article._id);

          if (response.data && response.data.audioUrl) {
              const audio = audioRef.current;
              audio.src = response.data.audioUrl;
              audio.playbackRate = playbackRate; // Maintain speed across tracks
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
              
              // Set playback state
              navigator.mediaSession.playbackState = "playing";
          }

      } catch (error) {
          console.error("Radio Error:", error);
          setIsLoading(false);
          setIsPlaying(false);
      }
  }, [playbackRate]); // Re-run if playbackRate logic changes (rare)

  // --- QUEUE LOGIC ---
  const playNext = useCallback(() => {
      if (currentIndex + 1 < playlist.length) {
          setCurrentIndex(prev => prev + 1);
      } else {
          stop(); // End of playlist
      }
  }, [currentIndex, playlist]);

  const playPrevious = useCallback(() => {
      // Standard Podcast Logic: 
      // If > 3 seconds in, restart track. If at start, go to previous track.
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

  // --- NEW: Advanced Controls (Scrubbing & Speed) ---
  
  const seekTo = useCallback((time) => {
      if (audioRef.current) {
          // Clamp time between 0 and duration
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

  // --- EVENT LISTENERS & LOCK SCREEN HANDLERS ---
  useEffect(() => {
      const audio = audioRef.current;

      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleDurationChange = () => setDuration(audio.duration);
      const handleLoadStart = () => setIsLoading(true);
      const handlePlaying = () => { setIsLoading(false); setIsPlaying(true); };
      
      const handleEnded = () => {
          setIsPlaying(false);
          setIsPaused(false);
          startAutoplayCountdown();
      };

      // Add DOM Listeners
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('ended', handleEnded);

      // --- Setup Lock Screen / Hardware Media Keys ---
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
  }, [resume, pause, playNext, playPrevious, startAutoplayCountdown]);

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
          
          // New State
          currentTime,
          duration,
          playbackRate,

          // Actions
          startRadio,
          playSingle,
          stop,
          pause,
          resume,
          playNext, // Manually calling next (Skip)
          playPrevious, // New
          seekTo, // New
          changeSpeed, // New
          cancelAutoplay
      }}>
          {children}
      </RadioContext.Provider>
  );
};
