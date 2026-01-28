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
            // OPTIMIZATION: Zone Binning (Grouping)
            // Instead of sending raw ID, check if we can bin it to reduce cardinality
            let trackId = entry.target.getAttribute('data-track-id');
            
            if (!trackId) {
                // Auto-generate Zone ID if no explicit track ID
                // e.g., "zone-1", "zone-5" (based on page position)
                const rect = entry.target.getBoundingClientRect();
                const docHeight = document.documentElement.scrollHeight;
                const absoluteTop = window.scrollY + rect.top;
                
                if (docHeight > 0) {
                    const pct = absoluteTop / docHeight;
                    const zone = Math.min(Math.ceil(pct * 10), 10); // 1-10
                    trackId = `zone-${zone}`;
                }
            }
            
            if (!trackId) return;

            if (entry.isIntersecting) {
                // Started looking at this element
                visibleElements.set(trackId, now);

                // Update Drop-off Point (Last valid thing seen)
                sessionRef.current.lastVisibleElementId = trackId;

            } else {
                // Stopped looking
                const startTime = visibleElements.get(trackId);
                if (startTime) {
                    const duration = (now - startTime) / 1000; // in seconds
                    
                    // Accumulate Delta
                    sessionRef.current.heatmap[trackId] = (sessionRef.current.heatmap[trackId] || 0) + duration;
                    
                    visibleElements.delete(trackId);
                }
            }
        });
    }, { threshold: 0.5 }); // Count it if 50% of the element/zone is visible

    // Strategy 1: Explicit Tracking (High Precision)
    const elements = document.querySelectorAll('[data-track-id]');
    
    // Strategy 2: Implicit Zoning (Low Precision, High Efficiency)
    // If no explicit elements, observe section tags or paragraphs
    if (elements.length === 0) {
        const structuralElements = document.querySelectorAll('section, p');
        structuralElements.forEach(el => observer.observe(el));
    } else {
        elements.forEach(el => observer.observe(el));
    }

    return () => {
        observer.disconnect();
        visibleElements.clear();
    };
  }, [contentId, locationPath]); // Re-run when content or route changes
};
