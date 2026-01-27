// src/config/analyticsConfig.ts

export const ANALYTICS_CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  SAMPLING_INTERVAL: 1000,   // 1 second (High res sampling)
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

  // Dynamic Timeouts (How long until we consider the user "Idle")
  TIMEOUTS: {
    AUDIO_MODE: 1200000, // 20 mins (Listening allows long pauses)
    FEED_MODE: 15000,    // 15 sec (Scanning requires constant interaction)
    READING_MODE: 60000, // 60 sec (Deep reading)
    
    // NEW: Ghost Reading Protection
    // If cursor hasn't moved in this time, stop counting "Reading" time
    // even if the tab is technically "active".
    CURSOR_IDLE: 60000, 
  },

  // Velocity Thresholds (pixels per ms)
  VELOCITY: {
    READING_MAX: 0.05, // Below this, user is likely reading
    SCANNING_MIN: 0.1, // Above this, user is likely scanning/skipping
  },

  // NEW: Flow State Configuration
  FLOW: {
    THRESHOLD_MS: 300000, // 5 minutes of stability to enter "Flow"
    VELOCITY_MAX: 0.03,   // Must be very stable to count as flow
  },
  
  // NEW: Confusion / Re-reading Detection
  CONFUSION: {
    SCROLL_UP_THRESHOLD: 300, // Pixels scrolled up to count as "Re-reading/Confusion"
  }
};

// Shared Interface for the Session Reference
export interface SessionData {
  sessionId: string;
  accumulatedTime: { 
    total: number; 
    article: number; 
    radio: number; 
    narrative: number; 
    feed: number;
  };
  quarters: number[]; // [0,0,0,0]
  lastPingTime: number;
  isActive: boolean;
  lastActiveInteraction: number;
  idleTimer: any;
  maxScroll: number;
  cachedWordCount: number;
  hasStitchedSession: boolean;
  pendingInteractions: any[];
  
  // Velocity Tracking
  lastScrollTop: number;
  lastScrollTime: number;
  scrollVelocity: number;
  scrollDirection: 'up' | 'down' | 'steady'; // NEW: Track direction

  // Focus & Ghost Tracking
  tabSwitchCount: number;
  isTabActive: boolean;
  lastCursorMove: number; // NEW: Track physical presence

  // NEW: Flow State Tracking
  currentFlowDuration: number; // Duration in current flow state (ms)
  totalFlowDuration: number;   // Total flow time this session (seconds)
  isFlowing: boolean;

  // NEW: Confusion / Re-reading Metric
  confusionCount: number; // How many times they scrolled back up to re-read

  // NEW: Drop-off Detection
  lastVisibleElementId?: string;

  // Heatmap
  heatmap: Record<string, number>;
}
