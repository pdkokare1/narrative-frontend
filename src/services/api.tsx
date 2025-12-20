// src/services/api.tsx
// This file now acts as a central export point (Barrel File)
// to maintain backward compatibility with imports.

import api from './axiosInstance';

export default api; // Default export for the axios instance

export * from './articleService';
export * from './userService';
export * from './logService';
export * from './axiosInstance';
