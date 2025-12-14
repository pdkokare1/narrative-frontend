// src/components/PageLoader.tsx
import React from 'react';
import '../App.css';

const PageLoader: React.FC = () => {
  return (
    <div className="page-loader-container">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>
        Loading page...
      </p>
    </div>
  );
};

export default PageLoader;
