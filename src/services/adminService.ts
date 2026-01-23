// src/services/adminService.ts
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { IArticle, IUserProfile, ISystemConfig, IPrompt } from '../types';

// Use environment variable or default to local/dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get Auth Token
const getHeaders = async () => {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const adminService = {
  // --- Dashboard ---
  getDashboardStats: async () => {
    // Uses config endpoint as a temporary health check/stats proxy
    const headers = await getHeaders();
    return axios.get(`${API_URL}/admin/config`, headers); 
  },

  // --- Newsroom (Articles) ---
  getAllArticles: async (page: number = 1, limit: number = 20) => {
    const headers = await getHeaders();
    return axios.get(`${API_URL}/admin/articles?page=${page}&limit=${limit}`, headers);
  },

  getArchivedArticles: async (page: number = 1, limit: number = 20) => {
    const headers = await getHeaders();
    return axios.get(`${API_URL}/admin/trash/articles?page=${page}&limit=${limit}`, headers);
  },

  createArticle: async (data: Partial<IArticle>) => {
    const headers = await getHeaders();
    return axios.post(`${API_URL}/admin/articles`, data, headers);
  },

  updateArticle: async (id: string, data: Partial<IArticle>) => {
    const headers = await getHeaders();
    return axios.patch(`${API_URL}/admin/articles/${id}`, data, headers);
  },

  archiveArticle: async (id: string) => {
    const headers = await getHeaders();
    return axios.delete(`${API_URL}/admin/articles/${id}`, headers);
  },

  restoreArticle: async (id: string) => {
    const headers = await getHeaders();
    return axios.post(`${API_URL}/admin/articles/${id}/restore`, {}, headers);
  },

  toggleVisibility: async (id: string) => {
    const headers = await getHeaders();
    return axios.post(`${API_URL}/admin/articles/${id}/toggle-visibility`, {}, headers);
  },

  // --- Users ---
  getAllUsers: async (page: number = 1, search: string = '') => {
    const headers = await getHeaders();
    return axios.get(`${API_URL}/admin/users?page=${page}&search=${search}`, headers);
  },

  updateUserStatus: async (id: string, data: Partial<IUserProfile>) => {
    const headers = await getHeaders();
    return axios.patch(`${API_URL}/admin/users/${id}`, data, headers);
  },

  // --- System Config ---
  getSystemConfigs: async () => {
    const headers = await getHeaders();
    return axios.get(`${API_URL}/admin/config`, headers);
  },

  updateSystemConfig: async (key: string, value: any) => {
    const headers = await getHeaders();
    return axios.post(`${API_URL}/admin/config`, { key, value }, headers);
  },

  // --- AI Prompts (The Brain) ---
  getSystemPrompts: async () => {
    const headers = await getHeaders();
    return axios.get(`${API_URL}/admin/prompts`, headers);
  },

  updateSystemPrompt: async (id: string, data: Partial<IPrompt>) => {
    const headers = await getHeaders();
    return axios.patch(`${API_URL}/admin/prompts/${id}`, data, headers);
  }
};
