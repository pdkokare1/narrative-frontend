// src/context/RadioContext.js
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { VOICE_ASSETS } from '../utils/VoiceAssets'; 
import { useAuth } from './AuthContext'; 

const RadioContext = createContext();

export const useRadio = () => useContext(RadioContext);

// --- PERSONAS ---
const VOICES = {
  ANCHOR: { id: 'SmLgXu8CcwHJvjiqq2rw', name: 'Mira', role: 'The Anchor' },
  ANALYST: { id: 'SZQ4R1VKS2t6wmBJpK5H', name: 'Rajat', role: 'The Analyst' }, 
  CURATOR: { id: '2n8AzqIsQUPMvb1OgO72', name: 'Shubhi', role: 'The Curator' }
};

export const RadioProvider = ({ children }) => {
  const { user } = useAuth(); 

  // --- STATE ---
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentArticle, setCurrentArticle] = useState(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [isVisible, setIsVisible] = useState(false); 

  // Refs
  const audioRef = useRef(new Audio());
  const hasPrefetchedRef = useRef(false); 

  // --- HELPER: Select Persona ---
  const getPersonaForCategory = useCallback((category) => {
      if (!category) return VOICES.ANCHOR;
      const cat = category.toLowerCase();
      if (cat.includes('economy') || cat.includes('business') || cat.includes('tech') || cat.includes('science') || cat.includes('finance') || cat.includes('crypto')) return VOICES.ANALYST;
      if (cat.includes('entertainment') || cat.includes('lifestyle') || cat.includes('culture') || cat.includes('human') || cat.includes('gaming') || cat.includes('sports')) return VOICES.CURATOR;
      return VOICES.ANCHOR;
  }, []);

  // --- HELPER: Get Base Speed per Host ---
  const getBaseSpeed = (personaName) => {
      if (!personaName) return 0.9;
      switch (personaName) {
          case 'Rajat': return 1.0; 
          case 'Shubhi': return 1.1;
          case 'Mira': return 0.9;
          default: return 0.9;
      }
  };

  // --- HELPER: Format Text for Audio ---
  const prepareAudioText = (headline, summary) => {
      const cleanHeadline = headline.replace(/[.]+$/, '');
      return `${cleanHeadline}. . . . . . ${summary}`;
  };

  // --- HELPER: Select Greeting (Smart Start) ---
  const getGreetingTrack = (firstArticle) => {
      const userId = user?.uid || 'guest';
      const storageKey = `lastRadioSession_${userId}`;
      const lastSession = localStorage.getItem(storageKey);
      const now = Date.now();
      const THIRTY_MINS = 30 * 60 * 1000;

      localStorage.setItem(storageKey, now);

      if (lastSession && (now - lastSession < THIRTY_MINS)) {
          return null; 
      }

      const persona = getPersonaForCategory(firstArticle.category);
      const hostKey = persona.name.toUpperCase(); 
      const hour = new Date().getHours();
      let timeKey = 'MORNING';
      if (hour >= 12 && hour < 17) timeKey = 'AFTERNOON';
      if (hour >= 17 || hour < 5) timeKey = 'EVENING';

      const clips = VOICE_ASSETS.OPENERS[hostKey]?.[timeKey];
      if (!clips || clips.length === 0) return null;

      const randomClip = clips[Math.floor(Math.random() * clips.length)];

      return {
          _id: 'greeting_track',
          headline: `${timeKey === 'MORNING' ? 'Good Morning' : timeKey === 'AFTERNOON' ? 'Good Afternoon' : 'Good Evening'} from ${persona.name}`,
          summary: "Session Opener",
          isSystemAudio: true, 
          audioUrl: randomClip, 
          speaker: persona
      };
  };

  // --- HELPER: Inject Segues ---
  const injectSegues = useCallback((rawArticles) => {
      const processed = [];
      for (let i = 0; i < rawArticles.length; i++) {
          processed.push(rawArticles[i]);
          if (i < rawArticles.length - 1) {
              const currentItem = rawArticles[i];
              const nextItem = rawArticles[i+1];
              if (currentItem.isSystemAudio || nextItem.isSystemAudio) continue;

              const currentHost = getPersonaForCategory(currentItem.category);
              const nextHost = getPersonaForCategory(nextItem.category);

              if (currentHost.name === nextHost.name) {
                  const hostKey = currentHost.name.toUpperCase();
                  const segues = VOICE_ASSETS.SEGUES?.[hostKey];
                  if (segues && segues.length > 0) {
                      const randomSegue = segues[Math.floor(Math.random() * segues.length)];
                      processed.push({
                          _id: `segue_${currentItem._id}_to_${nextItem._id}`,
                          headline: "Transition",
                          summary: "Segue",
                          isSystemAudio: true, // Mark as system audio
                          audioUrl: randomSegue,
                          speaker: currentHost, 
                          category: 'System'
                      });
                  }
              }
          }
      }
      return processed;
  }, [getPersonaForCategory]);

  // --- CORE: Play Audio ---
  const playArticle = useCallback(async (article) => {
      if (!article) return;

      setIsLoading(true);
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentArticle(article);
      setIsVisible(true);
      
      setCurrentTime(0);
      setDuration(0);
      hasPrefetchedRef.current = false; 

      try {
          const persona = article.isSystemAudio ? article.speaker : getPersonaForCategory(article.category);
          setCurrentSpeaker(persona);

          const audio = audioRef.current;
          
          if (article.isSystemAudio && article.audioUrl) {
              audio.src = article.audioUrl;
          } else {
              const textToSpeak = prepareAudioText(article.headline, article.summary);
              const response = await api.getAudio(textToSpeak, persona.id, article._id);
              if (response.data && response.data.audioUrl) {
                  audio.src = response.data.audioUrl;
              } else {
                  throw new Error("No audio URL");
              }
          }

          const baseSpeed = getBaseSpeed(persona.name);
          const finalSpeed = baseSpeed * playbackRate;
          audio.playbackRate = finalSpeed;
          
          await audio.play();

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
          playNext(); 
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

  // --- SMART PLAYBACK TRIGGER ---
  useEffect(() => {
      if (currentIndex >= 0 && playlist.length > 0) {
          if (currentIndex < playlist.length) {
              const nextTrack = playlist[currentIndex];
              
              // === SEGUE DELAY LOGIC ===
              // If the track we are about to play is a SEGUE, wait 1s.
              // If it's a News Article or Greeting, play immediately (0ms).
              const delay = (nextTrack.isSystemAudio && nextTrack.summary === "Segue") ? 1000 : 0;
              
              if (delay > 0) {
                  // Set loading state during the pause so UI doesn't look broken
                  setIsLoading(true);
                  const timer = setTimeout(() => {
                      playArticle(nextTrack);
                  }, delay);
                  return () => clearTimeout(timer);
              } else {
                  playArticle(nextTrack);
              }
          } else {
              stop(); 
          }
      }
  }, [currentIndex, playlist, playArticle]);

  // --- CONTROLS ---
  const stop = useCallback(() => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
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

  const seekTo = useCallback((time) => {
      if (audioRef.current) {
          audioRef.current.currentTime = time;
          setCurrentTime(time);
      }
  }, []);

  const changeSpeed = useCallback((newSpeed) => {
      setPlaybackRate(newSpeed);
      if (audioRef.current && currentSpeaker) {
          const baseSpeed = getBaseSpeed(currentSpeaker.name);
          audioRef.current.playbackRate = baseSpeed * newSpeed;
      }
  }, [currentSpeaker]);

  // --- PUBLIC API ---
  const startRadio = useCallback((articles, startIndex = 0) => {
      if (!articles || articles.length === 0) return;

      const userQueue = articles.slice(startIndex);
      const connectedQueue = injectSegues(userQueue);
      const firstArticle = articles[startIndex];
      const greetingTrack = getGreetingTrack(firstArticle);

      let finalPlaylist = greetingTrack ? [greetingTrack, ...connectedQueue] : connectedQueue;

      setPlaylist(finalPlaylist);
      setCurrentIndex(0); 
  }, [getPersonaForCategory, injectSegues]);

  const playSingle = useCallback((article) => {
      setPlaylist([article]);
      setCurrentIndex(0);
  }, []);

  const cancelAutoplay = useCallback(() => {
      stop();
  }, [stop]);

  // --- EVENT LISTENERS ---
  useEffect(() => {
      const audio = audioRef.current;

      const handleTimeUpdate = () => {
          const cTime = audio.currentTime;
          const dur = audio.duration;
          setCurrentTime(cTime);
      };

      const handleDurationChange = () => setDuration(audio.duration);
      
      const handleLoadStart = () => setIsLoading(true);
      
      const handlePlaying = () => { 
          setIsLoading(false); 
          setIsPlaying(true); 

          // === INSTANT PRE-FETCH LOGIC ===
          // Trigger download for NEXT item immediately when current item starts playing.
          if (playlist.length > 0 && currentIndex + 1 < playlist.length) {
              const nextItem = playlist[currentIndex + 1];

              if (!hasPrefetchedRef.current) {
                  hasPrefetchedRef.current = true; // Lock it so we don't spam
                  
                  if (nextItem.isSystemAudio && nextItem.audioUrl) {
                      // 1. Static Audio (Segue/Greeting) -> Force Browser Download
                      console.log(`🎧 Pre-loading Static Audio: ${nextItem.headline}`);
                      const preload = new Audio(nextItem.audioUrl);
                      preload.load(); 
                  } else {
                      // 2. AI News -> Generate via API
                      console.log(`🎧 Pre-generating AI Audio: ${nextItem.headline}`);
                      const nextPersona = getPersonaForCategory(nextItem.category);
                      const nextText = prepareAudioText(nextItem.headline, nextItem.summary);
                      api.prefetchAudio(nextText, nextPersona.id, nextItem._id);
                  }
              }
          }
      };
      
      const handleEnded = () => {
          playNext(); 
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
  }, [resume, pause, playNext, playPrevious, playlist, currentIndex, getPersonaForCategory]);

  return (
      <RadioContext.Provider value={{
          currentArticle, currentSpeaker, isPlaying, isPaused, isLoading, isVisible,
          currentTime, duration, playbackRate,
          startRadio, playSingle, stop, pause, resume, playNext, playPrevious, seekTo, changeSpeed, cancelAutoplay
      }}>
          {children}
      </RadioContext.Provider>
  );
};
