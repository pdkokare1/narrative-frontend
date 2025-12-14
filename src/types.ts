// src/types.ts

// --- 1. Badge Interface (Gamification) ---
export interface IBadge {
  id: string;        // e.g., 'streak_5'
  label: string;     // e.g., '5 Day Streak'
  icon: string;      // e.g., '🔥'
  description: string;
  earnedAt: string;  // Dates come as strings from JSON API
}

// --- 2. Article Interface ---
export interface IArticle {
  _id: string;
  headline: string;
  summary: string;
  source: string;
  category: string;
  politicalLean: string;
  url: string;
  imageUrl?: string;
  audioUrl?: string | null;
  publishedAt: string; 
  
  analysisType: 'Full' | 'SentimentOnly';
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  
  // Scores
  biasScore?: number;
  biasComponents?: any; 

  credibilityScore?: number;
  credibilityGrade?: string;
  credibilityComponents?: any; 

  reliabilityScore?: number;
  reliabilityGrade?: string;
  reliabilityComponents?: any; 

  trustScore?: number;
  
  // Clustering
  clusterId?: number;
  clusterCount?: number;
  clusterTopic?: string;
  primaryNoun?: string;
  secondaryNoun?: string;
  
  // Content
  keyFindings?: string[];
  recommendations?: string[];
  suggestionType?: 'Comfort' | 'Challenge';
}

// --- 3. User Profile Interface ---
export interface IUserProfile {
  userId: string;
  username: string;
  email: string;
  
  // Stats
  articlesViewedCount: number;
  comparisonsViewedCount: number;
  articlesSharedCount: number;
  
  // Gamification (NEW)
  currentStreak?: number;
  badges?: IBadge[];
  
  // Settings
  savedArticles: string[]; 
  notificationsEnabled: boolean;
}

// --- 4. Filters & Search ---
export interface IFilters {
  category?: string;
  lean?: string;
  region?: string;
  articleType?: string;
  quality?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface ISearchResponse {
  articles: IArticle[];
  pagination: {
    total: number;
  };
}
