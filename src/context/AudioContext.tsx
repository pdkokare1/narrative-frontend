// src/context/AudioContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext'; 
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { IArticle } from '../types';

interface Speaker {
  id: string;
  name: string;
  role: string;
}

// Logic Interface
export interface IAudioContext {
  currentArticle: IArticle | null;
  currentSpeaker: Speaker | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  
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
  
  isVisible: boolean; // Does audio exist? (Not UI visibility)
  isWaitingForNext?: boolean;
  autoplayTimer?: number;
}

const AudioContext = createContext<IAudioContext | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  // Provide logic from hook
  const audioPlayer = useAudioPlayer(user);

  return (
      <AudioContext.Provider value={audioPlayer}>
          {children}
      </AudioContext.Provider>
  );
};
