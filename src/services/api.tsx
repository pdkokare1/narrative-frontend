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
export const fetchEmergencyContacts = () => {
    return api.get('/emergency/contacts');
};

// --- AUDIO / TTS ---
export const getAudio = (text: string, voiceId: string, articleId?: string) => {
    return api.post('/tts/generate', { text, voiceId, articleId });
};

export default api; 
export * from './articleService';
export * from './userService';
export * from './logService';
export * from './axiosInstance';
