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
  
  biasScore?: number;
  credibilityScore?: number;
  reliabilityScore?: number;
  trustScore?: number;
  credibilityGrade?: string;
  
  clusterId?: number;
  clusterCount?: number;
  clusterTopic?: string;
  
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
