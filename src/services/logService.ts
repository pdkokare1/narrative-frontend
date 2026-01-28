// src/services/logService.ts
import { auth } from '../firebaseConfig';
// Removed axios/fetch import as we now dispatch events to the central tracker

// --- ANALYTICS: Event Bus Implementation ---
// Replaces direct HTTP calls with CustomEvents to allow Client-Side Batching
// in useActivityTracker.ts
const dispatchAnalyticsEvent = (eventType: string, data: any) => {
    // We wrap in a try-catch to ensure no errors propagate to UI
    try {
        const event = new CustomEvent('narrative-standard-log', {
            detail: {
                eventType, // e.g. 'view_analysis', 'share_article'
                data
            }
        });
        window.dispatchEvent(event);
    } catch (err) {
        console.warn('Analytics Dispatch Failed:', err);
    }
    
    // Return resolved promise to maintain compatibility with existing 'await' calls
    return Promise.resolve();
};

export const logView = (id: string) => dispatchAnalyticsEvent('view_analysis', { articleId: id });
export const logCompare = (id: string) => dispatchAnalyticsEvent('view_comparison', { articleId: id });
export const logShare = (id: string) => dispatchAnalyticsEvent('share_article', { articleId: id });
export const logRead = (id: string) => dispatchAnalyticsEvent('read_external', { articleId: id });
