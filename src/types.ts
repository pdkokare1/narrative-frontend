// src/types.ts

// --- 1. Badge Interface (Gamification) ---
export interface IBadge {
  id: string;        
  label: string;     
  icon: string;      
  description: string;
  earnedAt: string;  
}

// --- 2. Article Interface ---
export interface IArticle {
  _id: string;
  type?: 'Article'; // Added discriminator
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

// --- 3. Narrative Interface (NEW: The Story Bundle) ---
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

// Union Type for Feed (NEW)
export type FeedItem = IArticle | INarrative;

// --- 4. User Profile Interface ---
export interface IUserProfile {
  userId: string;
  username: string;
  email: string;
  
  // Stats
  articlesViewedCount: number;
  comparisonsViewedCount: number;
  articlesSharedCount: number;
  
  // Gamification 
  currentStreak?: number;
  badges?: IBadge[];
  
  // Settings
  savedArticles: string[]; 
  notificationsEnabled: boolean;
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
}

export interface ISearchResponse {
  articles: FeedItem[]; // Updated to accept both types
  pagination: {
    total: number;
  };
}
