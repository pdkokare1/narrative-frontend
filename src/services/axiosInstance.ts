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
}

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
    
    // Check if error is 401 (Unauthorized) and we haven't retried yet
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
    }
    }

    const message = (error.response?.data as any)?.message || (error.response?.data as any)?.error || error.message;
    const cleanError: any = new Error(message);
    cleanError.status = error.response?.status;
    cleanError.original = error;

    return Promise.reject(cleanError);
  }
);

export default api;
