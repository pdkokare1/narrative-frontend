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
  }
};

// Shared Interface for the Session Reference
export interface SessionData {
  sessionId: string;
  accumulatedTime: { total: 0; article: 0; radio: 0; narrative: 0; feed: 0 };
  quarters: number[]; // [0,0,0,0]
  lastPingTime: number;
  isActive: boolean;
  lastActiveInteraction: number;
  idleTimer: any;
  maxScroll: number;
  cachedWordCount: number;
  hasStitchedSession: false;
  pendingInteractions: any[];
  
  // Velocity Tracking
  lastScrollTop: number;
  lastScrollTime: number;
  scrollVelocity: number;

  // Focus & Ghost Tracking
  tabSwitchCount: number;
  isTabActive: boolean;
  lastCursorMove: number; // NEW: Track physical presence

  // Heatmap
  heatmap: Record<string, number>;
}
