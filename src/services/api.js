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

// --- REQUEST INTERCEPTOR: Automatically adds Tokens ---
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

// --- RESPONSE INTERCEPTOR: Centralized Error Formatting ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Extract the actual error message from the backend response
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    
    // 2. Create a clean error object to pass back to the component
    const cleanError = new Error(message);
    cleanError.status = error.response?.status;
    cleanError.original = error;

    // 3. Log 401/403 errors (Optional: You could trigger a global logout here later)
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized.");
    }

    return Promise.reject(cleanError);
  }
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

// Audio Services
export const getAudio = async (text, voiceId, articleId) => {
    return api.post('/tts/get-audio', { text, voiceId, articleId });
};

// --- NEW: Audio Pre-fetching ---
// This tells the backend to generate the audio in the background, but doesn't wait for the file.
export const prefetchAudio = (text, voiceId, articleId) => {
    // We use 'catch' to suppress errors because prefetching is a background task.
    // We don't want to alert the user if a prefetch fails.
    api.post('/tts/get-audio', { text, voiceId, articleId }).catch(err => 
      console.log(`Prefetch skipped for ${articleId}:`, err.message)
    );
};

export default api;
