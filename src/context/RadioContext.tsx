// src/context/RadioContext.tsx
import React, { ReactNode } from 'react';
import { AudioProvider, useAudio, IAudioContext } from './AudioContext';
import { PlayerUIProvider, usePlayerUI, IPlayerUIContext } from './PlayerUIContext';

// Combined Interface for Backward Compatibility
type IRadioContext = IAudioContext & IPlayerUIContext;

// 1. The Hook: Merges both contexts into one object
export const useRadio = (): IRadioContext => {
  const audio = useAudio();
  const ui = usePlayerUI();

  // Interceptors to sync logic with UI
  const startRadio = (articles: any[], index?: number) => {
      ui.openPlayer();
      audio.startRadio(articles, index);
  };

  const playSingle = (article: any) => {
      ui.openPlayer();
      audio.playSingle(article);
  };

  const stop = () => {
      ui.closePlayer();
      audio.stop();
  };

  return {
      ...audio,
      ...ui,
      startRadio,
      playSingle,
      stop
  };
};

// 2. The Provider: Renders both new providers
export const RadioProvider = ({ children }: { children: ReactNode }) => {
  return (
      <AudioProvider>
          <PlayerUIProvider>
              {children}
          </PlayerUIProvider>
      </AudioProvider>
  );
};
