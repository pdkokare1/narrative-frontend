// src/services/api.tsx
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { auth, appCheck } from '../firebaseConfig';
import { getToken } from "firebase/app-check";
import offlineStorage from './offlineStorage';
import { IArticle, IUserProfile, ISearchResponse, IFilters } from '../types';

// PRODUCTION FIX: Default to real domain if env is missing, not localhost
const API_URL = process.env.REACT_APP_API_URL || 'https://api.thegamut.in/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite retry loops
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const user = auth.currentUser;
    if (user) {
      // 1. Add Auth Token (This usually gets a valid token, but might be stale by seconds)
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
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;
    
    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = auth.currentUser;
        if (user) {
            // FORCE refresh the token from Firebase
            console.log("🔄 Session expired. Refreshing token...");
            const newToken = await user.getIdToken(true);
            
            // Update the header and retry the request
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // If refresh fails, user really needs to login again
      }
    }

    const message = (error.response?.data as any)?.message || (error.response?.data as any)?.error || error.message;
    const cleanError: any = new Error(message);
    cleanError.status = error.response?.status;
    cleanError.original = error;

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

// Profile & Stats
export const getProfile = () => api.get<IUserProfile>('/profile/me');
export const getStats = () => api.get<any>('/profile/stats');
export const getWeeklyDigest = () => api.get<any>('/profile/weekly-digest');
export const createProfile = (data: { username: string }) => api.post<IUserProfile>('/profile', data);
export const deleteAccount = () => api.delete('/profile'); 

// Notification Token
export const saveNotificationToken = (token: string) => api.post('/profile/save-token', { token });

// --- ANALYTICS: Beacon / Keepalive Implementation ---
// Replaces api.post for logs to ensure they survive page navigation
const sendBeaconRequest = async (endpoint: string, body: any) => {
    const url = `${API_URL}${endpoint}`;
    const user = auth.currentUser;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    if (user) {
        try {
            const token = await user.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        } catch (e) { /* Ignore token error for logs */ }
    }

    // Use fetch with keepalive: true (modern replacement for sendBeacon with headers support)
    try {
        fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            keepalive: true
        });
    } catch (err) {
        console.warn('Analytics Log Failed:', err);
    }
};

export const logView = (id: string) => sendBeaconRequest('/activity/log-view', { articleId: id });
export const logCompare = (id: string) => sendBeaconRequest('/activity/log-compare', { articleId: id });
export const logShare = (id: string) => sendBeaconRequest('/activity/log-share', { articleId: id });
export const logRead = (id: string) => sendBeaconRequest('/activity/log-read', { articleId: id });

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
