// src/types.ts

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
  publishedAt: string; // Dates often come as strings from JSON
  
  analysisType: 'Full' | 'SentimentOnly';
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  
  // Scores
  biasScore?: number;
  biasComponents?: any; // Added to fix build error

  credibilityScore?: number;
  credibilityGrade?: string;
  credibilityComponents?: any; // Added to fix build error

  reliabilityScore?: number;
  reliabilityGrade?: string;
  reliabilityComponents?: any; // Added to fix build error

  trustScore?: number;
  
  // Clustering
  clusterId?: number;
  clusterCount?: number;
  clusterTopic?: string;
  
  // Content
  keyFindings?: string[];
  recommendations?: string[];
  suggestionType?: 'Comfort' | 'Challenge';
}

export interface IUserProfile {
  userId: string;
  username: string;
  email: string;
  articlesViewedCount: number;
  comparisonsViewedCount: number;
  articlesSharedCount: number;
  savedArticles: string[]; // List of IDs
  notificationsEnabled: boolean;
}

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
