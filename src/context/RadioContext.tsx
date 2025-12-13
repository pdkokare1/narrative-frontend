// src/context/RadioContext.tsx
import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';
import { VOICE_ASSETS } from '../utils/VoiceAssets'; 
import { useAuth } from './AuthContext'; 
import { IArticle } from '../types';

interface Speaker {
  id: string;
  name: string;
  role: string;
}

interface IRadioContext {
  currentArticle: IArticle | null;
  currentSpeaker: Speaker | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isVisible: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  startRadio: (articles: IArticle[], startIndex?: number) => void;
  playSingle: (article: IArticle) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  changeSpeed: (speed: number) => void;
  cancelAutoplay: () => void;
  isWaitingForNext?: boolean;
  autoplayTimer?: number;
}

const RadioContext = createContext<IRadioContext | undefined>(undefined);

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) throw new Error("useRadio must be used within RadioProvider");
  return context;
};

// --- PERSONAS ---
const VOICES = {
  ANCHOR: { id: 'SmLgXu8CcwHJvjiqq2rw', name: 'Mira', role: 'The Anchor' },
  ANALYST: { id: 'SZQ4R1VKS2t6wmBJpK5H', name: 'Rajat', role: 'The Analyst' }, 
  CURATOR: { id: '2n8AzqIsQUPMvb1OgO72', name: 'Shubhi', role: 'The Curator' }
};

export const RadioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); 

  // --- STATE ---
  const [playlist, setPlaylist] = useState<any[]>([]); // Using 'any' for playlist items because they can be "System Audio" objects too
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentArticle, setCurrentArticle] = useState<IArticle | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const [isVisible, setIsVisible] = useState(false); 

  // Refs
  const audioRef = useRef(new Audio());
  
  // NEW: Track exactly which IDs we have already requested to avoid duplicates
  const prefetchedIdsRef = useRef(new Set<string>());
  
  // Store downloaded audio BLOBS
  const preloadedBlobsRef = useRef<Record<string, string>>({}); 

  // --- HELPER: Cloudinary Optimization (64kbps) ---
  const optimizeUrl = (url?: string | null) => {
      if (!url || !url.includes('cloudinary')) return url;
      return url.replace('/upload/', '/upload/br_64k/');
  };

  // --- HELPER: Select Persona ---
  const getPersonaForCategory = useCallback((category?: string) => {
      if (!category) return VOICES.ANCHOR;
      const cat = category.toLowerCase();
      if (cat.includes('economy') || cat.includes('business') || cat.includes('tech') || cat.includes('science') || cat.includes('finance') || cat.includes('crypto')) return VOICES.ANALYST;
      if (cat.includes('entertainment') || cat.includes('lifestyle') || cat.includes('culture') || cat.includes('human') || cat.includes('gaming') || cat.includes('sports')) return VOICES.CURATOR;
      return VOICES.ANCHOR;
  }, []);

  // --- HELPER: Get Base Speed per Host ---
  const getBaseSpeed = (personaName: string) => {
      if (!personaName) return 0.9;
      switch (personaName) {
          case 'Rajat': return 1.0; 
          case 'Shubhi': return 1.1;
          case 'Mira': return 0.9;
          default: return 0.9;
      }
  };

  // --- HELPER: Format Text for Audio ---
  const prepareAudioText = (headline: string, summary: string) => {
      const cleanHeadline = headline.replace(/[.]+$/, '');
      return `${cleanHeadline}. . . . . . ${summary}`;
  };

  // --- HELPER: Select Greeting ---
  const getGreetingTrack = (firstArticle: IArticle) => {
      const userId = user?.uid || 'guest';
      const storageKey = `lastRadioSession_${userId}`;
      const lastSessionStr = localStorage.getItem(storageKey);
      const lastSession = lastSessionStr ? parseInt(lastSessionStr) : 0;
      const now = Date.now();
      const THIRTY_MINS = 30 * 60 * 1000;

      localStorage.setItem(storageKey, now.toString());

      if (lastSession && (now - lastSession < THIRTY_MINS)) return null; 

      const persona = getPersonaForCategory(firstArticle.category);
      const hostKey = persona.name.toUpperCase(); 
      const hour = new Date().getHours();
      let timeKey = 'MORNING';
      if (hour >= 12 && hour < 17) timeKey = 'AFTERNOON';
      if (hour >= 17 || hour < 5) timeKey = 'EVENING';

      // @ts-ignore - Indexing VOICE_ASSETS dynamically
      const clips = VOICE_ASSETS.OPENERS[hostKey]?.[timeKey];
      if (!clips || clips.length === 0) return null;

      const randomClip = clips[Math.floor(Math.random() * clips.length)];

      return {
          _id: 'greeting_track',
          headline: `${timeKey === 'MORNING' ? 'Good Morning' : timeKey === 'AFTERNOON' ? 'Good Afternoon' : 'Good Evening'} from ${persona.name}`,
          summary: "Session Opener",
          isSystemAudio: true, 
          audioUrl: randomClip, 
          speaker: persona,
          category: 'System'
      };
  };

  // --- HELPER: Inject Segues ---
  const injectSegues = useCallback((rawArticles: IArticle[]) => {
      const processed: any[] = [];
      for (let i = 0; i < rawArticles.length; i++) {
          processed.push(rawArticles[i]);
          if (i < rawArticles.length - 1) {
              const currentItem = rawArticles[i];
              const nextItem = rawArticles[i+1];
              
              // @ts-ignore - Checking for custom property
              if (currentItem.isSystemAudio || nextItem.isSystemAudio) continue;

              const currentHost = getPersonaForCategory(currentItem.category);
              const nextHost = getPersonaForCategory(nextItem.category);

              if (currentHost.name === nextHost.name) {
                  const hostKey = currentHost.name.toUpperCase();
                  // @ts-ignore
                  const segues = VOICE_ASSETS.SEGUES?.[hostKey];
                  if (segues && segues.length > 0) {
                      const randomSegue = segues[Math.floor(Math.random() * segues.length)];
                      processed.push({
                          _id: `segue_${currentItem._id}_to_${nextItem._id}`,
                          headline: "Transition",
                          summary: "Segue",
                          isSystemAudio: true,
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
  const playArticle = useCallback(async (article: any) => {
      if (!article) return;

      setIsLoading(true);
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentArticle(article);
      setIsVisible(true);
      
      setCurrentTime(0);
      setDuration(0);

      try {
          const persona = article.isSystemAudio ? article.speaker : getPersonaForCategory(article.category);
          setCurrentSpeaker(persona);
          const audio = audioRef.current;

          // Check for preloaded Blob (Best Speed)
          if (preloadedBlobsRef.current[article._id]) {
              console.log(`⚡ Instant Play: ${article.headline}`);
              audio.src = preloadedBlobsRef.current[article._id];
          } 
          // Network Fallback with Optimization
          else if (article.isSystemAudio && article.audioUrl) {
              audio.src = optimizeUrl(article.audioUrl) || "";
          } else {
              const textToSpeak = prepareAudioText(article.headline, article.summary);
              const response = await api.getAudio(textToSpeak, persona.id, article._id);
              if (response.data && response.data.audioUrl) {
                  audio.src = optimizeUrl(response.data.audioUrl) || "";
              } else {
                  throw new Error("No audio URL");
              }
          }

          const baseSpeed = getBaseSpeed(persona.name);
          audio.playbackRate = baseSpeed * playbackRate;
          
          await audio.play();

          if ('mediaSession' in navigator) {
              // @ts-ignore - MediaMetadata types might not be fully available
              navigator.mediaSession.metadata = new MediaMetadata({
                  title: article.headline,
                  artist: `The Gamut • ${persona.name}`,
                  artwork: article.imageUrl ? [{ src: article.imageUrl, sizes: '512x512', type: 'image/jpeg' }] : []
              });
              navigator.mediaSession.playbackState = "playing";
          }

          // Cleanup Memory (Previous Track only)
          const prevId = playlist[currentIndex - 1]?._id;
          if (prevId && preloadedBlobsRef.current[prevId]) {
              URL.revokeObjectURL(preloadedBlobsRef.current[prevId]);
              delete preloadedBlobsRef.current[prevId];
              prefetchedIdsRef.current.delete(prevId); // Allow re-fetch if we go back
          }

      } catch (error) {
          console.error("Radio Error:", error);
          playNext(); 
      }
  }, [playbackRate, getPersonaForCategory, currentIndex, playlist]);

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
              
              // 0.5s Delay for Segues
              const delay = (nextTrack.isSystemAudio && nextTrack.summary === "Segue") ? 500 : 0;
              
              if (delay > 0) {
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
      
      // Cleanup Everything
      prefetchedIdsRef.current.clear();
      Object.values(preloadedBlobsRef.current).forEach(url => URL.revokeObjectURL(url));
      preloadedBlobsRef.current = {};
      
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

  const seekTo = useCallback((time: number) => {
      if (audioRef.current) {
          audioRef.current.currentTime = time;
          setCurrentTime(time);
      }
  }, []);

  const changeSpeed = useCallback((newSpeed: number) => {
      setPlaybackRate(newSpeed);
      if (audioRef.current && currentSpeaker) {
          const baseSpeed = getBaseSpeed(currentSpeaker.name);
          audioRef.current.playbackRate = baseSpeed * newSpeed;
      }
  }, [currentSpeaker]);

  const startRadio = useCallback((articles: IArticle[], startIndex = 0) => {
      if (!articles || articles.length === 0) return;
      const userQueue = articles.slice(startIndex);
      const connectedQueue = injectSegues(userQueue);
      const firstArticle = articles[startIndex];
      const greetingTrack = getGreetingTrack(firstArticle);
      let finalPlaylist = greetingTrack ? [greetingTrack, ...connectedQueue] : connectedQueue;
      setPlaylist(finalPlaylist);
      setCurrentIndex(0); 
  }, [getPersonaForCategory, injectSegues]);

  const playSingle = useCallback((article: IArticle) => {
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
          setCurrentTime(cTime);
      };

      const handleDurationChange = () => setDuration(audio.duration);
      const handleLoadStart = () => setIsLoading(true);
      
      const handlePlaying = async () => { 
          setIsLoading(false); 
          setIsPlaying(true); 

          // === MULTI-TRACK LOOKAHEAD (Prefetch Next 2 Items) ===
          if (playlist.length > 0) {
              const lookaheadCount = 2; // Buffer Next + NextNext

              for (let i = 1; i <= lookaheadCount; i++) {
                  const targetIndex = currentIndex + i;
                  if (targetIndex >= playlist.length) break;

                  const targetItem = playlist[targetIndex];

                  // Only download if not already requested
                  if (!prefetchedIdsRef.current.has(targetItem._id)) {
                      prefetchedIdsRef.current.add(targetItem._id);
                      
                      // Run in background (don't await)
                      (async () => {
                          try {
                              let urlToFetch: string | null = null;
                              if (targetItem.isSystemAudio && targetItem.audioUrl) {
                                  urlToFetch = targetItem.audioUrl;
                              } else {
                                  console.log(`🎧 Pre-generating: ${targetItem.headline}`);
                                  const nextPersona = getPersonaForCategory(targetItem.category);
                                  const nextText = prepareAudioText(targetItem.headline, targetItem.summary);
                                  const res = await api.getAudio(nextText, nextPersona.id, targetItem._id);
                                  if (res.data && res.data.audioUrl) {
                                      urlToFetch = res.data.audioUrl;
                                  }
                              }

                              if (urlToFetch) {
                                  // Optimize before downloading
                                  const optimizedUrl = optimizeUrl(urlToFetch) || "";
                                  console.log(`⬇️ Downloading Blob: ${targetItem.headline}`);
                                  
                                  const fetchRes = await fetch(optimizedUrl);
                                  const blob = await fetchRes.blob();
                                  const blobUrl = URL.createObjectURL(blob);
                                  preloadedBlobsRef.current[targetItem._id] = blobUrl;
                                  console.log(`✅ Cached in Memory: ${targetItem.headline}`);
                              }
                          } catch (err) {
                              console.warn(`Buffer failed for ${targetItem.headline}:`, err);
                              prefetchedIdsRef.current.delete(targetItem._id); // Retry later if failed
                          }
                      })();
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
