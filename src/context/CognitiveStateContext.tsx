// src/context/CognitiveStateContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the available cognitive states
export type CognitiveMode = 'standard' | 'flow' | 'fatigue' | 'confusion';

interface CognitiveStateContextType {
  mode: CognitiveMode;
  forceMode: (mode: CognitiveMode) => void;
}

const CognitiveStateContext = createContext<CognitiveStateContextType | undefined>(undefined);

export const CognitiveStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<CognitiveMode>('standard');

  useEffect(() => {
    // Handler for custom events dispatched by useActivityTracker
    const handleCognitiveUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ state: CognitiveMode }>;
      if (customEvent.detail && customEvent.detail.state) {
        setMode(customEvent.detail.state);
      }
    };

    window.addEventListener('narrative-cognitive-change', handleCognitiveUpdate);

    return () => {
      window.removeEventListener('narrative-cognitive-change', handleCognitiveUpdate);
    };
  }, []);

  // Apply the mode to the body tag for global CSS targeting
  useEffect(() => {
    document.body.setAttribute('data-cognitive-mode', mode);
  }, [mode]);

  const forceMode = (newMode: CognitiveMode) => {
    setMode(newMode);
  };

  return (
    <CognitiveStateContext.Provider value={{ mode, forceMode }}>
      {children}
    </CognitiveStateContext.Provider>
  );
};

export const useCognitiveState = () => {
  const context = useContext(CognitiveStateContext);
  if (!context) {
    throw new Error('useCognitiveState must be used within a CognitiveStateProvider');
  }
  return context;
};
