// src/context/RadioContext.tsx
import React, { ReactNode, useState, useCallback, useRef } from 'react';
import { AudioProvider, useAudio, IAudioContext } from './AudioContext';
import { PlayerUIProvider, usePlayerUI, IPlayerUIContext } from './PlayerUIContext';
import { IArticle } from '../types';

// Extended Interface
interface IRadioContext extends IAudioContext, IPlayerUIContext {
  // Unified start function with options
  startRadio: (articles?: any[], index?: number, options?: { skipGreeting?: boolean; enableFirstTimer?: boolean }) => void;
  stop: () => void;
  playSingle: (article: IArticle) => void; 
  
  // Smart Radio Context
  contextQueue: IArticle[];
  contextLabel: string;
  updateContextQueue: (articles: IArticle[], label: string) => void;
  
  // Scroll Sync
  visibleArticleId: string | null;
  updateVisibleArticle: (id: string) => void;
}

export const useRadio = (): IRadioContext => {
  const audio = useAudio();
  const ui = usePlayerUI();
  
  const context = React.useContext(RadioStateContext);
  if (!context) throw new Error("useRadio must be used within RadioProvider");

  // UPDATED: Smart Start Logic
  const startRadio = (
      articles?: any[], 
      index?: number, 
      options?: { skipGreeting?: boolean; enableFirstTimer?: boolean }
  ) => {
      const queueToUse = articles || context.queue;
      let startIndex = index;

      // Smart Start: If no index provided, start from the article currently visible on screen
      if (startIndex === undefined || startIndex === -1) {
          if (context.visibleArticleId) {
              const foundIndex = queueToUse.findIndex(a => a._id === context.visibleArticleId);
              if (foundIndex !== -1) startIndex = foundIndex;
          }
          if (startIndex === undefined || startIndex === -1) startIndex = 0;
      }

      ui.openPlayer();
      audio.startRadio(queueToUse, startIndex, options);
  };

  // UPDATED: Play Single now starts the Radio sequence from that card
  const playSingle = (article: IArticle) => {
      // Find where this article is in the current context queue
      const index = context.queue.findIndex(a => a._id === article._id);
      
      // If found, play from there. If not, play just this one (fallback).
      if (index !== -1) {
          startRadio(context.queue, index, { skipGreeting: true, enableFirstTimer: true });
      } else {
          startRadio([article], 0, { skipGreeting: true, enableFirstTimer: true });
      }
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
      playSingle,
      contextQueue: context.queue,
      contextLabel: context.label,
      updateContextQueue: context.updateQueue,
      visibleArticleId: context.visibleArticleId,
      updateVisibleArticle: context.updateVisibleArticle
  };
};

// Internal Context for the Queue State
const RadioStateContext = React.createContext<{
    queue: IArticle[];
    label: string;
    updateQueue: (a: IArticle[], l: string) => void;
    visibleArticleId: string | null;
    updateVisibleArticle: (id: string) => void;
} | null>(null);

export const RadioProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<IArticle[]>([]);
  const [label, setLabel] = useState<string>('Latest News');
  const [visibleArticleId, setVisibleArticleId] = useState<string | null>(null);

  // Throttled setter for visible article to avoid context thrashing
  const lastUpdate = useRef(0);
  const updateVisibleArticle = useCallback((id: string) => {
      const now = Date.now();
      if (now - lastUpdate.current > 500) { // Throttle updates to 500ms
          setVisibleArticleId(id);
          lastUpdate.current = now;
      }
  }, []);

  const updateQueue = useCallback((articles: IArticle[], sourceLabel: string) => {
      setQueue((prevQueue) => {
          if (articles.length !== prevQueue.length) {
              return articles;
          }
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
      <RadioStateContext.Provider value={{ queue, label, updateQueue, visibleArticleId, updateVisibleArticle }}>
          <AudioProvider>
              <PlayerUIProvider>
                  {children}
              </PlayerUIProvider>
          </AudioProvider>
      </RadioStateContext.Provider>
  );
};
