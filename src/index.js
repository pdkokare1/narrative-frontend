// In file: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // <-- ADDED THIS

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- WRAPPED APP */}
      <App />
    </BrowserRouter> {/* <-- WRAPPED APP */}
  </React.StrictMode>
);
