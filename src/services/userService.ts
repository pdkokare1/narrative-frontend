import api from './axiosInstance';
import { IUserProfile } from '../types';

// Profile & Stats
export const getProfile = () => api.get<IUserProfile>('/profile/me');
export const getStats = () => api.get<any>('/profile/stats');
export const getWeeklyDigest = () => api.get<any>('/profile/weekly-digest');
export const createProfile = (data: { username: string }) => api.post<IUserProfile>('/profile', data);
export const deleteAccount = () => api.delete('/profile'); 

// Notification Token
export const saveNotificationToken = (token: string) => api.post('/profile/save-token', { token });
