// src/services/api.tsx
import api from './axiosInstance';

// --- WEATHER ---
export const getWeather = (lat: number, lon: number) => {
    return api.get(`/weather?lat=${lat}&lon=${lon}`);
};

// --- MISC / TRENDS ---
export const getTrendingTopics = () => {
    return api.get('/articles/trends');
};

// --- EMERGENCY ---
// Fixed: Now accepts optional params to match usage in EmergencyResources.tsx
export const fetchEmergencyContacts = (params?: any) => {
    return api.get('/emergency/contacts', { params });
};

// --- AUDIO / TTS ---
export const getAudio = (text: string, voiceId: string, articleId?: string) => {
    // UPDATED: Changed from '/tts/generate' to '/tts/get-audio' to match backend routes
    return api.post('/tts/get-audio', { text, voiceId, articleId });
};

export default api; 
export * from './articleService';
export * from './userService';
export * from './logService';
export * from './axiosInstance';
