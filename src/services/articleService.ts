import apiClient from './axiosInstance';
import { Article, CoverageResponse } from '../types';

export const articleService = {
  // Get all articles with optional filters
  getArticles: async (params?: any) => {
    const response = await apiClient.get<Article[]>('/articles', { params });
    return response.data;
  },

  // Get a single article by ID
  getArticleById: async (id: string) => {
    const response = await apiClient.get<Article>(`/articles/${id}`);
    return response.data;
  },

  // Get coverage analysis for an article
  // This matches the hook in CompareCoverageModal
  getCoverageAnalysis: async (id: string) => {
    // Ensure this endpoint matches your backend route
    const response = await apiClient.get<CoverageResponse>(`/articles/${id}/coverage`);
    return response.data;
  },

  // Save an article
  saveArticle: async (id: string) => {
    const response = await apiClient.post(`/users/saved-articles/${id}`);
    return response.data;
  },

  // Unsave an article
  unsaveArticle: async (id: string) => {
    const response = await apiClient.delete(`/users/saved-articles/${id}`);
    return response.data;
  },

  // Check bias of specific text (if needed separately)
  analyzeBias: async (text: string) => {
    const response = await apiClient.post('/analysis/bias', { text });
    return response.data;
  }
};
