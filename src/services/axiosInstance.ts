// src/services/axiosInstance.ts
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { auth, appCheck } from '../firebaseConfig';
import { getToken } from "firebase/app-check";

// FORCE PRODUCTION URL IF ENV IS MISSING (Common Android Issue)
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.thegamut.in/api';

console.log("🚀 API Initialized at:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, 
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
    // Safety check for auth
    if (auth && auth.currentUser) {
      try {
          const token = await auth.currentUser.getIdToken();
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
      } catch (e) {
          console.warn("Failed to get ID token", e);
      }
      
      // App Check 
      if (appCheck) {
        try {
          const appCheckTokenResponse = await getToken(appCheck, false);
          if (config.headers) {
            config.headers['X-Firebase-AppCheck'] = appCheckTokenResponse.token;
          }
        } catch (err) {
           // Silent fail for App Check in dev
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
    
    // Log the error for debugging
    console.error(`❌ API Error [${error.response?.status}]:`, error.message, error.response?.data);

    originalRequest._retryCount = originalRequest._retryCount || 0;

    // --- CASE 1: 401 Unauthorized ---
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        if (auth && auth.currentUser) {
            const newToken = await auth.currentUser.getIdToken(true);
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
        }
      } catch (refreshError: any) {
         // Force logout only if it's strictly an auth issue, not network
         if (refreshError?.code !== 'auth/network-request-failed') {
             await auth.signOut();
             window.location.href = '/login';
         }
         return Promise.reject(refreshError);
      }
    }

    // --- CASE 2: Retryable Errors (429, 503) ---
    if ((error.response?.status === 429 || error.response?.status === 503) && originalRequest._retryCount < 2) {
        originalRequest._retryCount += 1;
        await wait(1500); 
        return api(originalRequest);
    }

    // Pass through the error
    return Promise.reject(error);
  }
);

export default api;
