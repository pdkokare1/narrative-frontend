// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './variables.css'; 
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';

// --- VERSION CHECK ---
console.log("🚀 LATEST VERSION LOADED: v2.5 - Header Button Removed");

// 1. Capture the Install Event (Global Listener)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  console.log("✅ PWA Install Event captured globally.");
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

// 2. Aggressive Auto-Update Logic
// This forces the browser to skip the "waiting" phase and activate the new version immediately.
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("🔄 New content detected. Force updating...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("✅ App is ready for offline usage.");
  },
  // This ensures the service worker takes control immediately
  immediate: true
});
