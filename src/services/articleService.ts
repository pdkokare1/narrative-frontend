// src/services/articleService.ts
import apiClient from './axiosInstance';
import { Article, CoverageResponse, FeedItem, IArticle } from '../types';

// --- Fetch Articles (Feed) ---
export const fetchArticles = async (params?: any) => {
  return apiClient.get<{ articles: IArticle[]; pagination: any }>('/articles', { params });
};

// --- Search ---
export const searchArticles = async (query: string, params?: any) => {
  return apiClient.get<{ articles: FeedItem[]; pagination: any }>('/articles/search', {
    params: { q: query, ...params }
  });
};

// --- For You / Personalized ---
export const fetchForYouArticles = async () => {
  return apiClient.get<{ articles: IArticle[] }>('/articles/for-you');
};

export const fetchPersonalizedArticles = async () => {
  return apiClient.get<{ articles: IArticle[] }>('/articles/personalized');
};

// --- Saved Articles ---
export const fetchSavedArticles = async () => {
  return apiClient.get<{ articles: IArticle[] }>('/users/saved-articles');
};

export const saveArticle = async (id: string) => {
  const response = await apiClient.post(`/users/saved-articles/${id}`);
  return response.data;
};

export const unsaveArticle = async (id: string) => {
  const response = await apiClient.delete(`/users/saved-articles/${id}`);
  return response.data;
};

// --- Single Article & Analysis ---
export const getArticleById = async (id: string) => {
  const response = await apiClient.get<Article>(`/articles/${id}`);
  return response.data;
};

export const getCoverageAnalysis = async (id: string) => {
  const response = await apiClient.get<CoverageResponse>(`/articles/${id}/coverage`);
  return response.data;
};

export const analyzeBias = async (text: string) => {
  const response = await apiClient.post('/analysis/bias', { text });
  return response.data;
};

// --- Clusters / Narratives ---
// NEW: Fetch full cluster data (Timeline) for a narrative
export const getClusterById = async (clusterId: number) => {
  // Returns { left: [], center: [], right: [], reviews: [], stats: {} }
  return apiClient.get<any>(`/cluster/${clusterId}`);
};

// Legacy Object Export (for backward compatibility if needed locally)
export const articleService = {
  fetchArticles,
  getArticles: fetchArticles, // Alias
  searchArticles,
  fetchForYouArticles,
  fetchPersonalizedArticles,
  fetchSavedArticles,
  saveArticle,
  unsaveArticle,
  getArticleById,
  getCoverageAnalysis,
  analyzeBias,
  getClusterById
};
