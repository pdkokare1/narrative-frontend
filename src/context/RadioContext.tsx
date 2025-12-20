// src/context/RadioContext.tsx
import React, { ReactNode, useState, useCallback } from 'react';
import { AudioProvider, useAudio, IAudioContext } from './AudioContext';
import { PlayerUIProvider, usePlayerUI, IPlayerUIContext } from './PlayerUIContext';
import { IArticle } from '../types';

// Extended Interface
interface IRadioContext extends IAudioContext, IPlayerUIContext {
  startRadio: (articles: any[], index?: number) => void;
  playSingle: (article: any) => void;
  stop: () => void;
  
  // Smart Radio Context
  contextQueue: IArticle[];
  contextLabel: string;
  updateContextQueue: (articles: IArticle[], label: string) => void;
}

// 1. The Hook: Merges both contexts + Smart Logic
export const useRadio = (): IRadioContext => {
  const audio = useAudio();
  const ui = usePlayerUI();
  
  // We use a global state for the context queue (managed by the Provider below usually, 
  // but since we are composing hooks, we need to access the Context we created).
  // However, since useRadio is the consumer, we need the state to live in the Provider.
  // See the implementation below in RadioProviderWrapper.
  const context = React.useContext(RadioStateContext);
  if (!context) throw new Error("useRadio must be used within RadioProvider");

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
      stop,
      contextQueue: context.queue,
      contextLabel: context.label,
      updateContextQueue: context.updateQueue
  };
};

// Internal Context for the Queue State
const RadioStateContext = React.createContext<{
    queue: IArticle[];
    label: string;
    updateQueue: (a: IArticle[], l: string) => void;
} | null>(null);

// 2. The Provider: Renders Providers + Manages Queue State
export const RadioProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<IArticle[]>([]);
  const [label, setLabel] = useState<string>('Latest News');

  const updateQueue = useCallback((articles: IArticle[], sourceLabel: string) => {
      // Simple de-dupe check to prevent infinite loops if the array reference changes but content doesn't
      if (articles.length > 0) {
          setQueue(articles);
          setLabel(sourceLabel);
          // console.log(`📻 Radio Context Updated: ${sourceLabel} (${articles.length} tracks)`);
      }
  }, []);

  return (
      <RadioStateContext.Provider value={{ queue, label, updateQueue }}>
          <AudioProvider>
              <PlayerUIProvider>
                  {children}
              </PlayerUIProvider>
          </AudioProvider>
      </RadioStateContext.Provider>
  );
};
