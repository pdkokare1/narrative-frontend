// src/services/axiosInstance.ts
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { auth, appCheck } from '../firebaseConfig';
import { getToken } from "firebase/app-check";

// Default to real domain if env is missing, not localhost
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.thegamut.in/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // SAFETY CHECK: Ensure auth initialized successfully
    if (auth && auth.currentUser) {
      // 1. Add Auth Token
      try {
          const token = await auth.currentUser.getIdToken();
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
      } catch (e) {
          console.warn("Failed to get ID token", e);
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
    
    originalRequest._retryCount = originalRequest._retryCount || 0;

    // --- CASE 1: 401 Unauthorized (Token Expired) ---
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // SAFETY CHECK: Ensure auth exists
        if (auth && auth.currentUser) {
            console.log("🔄 Session expired. Refreshing token...");
            const newToken = await auth.currentUser.getIdToken(true);
            
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
        }
      } catch (refreshError: any) {
        console.error("Token refresh failed:", refreshError);
        
        if (refreshError?.code !== 'auth/network-request-failed') {
            try {
                if (auth) await auth.signOut();
            } catch (e) { /* ignore */ }
            window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // --- CASE 2: 429/503 (Rate Limit/Busy) ---
    if ((error.response?.status === 429 || error.response?.status === 503) && originalRequest._retryCount < 3) {
        originalRequest._retryCount += 1;
        const delay = originalRequest._retryCount * 1000; 
        console.log(`⚠️ Rate Limited/Busy. Retrying in ${delay}ms... (Attempt ${originalRequest._retryCount})`);
        
        await wait(delay);
        return api(originalRequest);
    }

    const message = (error.response?.data as any)?.message || (error.response?.data as any)?.error || error.message;
    const cleanError: any = new Error(message);
    cleanError.status = error.response?.status;
    cleanError.original = error;

    return Promise.reject(cleanError);
  }
);

export default api;
