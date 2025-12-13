// src/context/RadioContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
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

export const RadioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // All logic is now inside the hook
  const audioPlayer = useAudioPlayer(user);

  return (
      <RadioContext.Provider value={audioPlayer}>
          {children}
      </RadioContext.Provider>
  );
};
