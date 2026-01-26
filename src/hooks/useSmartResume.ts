// src/hooks/useSmartResume.ts
import { useEffect, useState, useCallback, RefObject } from 'react';
import { useAuth } from '../context/AuthContext';
import { ANALYTICS_CONFIG } from '../config/analyticsConfig';

interface UseSmartResumeProps {
  articleId?: string;
  minScrollThreshold?: number; 
  scrollRef?: RefObject<HTMLElement>; // Optional: If scrolling a specific div instead of window
}

export const useSmartResume = ({ 
  articleId, 
  minScrollThreshold = 500,
  scrollRef
}: UseSmartResumeProps) => {
  const { user } = useAuth();
  const [resumePosition, setResumePosition] = useState<number | null>(null);

  // 1. Check for saved progress
  useEffect(() => {
    if (!user || !articleId) return;

    const checkProgress = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${ANALYTICS_CONFIG.API_URL}/analytics/user-stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return;

        const stats = await response.json();
        
        // Check readingProgress Map
        if (stats.readingProgress && stats.readingProgress[articleId]) {
            const savedPos = stats.readingProgress[articleId];
            if (savedPos > minScrollThreshold) {
                setResumePosition(savedPos);
            }
        }
      } catch (err) {
        console.warn('Failed to fetch reading progress', err);
      }
    };

    checkProgress();
  }, [user, articleId, minScrollThreshold]);

  // 2. Action to perform the scroll
  const handleResume = useCallback(() => {
    if (resumePosition) {
        if (scrollRef?.current) {
            // Scroll the container (Modal)
            scrollRef.current.scrollTo({
                top: resumePosition,
                behavior: 'smooth'
            });
        } else {
            // Scroll the window (Standard Page)
            window.scrollTo({
                top: resumePosition,
                behavior: 'smooth'
            });
        }
        setResumePosition(null); // Clear prompt after using
    }
  }, [resumePosition, scrollRef]);

  return { resumePosition, handleResume };
};
