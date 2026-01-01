// src/context/RadioContext.tsx
import React, { ReactNode, useState, useCallback } from 'react';
import { AudioProvider, useAudio, IAudioContext } from './AudioContext';
import { PlayerUIProvider, usePlayerUI, IPlayerUIContext } from './PlayerUIContext';
import { IArticle } from '../types';

// Extended Interface
interface IRadioContext extends IAudioContext, IPlayerUIContext {
  // UPDATED: Unified start function with options
  startRadio: (articles: any[], index?: number, options?: { skipGreeting?: boolean; enableFirstTimer?: boolean }) => void;
  stop: () => void;
  
  // Smart Radio Context
  contextQueue: IArticle[];
  contextLabel: string;
  updateContextQueue: (articles: IArticle[], label: string) => void;
}

export const useRadio = (): IRadioContext => {
  const audio = useAudio();
  const ui = usePlayerUI();
  
  const context = React.useContext(RadioStateContext);
  if (!context) throw new Error("useRadio must be used within RadioProvider");

  // UPDATED: Unified logic
  const startRadio = (articles: any[], index?: number, options?: { skipGreeting?: boolean; enableFirstTimer?: boolean }) => {
      ui.openPlayer();
      // Pass the options down to the audio hook
      audio.startRadio(articles, index, options);
  };

  const stop = () => {
      ui.closePlayer();
      audio.stop();
  };

  return {
      ...audio,
      ...ui,
      startRadio,
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

export const RadioProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<IArticle[]>([]);
  const [label, setLabel] = useState<string>('Latest News');

  const updateQueue = useCallback((articles: IArticle[], sourceLabel: string) => {
      setQueue((prevQueue) => {
          if (articles.length !== prevQueue.length) {
              return articles;
          }
          // Deep compare IDs to avoid unnecessary re-renders
          const isSame = articles.every((item, index) => item._id === prevQueue[index]?._id);
          if (isSame) {
              return prevQueue;
          }
          return articles;
      });

      setLabel((prevLabel) => {
          return prevLabel === sourceLabel ? prevLabel : sourceLabel;
      });
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
