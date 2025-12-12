// In file: src/services/api.js
import axios from 'axios';
import { auth, appCheck } from '../firebaseConfig';
import { getToken } from "firebase/app-check";
import offlineStorage from './offlineStorage'; // <--- NEW IMPORT

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      // 1. Add Auth Token
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      
      // 2. Add App Check Token
      if (appCheck) {
        try {
          const appCheckTokenResponse = await getToken(appCheck, false);
          config.headers['X-Firebase-AppCheck'] = appCheckTokenResponse.token;
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
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    const cleanError = new Error(message);
    cleanError.status = error.response?.status;
    cleanError.original = error;

    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized.");
    }

    return Promise.reject(cleanError);
  }
);

// --- API Methods ---

// 1. Fetch Articles (With Offline Support)
export const fetchArticles = async (params) => {
  try {
    // Try Network First
    const response = await api.get('/articles', { params });
    
    // If this is the FIRST page (offset 0) and NO filters are active, cache it!
    // We only cache the "Default" view to keep it simple.
    const isDefaultFeed = params.offset === 0 && 
                          (!params.category || params.category === 'All Categories') &&
                          (!params.lean || params.lean === 'All Leans');

    if (isDefaultFeed) {
      offlineStorage.save('latest-feed-default', response.data);
    }

    return response;

  } catch (error) {
    // Network Failed? Check Cache.
    const isDefaultFeed = params.offset === 0;
    if (isDefaultFeed) {
      const cachedData = await offlineStorage.get('latest-feed-default');
      if (cachedData) {
        console.log("⚠️ Network failed. Serving offline feed.");
        // Return cached data wrapped in an Axios-like object
        return { data: cachedData }; 
      }
    }
    throw error; // If no cache, throw real error
  }
};

// 2. Fetch For You (With Offline Support)
export const fetchForYouArticles = async () => {
  try {
    const response = await api.get('/articles/for-you');
    offlineStorage.save('for-you-feed', response.data);
    return response;
  } catch (error) {
    const cachedData = await offlineStorage.get('for-you-feed');
    if (cachedData) {
      console.log("⚠️ Network failed. Serving offline 'For You' feed.");
      return { data: cachedData };
    }
    throw error;
  }
};

// --- Standard Methods (No Offline needed or simple passthrough) ---
export const searchArticles = (query, params) => api.get('/search', { params: { q: query, ...params } });
export const fetchSavedArticles = () => api.get('/articles/saved');
export const saveArticle = (id) => api.post(`/articles/${id}/save`);

// Trending Topics
export const getTrendingTopics = () => api.get('/trending');

// Profile & Stats
export const getProfile = () => api.get('/profile/me');
export const getStats = () => api.get('/profile/stats');
export const getWeeklyDigest = () => api.get('/profile/weekly-digest');
export const createProfile = (data) => api.post('/profile', data);

// Activity Logs
export const logView = (id) => api.post('/activity/log-view', { articleId: id });
export const logCompare = (id) => api.post('/activity/log-compare', { articleId: id });
export const logShare = (id) => api.post('/activity/log-share', { articleId: id });
export const logRead = (id) => api.post('/activity/log-read', { articleId: id });

// Cluster
export const fetchCluster = (id) => api.get(`/cluster/${id}`);

// Emergency Resources
export const fetchEmergencyContacts = (params) => api.get('/emergency-resources', { params });

// Audio Services
export const getAudio = async (text, voiceId, articleId) => {
    return api.post('/tts/get-audio', { text, voiceId, articleId });
};

// Audio Pre-fetching
export const prefetchAudio = (text, voiceId, articleId) => {
    api.post('/tts/get-audio', { text, voiceId, articleId }).catch(err => 
      console.log(`Prefetch skipped for ${articleId}:`, err.message)
    );
};

export default api;
