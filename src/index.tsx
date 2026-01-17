// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './variables.css'; 
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';

// --- NEW: Global PWA Install Event Listener ---
// We capture this event immediately (outside of React) to ensure we don't miss it 
// if it fires before the React components have fully mounted.
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later by our hook.
  (window as any).deferredPrompt = e;
  console.log("PWA Install Event captured globally.");
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

// PWA Registration Logic
registerSW({ immediate: true });
