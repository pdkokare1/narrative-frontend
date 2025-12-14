// src/context/RadioContext.tsx
import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useAuth } from './AuthContext'; 
import { useAudioPlayer } from '../hooks/useAudioPlayer';
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
  
  // Audio Logic
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

  // Visual Logic (New)
  isVisible: boolean; // Does audio exist?
  playerOpen: boolean; // Is the bubble UI showing?
  openPlayer: () => void;
  closePlayer: () => void;
  togglePlayer: () => void;
}

const RadioContext = createContext<IRadioContext | undefined>(undefined);

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) throw new Error("useRadio must be used within RadioProvider");
  return context;
};

export const RadioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const audioPlayer = useAudioPlayer(user);
  
  // --- New Visibility State ---
  const [playerOpen, setPlayerOpen] = useState(false);

  const openPlayer = useCallback(() => setPlayerOpen(true), []);
  const closePlayer = useCallback(() => setPlayerOpen(false), []);
  const togglePlayer = useCallback(() => setPlayerOpen(prev => !prev), []);

  // Intercept the original startRadio to auto-open player
  const originalStartRadio = audioPlayer.startRadio;
  const startRadio = useCallback((articles: IArticle[], startIndex?: number) => {
      setPlayerOpen(true);
      originalStartRadio(articles, startIndex);
  }, [originalStartRadio]);

  // Intercept playSingle to auto-open
  const originalPlaySingle = audioPlayer.playSingle;
  const playSingle = useCallback((article: IArticle) => {
      setPlayerOpen(true);
      originalPlaySingle(article);
  }, [originalPlaySingle]);

  // If user stops completely, close player
  const originalStop = audioPlayer.stop;
  const stop = useCallback(() => {
      setPlayerOpen(false);
      originalStop();
  }, [originalStop]);

  const value = {
      ...audioPlayer,
      startRadio,
      playSingle,
      stop,
      playerOpen,
      openPlayer,
      closePlayer,
      togglePlayer
  };

  return (
      <RadioContext.Provider value={value}>
          {children}
      </RadioContext.Provider>
  );
};
