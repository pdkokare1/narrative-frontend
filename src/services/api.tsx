// src/services/api.tsx
import api from './axiosInstance';
import { IArticle } from '../types'; // Ensuring types are imported if needed

// --- WEATHER ---
export const getWeather = (lat: number, lon: number) => {
    return api.get(`/weather?lat=${lat}&lon=${lon}`);
};

// --- MISC / TRENDS ---
export const getTrendingTopics = () => {
    return api.get('/articles/trends');
};

// --- EMERGENCY ---
export const fetchEmergencyContacts = (params?: any) => {
    return api.get('/emergency/contacts', { params });
};

// --- AUDIO / TTS ---
// UPDATED: Added prefetch parameter to support background generation
export const getAudio = (text: string, voiceId: string, articleId?: string, prefetch: boolean = false) => {
    return api.post('/tts/get-audio', { text, voiceId, articleId, prefetch });
};

export default api; 
export * from './articleService';
export * from './userService';
export * from './logService';
export * from './axiosInstance';
