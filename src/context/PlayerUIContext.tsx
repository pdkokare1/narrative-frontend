// src/context/PlayerUIContext.tsx
import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';

// UI Interface
export interface IPlayerUIContext {
  playerOpen: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
  togglePlayer: () => void;
}

const PlayerUIContext = createContext<IPlayerUIContext | undefined>(undefined);

export const usePlayerUI = () => {
  const context = useContext(PlayerUIContext);
  if (!context) throw new Error("usePlayerUI must be used within PlayerUIProvider");
  return context;
};

export const PlayerUIProvider = ({ children }: { children: ReactNode }) => {
  const [playerOpen, setPlayerOpen] = useState(false);

  const openPlayer = useCallback(() => setPlayerOpen(true), []);
  const closePlayer = useCallback(() => setPlayerOpen(false), []);
  const togglePlayer = useCallback(() => setPlayerOpen(prev => !prev), []);

  const value = {
      playerOpen,
      openPlayer,
      closePlayer,
      togglePlayer
  };

  return (
      <PlayerUIContext.Provider value={value}>
          {children}
      </PlayerUIContext.Provider>
  );
};
