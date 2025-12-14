// src/services/api.ts
import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { auth, appCheck } from '../firebaseConfig';
import { getToken } from "firebase/app-check";
import offlineStorage from './offlineStorage';
import { IArticle, IUserProfile, ISearchResponse, IFilters } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const user = auth.currentUser;
    if (user) {
      // 1. Add Auth Token
      const token = await user.getIdToken();
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 2. Add App Check Token
      if (appCheck) {
        try {
          const appCheckTokenResponse = await getToken(appCheck, false);
          if (config.headers) {
            config.headers['X-Firebase-AppCheck'] = appCheckTokenResponse.token;
          }
        } catch (err) {
          console.warn('App Check token failed (dev mode?):', err);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    const cleanError: any = new Error(message);
    cleanError.status = error.response?.status;
    cleanError.original = error;

    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized.");
    }

    return Promise.reject(cleanError);
  }
);

// --- API Methods ---

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

// --- Standard Methods ---
export const searchArticles = (query: string, params?: IFilters) => 
  api.get<ISearchResponse>('/search', { params: { q: query, ...params } });

export const fetchSavedArticles = () => api.get<{ articles: IArticle[] }>('/articles/saved');
export const saveArticle = (id: string) => api.post<{ message: string, savedArticles: string[] }>(`/articles/${id}/save`);

// Trending Topics
export const getTrendingTopics = () => api.get<{ topics: any[] }>('/trending');

// Profile & Stats
export const getProfile = () => api.get<IUserProfile>('/profile/me');
export const getStats = () => api.get<any>('/profile/stats');
export const getWeeklyDigest = () => api.get<any>('/profile/weekly-digest');
export const createProfile = (data: { username: string }) => api.post<IUserProfile>('/profile', data);
export const deleteAccount = () => api.delete('/profile'); // NEW: Update 9

// Notification Token
export const saveNotificationToken = (token: string) => api.post('/profile/save-token', { token });

// Activity Logs
export const logView = (id: string) => api.post('/activity/log-view', { articleId: id });
export const logCompare = (id: string) => api.post('/activity/log-compare', { articleId: id });
export const logShare = (id: string) => api.post('/activity/log-share', { articleId: id });
export const logRead = (id: string) => api.post('/activity/log-read', { articleId: id });

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

export default api;
