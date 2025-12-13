// src/hooks/useAudioPlayer.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { getAudio } from '../services/api';
import { VOICE_ASSETS } from '../utils/VoiceAssets';
import { IArticle } from '../types';

interface Speaker {
  id: string;
  name: string;
  role: string;
}

const VOICES = {
  ANCHOR: { id: 'SmLgXu8CcwHJvjiqq2rw', name: 'Mira', role: 'The Anchor' },
  ANALYST: { id: 'SZQ4R1VKS2t6wmBJpK5H', name: 'Rajat', role: 'The Analyst' }, 
  CURATOR: { id: '2n8AzqIsQUPMvb1OgO72', name: 'Shubhi', role: 'The Curator' }
};

export const useAudioPlayer = (user: any) => {
  // --- STATE ---
  const [playlist, setPlaylist] = useState<any[]>([]); 
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
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [autoplayTimer, setAutoplayTimer] = useState(0);

  // Refs
  const audioRef = useRef(new Audio());
  const prefetchedIdsRef = useRef(new Set<string>());
  const preloadedBlobsRef = useRef<Record<string, string>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- HELPERS ---
  const optimizeUrl = (url?: string | null) => {
      if (!url || !url.includes('cloudinary')) return url;
      return url.replace('/upload/', '/upload/br_64k/');
  };

  const getPersonaForCategory = useCallback((category?: string) => {
      if (!category) return VOICES.ANCHOR;
      const cat = category.toLowerCase();
      if (cat.includes('economy') || cat.includes('business') || cat.includes('tech') || cat.includes('science') || cat.includes('finance') || cat.includes('crypto')) return VOICES.ANALYST;
      if (cat.includes('entertainment') || cat.includes('lifestyle') || cat.includes('culture') || cat.includes('human') || cat.includes('gaming') || cat.includes('sports')) return VOICES.CURATOR;
      return VOICES.ANCHOR;
  }, []);

  const getBaseSpeed = (personaName: string) => {
      if (!personaName) return 0.9;
      switch (personaName) {
          case 'Rajat': return 1.0; 
          case 'Shubhi': return 1.1;
          case 'Mira': return 0.9;
          default: return 0.9;
      }
  };

  const prepareAudioText = (headline: string, summary: string) => {
      const cleanHeadline = headline.replace(/[.]+$/, '');
      return `${cleanHeadline}. . . . . . ${summary}`;
  };

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

      // @ts-ignore 
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

  const injectSegues = useCallback((rawArticles: IArticle[]) => {
      const processed: any[] = [];
      for (let i = 0; i < rawArticles.length; i++) {
          processed.push(rawArticles[i]);
          if (i < rawArticles.length - 1) {
              const currentItem = rawArticles[i];
              const nextItem = rawArticles[i+1];
              
              // @ts-ignore
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

  // --- CORE PLAYBACK ---
  const playArticle = useCallback(async (article: any) => {
      if (!article) return;

      setIsLoading(true);
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentArticle(article);
      setIsVisible(true);
      setIsWaitingForNext(false);
      
      setCurrentTime(0);
      setDuration(0);

      try {
          const persona = article.isSystemAudio ? article.speaker : getPersonaForCategory(article.category);
          setCurrentSpeaker(persona);
          const audio = audioRef.current;

          if (preloadedBlobsRef.current[article._id]) {
              audio.src = preloadedBlobsRef.current[article._id];
          } else if (article.isSystemAudio && article.audioUrl) {
              audio.src = optimizeUrl(article.audioUrl) || "";
          } else {
              const textToSpeak = prepareAudioText(article.headline, article.summary);
              const response = await getAudio(textToSpeak, persona.id, article._id);
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
              // @ts-ignore 
              navigator.mediaSession.metadata = new MediaMetadata({
                  title: article.headline,
                  artist: `The Gamut • ${persona.name}`,
                  artwork: article.imageUrl ? [{ src: article.imageUrl, sizes: '512x512', type: 'image/jpeg' }] : []
              });
              navigator.mediaSession.playbackState = "playing";
          }

          // Cleanup Memory
          const prevId = playlist[currentIndex - 1]?._id;
          if (prevId && preloadedBlobsRef.current[prevId]) {
              URL.revokeObjectURL(preloadedBlobsRef.current[prevId]);
              delete preloadedBlobsRef.current[prevId];
              prefetchedIdsRef.current.delete(prevId); 
          }

      } catch (error) {
          console.error("Radio Error:", error);
          playNext(); 
      }
  }, [playbackRate, getPersonaForCategory, currentIndex, playlist]);

  // --- CONTROLS ---
  const playNext = useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsWaitingForNext(false);
      setCurrentIndex(prevIndex => prevIndex + 1);
  }, []);

  const playPrevious = useCallback(() => {
      if (audioRef.current.currentTime > 3) {
          audioRef.current.currentTime = 0;
          return;
      }
      setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const stop = useCallback(() => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      setIsVisible(false);
      setIsWaitingForNext(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      
      setCurrentArticle(null);
      setCurrentIndex(-1);
      setPlaylist([]);
      setCurrentTime(0);
      setDuration(0);
      
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

  const startRadio = useCallback(async (articles: IArticle[], startIndex = 0) => {
      if (!articles || articles.length === 0) return;
      stop(); // Reset
      const userQueue = articles.slice(startIndex);
      const connectedQueue = injectSegues(userQueue);
      const firstArticle = articles[startIndex];
      const greetingTrack = getGreetingTrack(firstArticle);
      let finalPlaylist = greetingTrack ? [greetingTrack, ...connectedQueue] : connectedQueue;
      setPlaylist(finalPlaylist);
      setCurrentIndex(0); 
  }, [injectSegues]); // Correct dependency

  const playSingle = useCallback((article: IArticle) => {
      stop(); // Reset
      setPlaylist([article]);
      setCurrentIndex(0);
  }, [stop]);

  const cancelAutoplay = useCallback(() => {
      setIsWaitingForNext(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      stop();
  }, [stop]);

  // --- EFFECT: Playlist Manager ---
  useEffect(() => {
      if (currentIndex >= 0 && playlist.length > 0) {
          if (currentIndex < playlist.length) {
              const nextTrack = playlist[currentIndex];
              // Small delay for segues to feel natural
              const delay = (nextTrack.isSystemAudio && nextTrack.summary === "Segue") ? 500 : 0;
              
              if (delay > 0) {
                  setIsLoading(true);
                  const timer = setTimeout(() => playArticle(nextTrack), delay);
                  return () => clearTimeout(timer);
              } else {
                  playArticle(nextTrack);
              }
          } else {
              stop(); 
          }
      }
  }, [currentIndex, playlist, playArticle, stop]);

  // --- EFFECT: Event Listeners ---
  useEffect(() => {
      const audio = audioRef.current;

      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleDurationChange = () => setDuration(audio.duration);
      const handleLoadStart = () => setIsLoading(true);
      const handlePlaying = () => { setIsLoading(false); setIsPlaying(true); };
      
      const handleEnded = () => {
          // Trigger "Up Next" visual state for 3 seconds before playing
          setIsWaitingForNext(true);
          setAutoplayTimer(3);
          
          let count = 3;
          timerRef.current = setInterval(() => {
              count--;
              setAutoplayTimer(count);
              if (count <= 0) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setIsWaitingForNext(false);
                  playNext();
              }
          }, 1000);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('ended', handleEnded);

      return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('durationchange', handleDurationChange);
          audio.removeEventListener('loadstart', handleLoadStart);
          audio.removeEventListener('playing', handlePlaying);
          audio.removeEventListener('ended', handleEnded);
          if (timerRef.current) clearInterval(timerRef.current);
      };
  }, [playNext]);

  return {
      currentArticle, currentSpeaker, isPlaying, isPaused, isLoading, isVisible,
      isWaitingForNext, autoplayTimer,
      currentTime, duration, playbackRate,
      startRadio, playSingle, stop, pause, resume, playNext, playPrevious,
      seekTo, changeSpeed, cancelAutoplay
  };
};
