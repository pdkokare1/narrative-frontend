// src/services/articleService.ts
import apiClient from './axiosInstance';
import { Article, CoverageResponse, FeedItem, IArticle } from '../types';

// --- 1. Main Feed (Triple Zone) ---
export const fetchArticles = async (params?: any) => {
  return apiClient.get<{ articles: IArticle[]; pagination: any }>('/articles', { params });
};

// --- 2. In Focus (Narratives) ---
export const fetchInFocusArticles = async (params?: any) => {
  return apiClient.get<{ articles: FeedItem[]; meta: any }>('/articles/infocus', { params });
};

// --- 3. Balanced (Anti-Echo) ---
export const fetchBalancedArticles = async () => {
  return apiClient.get<{ articles: IArticle[]; meta: any }>('/articles/balanced');
};

// --- Legacy / Personalized ---
export const fetchPersonalizedArticles = async () => {
  return apiClient.get<{ articles: IArticle[] }>('/articles/personalized');
};

// --- Search ---
export const searchArticles = async (query: string, params?: any) => {
  return apiClient.get<{ articles: FeedItem[]; pagination: any }>('/articles/search', {
    params: { q: query, ...params }
  });
};

// --- Saved ---
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

// --- Single Article ---
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

export const getClusterById = async (clusterId: number) => {
  return apiClient.get<any>(`/cluster/${clusterId}`);
};

// Legacy Export
export const articleService = {
  fetchArticles,
  fetchInFocusArticles, 
  fetchBalancedArticles, 
  fetchPersonalizedArticles,
  fetchSavedArticles,
  saveArticle,
  unsaveArticle,
  getArticleById,
  getCoverageAnalysis,
  analyzeBias,
  getClusterById
};
