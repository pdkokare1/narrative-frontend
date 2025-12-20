import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { auth, appCheck } from '../firebaseConfig';
import { getToken } from "firebase/app-check";

// Default to real domain if env is missing, not localhost
export const API_URL = process.env.REACT_APP_API_URL || 'https://api.thegamut.in/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite retry loops
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

// Utility to pause execution (Backoff)
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;
    
    // Initialize retry count
    originalRequest._retryCount = originalRequest._retryCount || 0;

    // --- CASE 1: 401 Unauthorized (Token Expired) ---
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = auth.currentUser;
        if (user) {
            console.log("🔄 Session expired. Refreshing token...");
            const newToken = await user.getIdToken(true);
            
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Optional: Redirect to login here if refresh fails
      }
    }

    // --- CASE 2: 429 (Too Many Requests) or 503 (Server Busy) ---
    if ((error.response?.status === 429 || error.response?.status === 503) && originalRequest._retryCount < 3) {
        originalRequest._retryCount += 1;
        const delay = originalRequest._retryCount * 1000; // 1s, 2s, 3s
        console.log(`⚠️ Rate Limited/Busy. Retrying in ${delay}ms... (Attempt ${originalRequest._retryCount})`);
        
        await wait(delay);
        return api(originalRequest);
    }

    // Clean Error Handling for UI
    const message = (error.response?.data as any)?.message || (error.response?.data as any)?.error || error.message;
    const cleanError: any = new Error(message);
    cleanError.status = error.response?.status;
    cleanError.original = error;

    return Promise.reject(cleanError);
  }
);

export default api;
