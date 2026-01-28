// src/config/analyticsConfig.ts

export const ANALYTICS_CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  SAMPLING_INTERVAL: 1000,   // 1 second (High res sampling)
  BATCH_THRESHOLD: 10,       // NEW: Flush queue if we have 10+ items pending
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

  // Dynamic Timeouts (How long until we consider the user "Idle")
  TIMEOUTS: {
    AUDIO_MODE: 1200000, // 20 mins (Listening allows long pauses)
    FEED_MODE: 15000,    // 15 sec (Scanning requires constant interaction)
    READING_MODE: 60000, // 60 sec (Deep reading)
    NARRATIVE_MODE: 120000, // NEW: 120 sec (Long-form Narrative tolerance)
    
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
    GRACE_PERIOD_MS: 5000, // NEW: Allow 5s of interruption before breaking flow
  },

  // NEW: Confusion / Re-reading Detection
  CONFUSION: {
    SCROLL_UP_THRESHOLD: 300, // Pixels scrolled up to count as "Re-reading/Confusion"
    ABANDONMENT_THRESHOLD: 3, // NEW: How many rapid up-scrolls trigger the intervention
    REFERENCE_DEPTH_THRESHOLD: 30, // NEW: If deeper than 30%, assume referencing, not confusion
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

  // NEW: Average Velocity for Cognitive Load Calculation
  avgVelocity: number; // Rolling average of non-zero movements
  velocitySamples: number; // Count of samples for the average

  // Focus & Ghost Tracking
  tabSwitchCount: number;
  isTabActive: boolean;
  lastCursorMove: number; // NEW: Track physical presence

  // NEW: Flow State Tracking
  currentFlowDuration: number; // Duration in current flow state (ms)
  totalFlowDuration: number;   // Total flow time this session (seconds)
  isFlowing: boolean;
  flowGraceCounter: number;    // NEW: Track seconds of invalid state before reset

  // NEW: Confusion / Re-reading Metric
  confusionCount: number; // How many times they scrolled back up to re-read
  tempUpScroll: number;   // Internal counter for upward pixels

  // NEW: Drop-off Detection
  lastVisibleElementId?: string;

  // Heatmap
  heatmap: Record<string, number>;
}
