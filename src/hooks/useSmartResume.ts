// src/hooks/useSmartResume.ts
import { useCallback } from 'react';

const STORAGE_KEY = 'narrative_reading_progress';

interface ProgressRecord {
    articleId: string;
    scrollPercent: number; // 0-100
    timestamp: number;
    status: 'read' | 'skimmed' | 'partial';
}

export const useSmartResume = () => {

    // 1. Save Progress (Called by Analytics Tracker)
    const saveProgress = useCallback((articleId: string, scrollPercent: number, status: 'read' | 'skimmed' | 'partial') => {
        try {
            const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            
            // Only update if we are deeper than before or if status improved
            const prev = store[articleId] as ProgressRecord;
            if (prev && prev.scrollPercent > scrollPercent) {
                return; // Don't overwrite deep progress with top-of-page
            }

            store[articleId] = {
                articleId,
                scrollPercent,
                timestamp: Date.now(),
                status
            };

            // Cleanup: Keep only last 50 items to save space
            const keys = Object.keys(store);
            if (keys.length > 50) {
                delete store[keys[0]]; 
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch (e) {
            console.warn('Smart Resume Save Failed', e);
        }
    }, []);

    // 2. Get Progress (Called by ArticleCard or Page)
    const getProgress = useCallback((articleId: string): ProgressRecord | null => {
        try {
            const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return store[articleId] || null;
        } catch (e) {
            return null;
        }
    }, []);

    // 3. Auto Scroll (The Action)
    const autoResume = useCallback((articleId: string) => {
        const progress = getProgress(articleId);
        if (!progress || progress.scrollPercent < 5) return; // Don't jump if barely started

        // Calculate Pixel Position
        const docHeight = document.documentElement.scrollHeight;
        const targetY = (progress.scrollPercent / 100) * docHeight;

        // Smooth Scroll
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }, [getProgress]);

    return { saveProgress, getProgress, autoResume };
};

export default useSmartResume;
