// src/context/RadioContext.js
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { VOICE_ASSETS } from '../utils/VoiceAssets'; 

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
  const getPersonaForCategory = useCallback((category) => {
      if (!category) return VOICES.ANCHOR;
      const cat = category.toLowerCase();
      if (cat.includes('economy') || cat.includes('business') || cat.includes('tech') || cat.includes('science') || cat.includes('finance') || cat.includes('crypto')) return VOICES.ANALYST;
      if (cat.includes('entertainment') || cat.includes('lifestyle') || cat.includes('culture') || cat.includes('human') || cat.includes('gaming') || cat.includes('sports')) return VOICES.CURATOR;
      return VOICES.ANCHOR;
  }, []);

  // --- HELPER: Format Text for Audio ---
  const prepareAudioText = (headline, summary) => {
      const cleanHeadline = headline.replace(/[.]+$/, '');
      return `${cleanHeadline} ... \n\n ${summary}`;
  };

  // --- HELPER: Select Greeting (Smart Start) ---
  const getGreetingTrack = (firstArticle) => {
      const lastSession = localStorage.getItem('lastRadioSession');
      const now = Date.now();
      const THIRTY_MINS = 30 * 60 * 1000;

      // Update session time
      localStorage.setItem('lastRadioSession', now);

      // 1. Check Frequency (Skip if listened recently)
      if (lastSession && (now - lastSession < THIRTY_MINS)) {
          return null; 
      }

      // 2. Identify Host
      const persona = getPersonaForCategory(firstArticle.category);
      const hostKey = persona.name.toUpperCase(); // MIRA, RAJAT, SHUBHI

      // 3. Identify Time of Day
      const hour = new Date().getHours();
      let timeKey = 'MORNING';
      if (hour >= 12 && hour < 17) timeKey = 'AFTERNOON';
      if (hour >= 17 || hour < 5) timeKey = 'EVENING';

      // 4. Select Random Clip
      const clips = VOICE_ASSETS.OPENERS[hostKey]?.[timeKey];
      if (!clips || clips.length === 0) return null;

      const randomClip = clips[Math.floor(Math.random() * clips.length)];

      // 5. Create "Ghost Article" for the Greeting
      return {
          _id: 'greeting_track',
          headline: `${timeKey === 'MORNING' ? 'Good Morning' : timeKey === 'AFTERNOON' ? 'Good Afternoon' : 'Good Evening'} from ${persona.name}`,
          summary: "Session Opener",
          isSystemAudio: true, 
          audioUrl: randomClip, 
          speaker: persona
      };
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
      
      // Reset state
      setCurrentTime(0);
      setDuration(0);
      hasPrefetchedRef.current = false; 

      try {
          // 1. Setup Speaker
          const persona = article.isSystemAudio ? article.speaker : getPersonaForCategory(article.category);
          setCurrentSpeaker(persona);

          // 2. Play Audio
          const audio = audioRef.current;
          
          if (article.isSystemAudio && article.audioUrl) {
              // Direct URL for Greetings
              audio.src = article.audioUrl;
              
              // --- FIX: Force Slower Speed for Greetings ---
              // 0.85x speed makes it sound more relaxed and conversational
              audio.playbackRate = 0.85; 
          } else {
              // Standard News Article
              const textToSpeak = prepareAudioText(article.headline, article.summary);
              const response = await api.getAudio(textToSpeak, persona.id, article._id);
              if (response.data && response.data.audioUrl) {
                  audio.src = response.data.audioUrl;
                  // Use standard playback rate (usually 1.0 or user pref)
                  audio.playbackRate = playbackRate; 
              } else {
                  throw new Error("No audio URL");
              }
          }

          await audio.play();

          // 3. Media Session
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
          if (article.isSystemAudio) {
              playNext(); // Skip broken greeting
          } else {
              setIsLoading(false);
              setIsPlaying(false);
          }
      }
  }, [playbackRate, getPersonaForCategory]);

  // --- QUEUE LOGIC ---
  const playNext = useCallback(() => {
      setCurrentIndex(prevIndex => prevIndex + 1);
  }, []);

  const playPrevious = useCallback(() => {
      if (audioRef.current.currentTime > 3) {
          audioRef.current.currentTime = 0;
          return;
      }
      setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  // Trigger play when index changes
  useEffect(() => {
      if (currentIndex >= 0 && playlist.length > 0) {
          if (currentIndex < playlist.length) {
              playArticle(playlist[currentIndex]);
          } else {
              stop(); // End of playlist
          }
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
      if (!articles || articles.length === 0) return;

      // 1. Get appropriate Greeting for the FIRST article's host
      const firstArticle = articles[startIndex];
      const greetingTrack = getGreetingTrack(firstArticle);

      let newPlaylist = [];
      let newStartIndex = 0;

      if (greetingTrack) {
          // Play Greeting -> Then the requested article
          newPlaylist = [greetingTrack, ...articles.slice(startIndex)];
          newStartIndex = 0; 
      } else {
          // Just start playing
          newPlaylist = articles.slice(startIndex);
          newStartIndex = 0;
      }

      setPlaylist(newPlaylist);
      setCurrentIndex(newStartIndex); 
  }, [getPersonaForCategory]);

  const playSingle = useCallback((article) => {
      setPlaylist([article]);
      setCurrentIndex(0);
  }, []);

  // --- AUTOPLAY COUNTDOWN ---
  const startAutoplayCountdown = useCallback(() => {
      setIsPlaying(false);
      setIsWaitingForNext(true);
      setAutoplayTimer(5);

      timerIntervalRef.current = setInterval(() => {
          setAutoplayTimer((prev) => {
              if (prev <= 1) {
                  clearInterval(timerIntervalRef.current);
                  setIsWaitingForNext(false);
                  playNext(); 
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  }, [playNext]);

  const cancelAutoplay = useCallback(() => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stop();
  }, [stop]);

  // --- EVENT LISTENERS ---
  useEffect(() => {
      const audio = audioRef.current;

      const handleTimeUpdate = () => {
          const cTime = audio.currentTime;
          const dur = audio.duration;
          setCurrentTime(cTime);

          // Smart Pre-fetch
          if (playlist.length > 0 && currentIndex + 1 < playlist.length) {
              const nextItem = playlist[currentIndex + 1];
              
              if (!nextItem.isSystemAudio && dur > 0 && (dur - cTime) < 15 && !hasPrefetchedRef.current) {
                  hasPrefetchedRef.current = true; 
                  
                  const nextPersona = getPersonaForCategory(nextItem.category);
                  const nextText = prepareAudioText(nextItem.headline, nextItem.summary);
                  api.prefetchAudio(nextText, nextPersona.id, nextItem._id);
              }
          }
      };

      const handleDurationChange = () => setDuration(audio.duration);
      const handleLoadStart = () => setIsLoading(true);
      const handlePlaying = () => { setIsLoading(false); setIsPlaying(true); };
      
      const handleEnded = () => {
          setIsPlaying(false);
          setIsPaused(false);
          if (currentArticle && currentArticle.isSystemAudio) {
              playNext(); // Skip countdown for system audio
          } else {
              startAutoplayCountdown();
          }
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
          } catch (e) { console.warn("Media Session API warning:", e); }
      }

      return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('durationchange', handleDurationChange);
          audio.removeEventListener('loadstart', handleLoadStart);
          audio.removeEventListener('playing', handlePlaying);
          audio.removeEventListener('ended', handleEnded);
      };
  }, [resume, pause, playNext, playPrevious, startAutoplayCountdown, playlist, currentIndex, currentArticle, getPersonaForCategory]);

  return (
      <RadioContext.Provider value={{
          currentArticle, currentSpeaker, isPlaying, isPaused, isLoading, isVisible,
          isWaitingForNext, autoplayTimer, currentTime, duration, playbackRate,
          startRadio, playSingle, stop, pause, resume, playNext, playPrevious, seekTo, changeSpeed, cancelAutoplay
      }}>
          {children}
      </RadioContext.Provider>
  );
};
