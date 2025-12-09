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
  
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [isVisible, setIsVisible] = useState(false); // Show/Hide the player bar

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
      setIsVisible(true); // Show the player bar

      try {
          // 1. Setup Speaker
          const persona = getPersonaForCategory(article.category);
          setCurrentSpeaker(persona);

          // 2. Fetch Audio (Cache First)
          const textToSpeak = `${article.headline}. ${article.summary}`;
          const response = await api.getAudio(textToSpeak, persona.id, article._id);

          if (response.data && response.data.audioUrl) {
              audioRef.current.src = response.data.audioUrl;
              await audioRef.current.play();
          } else {
              throw new Error("No audio URL");
          }

          // 3. Media Session (Lock Screen)
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
  }, []);

  // --- QUEUE LOGIC ---
  const playNext = useCallback(() => {
      if (currentIndex + 1 < playlist.length) {
          setCurrentIndex(prev => prev + 1);
      } else {
          stop(); // End of playlist
      }
  }, [currentIndex, playlist]);

  const playPrevious = useCallback(() => {
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
      setIsVisible(false); // Hide bar
      setCurrentArticle(null);
      setCurrentIndex(-1);
      setPlaylist([]);
      
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

  // --- PUBLIC API (How components use this) ---
  const startRadio = useCallback((articles, startIndex = 0) => {
      setPlaylist(articles);
      setCurrentIndex(startIndex); // This triggers the useEffect above
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
                  setCurrentIndex(idx => idx + 1); // Go Next
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

  // --- EVENT LISTENERS ---
  useEffect(() => {
      const audio = audioRef.current;
      const handleEnded = () => {
          setIsPlaying(false);
          setIsPaused(false);
          startAutoplayCountdown();
      };
      const handleLoadStart = () => setIsLoading(true);
      const handlePlaying = () => {
          setIsLoading(false);
          setIsPlaying(true);
      };

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('playing', handlePlaying);

      return () => {
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('loadstart', handleLoadStart);
          audio.removeEventListener('playing', handlePlaying);
      };
  }, [startAutoplayCountdown]);

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
          startRadio,
          playSingle,
          stop,
          pause,
          resume,
          playNext: () => setCurrentIndex(i => i + 1), // Skip manual
          cancelAutoplay
      }}>
          {children}
      </RadioContext.Provider>
  );
};
