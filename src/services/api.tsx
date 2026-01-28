// src/services/api.tsx
import api from './axiosInstance';
import { IArticle } from '../types'; 

// --- WEATHER ---
export const getWeather = (lat: number, lon: number) => {
    return api.get(`/weather?lat=${lat}&lon=${lon}`);
};

// --- MISC / TRENDS ---
export const getTrendingTopics = () => {
    return api.get('/trending');
};

// --- EMERGENCY ---
export const fetchEmergencyContacts = (params?: any) => {
    return api.get('/emergency/contacts', { params });
};

// --- AUDIO / TTS ---
export const getAudio = (text: string, voiceId: string, articleId?: string, prefetch: boolean = false) => {
    return api.post('/tts/get-audio', { text, voiceId, articleId, prefetch });
};

// --- ANALYTICS ---
// NEW: Log Search Intent (Batched via Event Bus)
export const logSearch = (query: string, sessionId: string) => {
    // Dispatch event to be caught by useActivityTracker
    const event = new CustomEvent('narrative-standard-log', {
        detail: {
            eventType: 'search',
            data: { query, sessionId }
        }
    });
    window.dispatchEvent(event);
    
    return Promise.resolve();
};

export default api; 
export * from './articleService';
export * from './userService';
export * from './logService';
export * from './axiosInstance';
