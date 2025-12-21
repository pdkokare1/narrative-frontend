// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './variables.css'; 
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
// PWA Import for Vite
import { registerSW } from 'virtual:pwa-register';

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
// reloadOnOneUp: true will automatically reload the app when a new version is ready
registerSW({ immediate: true });
