// src/services/adminService.ts
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { IArticle } from '../types';

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
    // Placeholder if you don't have a dedicated stats endpoint yet,
    // we can fetch users/articles counts separately or use the stats service
    const headers = await getHeaders();
    return axios.get(`${API_URL}/admin/config`, headers); // Temporary check
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
  }
};
