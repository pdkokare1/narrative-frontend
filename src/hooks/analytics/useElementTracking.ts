// src/hooks/analytics/useElementTracking.ts
import { useEffect, MutableRefObject } from 'react';
import { SessionData } from '../../config/analyticsConfig';

export const useElementTracking = (
  sessionRef: MutableRefObject<SessionData>,
  contentId: string | undefined,
  locationPath: string
) => {
  useEffect(() => {
    // Only run if we are on content that supports granular tracking
    if (!contentId) return;

    // WeakMap to track start times for elements currently in view
    const visibleElements = new Map<string, number>();

    const observer = new IntersectionObserver((entries) => {
        const now = Date.now();

        entries.forEach(entry => {
            const trackId = entry.target.getAttribute('data-track-id');
            if (!trackId) return;

            if (entry.isIntersecting) {
                // Started looking at this element
                visibleElements.set(trackId, now);
            } else {
                // Stopped looking
                const startTime = visibleElements.get(trackId);
                if (startTime) {
                    const duration = (now - startTime) / 1000; // in seconds
                    sessionRef.current.heatmap[trackId] = (sessionRef.current.heatmap[trackId] || 0) + duration;
                    visibleElements.delete(trackId);
                }
            }
        });
    }, { threshold: 0.5 }); // Count it if 50% of the element is visible

    // Find all trackable elements
    const elements = document.querySelectorAll('[data-track-id]');
    elements.forEach(el => observer.observe(el));

    return () => {
        observer.disconnect();
        visibleElements.clear();
    };
  }, [contentId, locationPath]); // Re-run when content or route changes
};
