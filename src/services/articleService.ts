import api from './axiosInstance';
import offlineStorage from './offlineStorage';
import { IArticle, ISearchResponse, IFilters } from '../types';
import { AxiosResponse } from 'axios';

// 1. Fetch Articles
export const fetchArticles = async (params: IFilters) => {
  try {
    const response = await api.get<ISearchResponse>('/articles', { params });
    const isDefaultFeed = params.offset === 0 && 
                          (!params.category || params.category === 'All Categories') &&
                          (!params.lean || params.lean === 'All Leans');

    if (isDefaultFeed) {
      offlineStorage.save('latest-feed-default', response.data);
    }
    return response;
  } catch (error) {
    const isDefaultFeed = params.offset === 0;
    if (isDefaultFeed) {
      const cachedData = await offlineStorage.get('latest-feed-default');
      if (cachedData) {
        console.log("⚠️ Network failed. Serving offline feed.");
        return { data: cachedData } as AxiosResponse<ISearchResponse>; 
      }
    }
    throw error; 
  }
};

// 2. Fetch For You
export const fetchForYouArticles = async () => {
  try {
    const response = await api.get<{ articles: IArticle[], meta: any }>('/articles/for-you');
    offlineStorage.save('for-you-feed', response.data);
    return response;
  } catch (error) {
    const cachedData = await offlineStorage.get('for-you-feed');
    if (cachedData) {
      console.log("⚠️ Network failed. Serving offline 'For You' feed.");
      return { data: cachedData } as AxiosResponse<{ articles: IArticle[], meta: any }>;
    }
    throw error;
  }
};

// 3. Fetch Personalized Feed (NEW)
export const fetchPersonalizedArticles = async () => {
  try {
    const response = await api.get<{ articles: IArticle[], meta: any }>('/articles/personalized');
    return response;
  } catch (error) {
    throw error;
  }
};

// --- Standard Methods ---
export const searchArticles = (query: string, params?: IFilters) => 
  api.get<ISearchResponse>('/search', { params: { q: query, ...params } });

export const fetchSavedArticles = () => api.get<{ articles: IArticle[] }>('/articles/saved');
export const saveArticle = (id: string) => api.post<{ message: string, savedArticles: string[] }>(`/articles/${id}/save`);

// Trending Topics
export const getTrendingTopics = () => api.get<{ topics: any[] }>('/trending');

// Cluster
export const fetchCluster = (id: number) => api.get<any>(`/cluster/${id}`);

// Emergency Resources
export const fetchEmergencyContacts = (params: any) => api.get('/emergency-resources', { params });

// Audio Services
export const getAudio = async (text: string, voiceId: string, articleId: string) => {
    return api.post<{ audioUrl: string }>('/tts/get-audio', { text, voiceId, articleId });
};

export const prefetchAudio = (text: string, voiceId: string, articleId: string) => {
    api.post('/tts/get-audio', { text, voiceId, articleId }).catch(err => 
      console.log(`Prefetch skipped for ${articleId}:`, err.message)
    );
};
