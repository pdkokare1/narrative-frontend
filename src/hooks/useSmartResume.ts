// src/hooks/useSmartResume.ts
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'narrative_reading_progress';

interface ProgressRecord {
    articleId: string;
    scrollPercent: number; // 0-100
    timestamp: number;
    status: 'read' | 'skimmed' | 'partial';
}

interface SmartResumeOptions {
    articleId?: string;
    minScrollThreshold?: number;
    scrollRef?: React.RefObject<HTMLElement>;
}

export const useSmartResume = (options: SmartResumeOptions = {}) => {
    const [resumePosition, setResumePosition] = useState<number | null>(null);

    // 1. Get Progress (Helper)
    const getProgress = useCallback((articleId: string): ProgressRecord | null => {
        try {
            const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return store[articleId] || null;
        } catch (e) {
            return null;
        }
    }, []);

    // 2. Save Progress (Exposed for Trackers)
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

    // 3. Initialize / Check for Resume (Reactive to articleId)
    useEffect(() => {
        if (options.articleId) {
            const progress = getProgress(options.articleId);
            // Default threshold 5% if not provided
            if (progress && progress.scrollPercent > 5) {
                setResumePosition(progress.scrollPercent);
            } else {
                setResumePosition(null);
            }
        }
    }, [options.articleId, getProgress]);

    // 4. Handle Resume (Scroll Logic)
    const handleResume = useCallback(() => {
        if (!options.articleId || !resumePosition) return;

        // Determine scroll target: Ref element or Window
        const container = options.scrollRef?.current || document.documentElement;
        
        // Calculate target pixels from saved percentage
        const scrollHeight = container.scrollHeight;
        const targetY = (resumePosition / 100) * scrollHeight;

        if (options.scrollRef?.current) {
             options.scrollRef.current.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo({
                top: targetY,
                behavior: 'smooth'
            });
        }
    }, [resumePosition, options.articleId, options.scrollRef]);

    // 5. Legacy Auto Resume (keeping for backward compatibility)
    const autoResume = useCallback((articleId: string) => {
        const progress = getProgress(articleId);
        if (!progress || progress.scrollPercent < 5) return;

        const docHeight = document.documentElement.scrollHeight;
        const targetY = (progress.scrollPercent / 100) * docHeight;

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }, [getProgress]);

    return { 
        saveProgress, 
        getProgress, 
        autoResume, 
        resumePosition, 
        handleResume 
    };
};

export default useSmartResume;
