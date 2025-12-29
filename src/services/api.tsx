// src/services/api.tsx
import api from './axiosInstance';

// Weather API Call
export const getWeather = (lat: number, lon: number) => {
    return api.get(`/weather?lat=${lat}&lon=${lon}`);
};

export default api; 
export * from './articleService';
export * from './userService';
export * from './logService';
export * from './axiosInstance';
