import { auth } from '../firebaseConfig';
import { API_URL } from './axiosInstance';

// --- ANALYTICS: Beacon / Keepalive Implementation ---
// Replaces api.post for logs to ensure they survive page navigation
const sendBeaconRequest = async (endpoint: string, body: any) => {
    const url = `${API_URL}${endpoint}`;
    const user = auth.currentUser;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    if (user) {
        try {
            const token = await user.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        } catch (e) { /* Ignore token error for logs */ }
    }

    // Use fetch with keepalive: true (modern replacement for sendBeacon with headers support)
    try {
        fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            keepalive: true
        });
    } catch (err) {
        console.warn('Analytics Log Failed:', err);
    }
};

export const logView = (id: string) => sendBeaconRequest('/activity/log-view', { articleId: id });
export const logCompare = (id: string) => sendBeaconRequest('/activity/log-compare', { articleId: id });
export const logShare = (id: string) => sendBeaconRequest('/activity/log-share', { articleId: id });
export const logRead = (id: string) => sendBeaconRequest('/activity/log-read', { articleId: id });
