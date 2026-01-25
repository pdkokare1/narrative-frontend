// src/types.ts

// --- 1. Badge Interface (Gamification) ---
export interface IBadge {
  id: string;        
  label: string;     
  icon: string;      
  description: string;
  earnedAt: string;  
}

// --- 2. Article Interface (Synchronized with Backend) ---
export interface IArticle {
  _id: string;
  type?: 'Article'; // Discriminator
  
  // Core Content
  headline: string;
  summary: string;
  content?: string; 
  source: string;
  category: string;
  politicalLean: string;
  url: string;
  imageUrl?: string;
  audioUrl?: string | null;
  publishedAt: string; 
  
  // Analysis & AI
  analysisType: 'Full' | 'SentimentOnly';
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  embedding?: number[]; // Vector data
  analysisVersion?: string;
  
  // Scores & Metrics
  biasScore?: number;        // 0-100
  biasLabel?: string;
  biasComponents?: any; 

  credibilityScore?: number;
  credibilityGrade?: string;
  credibilityComponents?: any; 

  reliabilityScore?: number;
  reliabilityGrade?: string;
  reliabilityComponents?: any; 

  trustScore?: number;
  trustLevel?: string;

  // Coverage Stats
  coverageLeft?: number;
  coverageCenter?: number;
  coverageRight?: number;
  
  // Clustering & Topics
  clusterId?: number;
  clusterCount?: number;
  clusterTopic?: string;
  primaryNoun?: string;
  secondaryNoun?: string;
  country?: string;
  
  // Actionable Insights
  keyFindings?: string[];
  recommendations?: string[];
  suggestionType?: 'Comfort' | 'Challenge';

  // State (New for Admin)
  isLatest?: boolean;
  deletedAt?: string | null; 
  
  createdAt?: string;
  updatedAt?: string;
}

// BACKWARDS COMPATIBILITY
export type Article = IArticle;

// NEW: Coverage Response for Modal
export interface CoverageResponse {
    timeline: { publishedAt: string; sentimentScore: number }[];
    articles: any[];
}

// --- 3. Narrative Interface (The Story Bundle) ---
export interface INarrative {
  _id: string;
  type: 'Narrative'; // Discriminator
  clusterId: number;
  lastUpdated: string;
  publishedAt: string; // Alias for sorting
  
  // The "Meta" Content
  masterHeadline: string;
  executiveSummary: string; 
  
  // Stats
  sourceCount: number;
  sources: string[];
  
  // The Deep Analysis
  consensusPoints: string[]; 
  divergencePoints: {
    point: string;
    perspectives: {
      source: string;
      stance: string;
    }[];
  }[];

  category: string;
  country: string;
}

// Union Type for Feed
export type FeedItem = IArticle | INarrative;

// --- 4. User Profile Interface ---
export interface IUserProfile {
  userId: string;
  username: string;
  email: string;
  
  // Role for Admin Access
  role?: 'user' | 'admin';
  isBanned?: boolean;     // Added for Admin
  accountStatus?: string; // Added for Admin

  // Stats
  articlesViewedCount: number;
  comparisonsViewedCount: number;
  articlesSharedCount: number;
  
  // Gamification 
  currentStreak?: number;
  badges?: IBadge[];
  lastActiveDate?: string;
  streakFreezes: number; // Added explicitly
  
  // Settings
  savedArticles: string[]; 
  notificationsEnabled: boolean;
  fcmToken?: string | null;
  
  createdAt?: string; // Added for Admin display
}

// --- NEW: User Stats Interface (The Intelligence Layer) ---
export interface IUserStats {
  userId: string;
  totalTimeSpent: number; // seconds (LIFETIME)
  articlesReadCount: number; // True Reads
  averageAttentionSpan: number; // seconds
  engagementScore: number;
  
  // Personalization Data
  leanExposure: {
    Left: number;
    Center: number;
    Right: number;
  };
  topicInterest: Record<string, number>;
  negativeInterest: Record<string, number>;
  
  // NEW: Daily Progress (Resets daily on backend)
  dailyStats?: {
    date: string;
    timeSpent: number;   // seconds (TODAY)
    articlesRead: number;
    goalsMet: boolean;
  };

  activityByHour: Record<string, number>;
  lastUpdated: string;
}

// --- 5. Filters & Search ---
export interface IFilters {
  category?: string;
  lean?: string;
  region?: string;
  articleType?: string;
  quality?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  // Added fields to fix build errors:
  sentiment?: string;
  politicalLean?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  // NEW: Topic Filter
  topic?: string | null; 
}

export interface ISearchResponse {
  articles: FeedItem[];
  pagination: {
    total: number;
  };
}

// --- 6. Admin Interfaces (NEW) ---

export interface ISystemConfig {
  _id: string;
  key: string;
  value: any; // Updated: Now allows Objects/Strings/Arrays (Mixed)
  description?: string; // Updated: Added description field
  lastUpdated: string;
}

export interface IPrompt {
  _id: string;
  type: string;
  text: string;
  active: boolean;
  version: number;
  description?: string;
}
