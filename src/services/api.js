// In file: src/services/api.js
import axios from 'axios';
import { auth, appCheck } from '../firebaseConfig';
import { getToken } from "firebase/app-check";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptor: Automatically adds Tokens to every request ---
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      // 1. Add Auth Token
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      
      // 2. Add App Check Token (Security)
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

// --- API Methods ---

// Articles
export const fetchArticles = (params) => api.get('/articles', { params });
export const fetchForYouArticles = () => api.get('/articles/for-you');
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

// --- NEW: TTS (Audio) Streaming ---
export const streamAudio = async (text, voiceId) => {
    // We use responseType 'blob' because we are receiving binary audio data
    return api.post('/tts/stream', { text, voiceId }, { responseType: 'blob' });
};

export default api;
