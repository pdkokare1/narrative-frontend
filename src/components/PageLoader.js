// In file: src/components/PageLoader.js
import React from 'react';
import '../App.css'; // We will add the .page-loader-container style here

/**
 * A simple component to show a full-page spinner.
 * This is used by React.Suspense for lazy-loading routes.
 */
function PageLoader() {
  return (
    <div className="page-loader-container">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>
        Loading page...
      </p>
    </div>
  );
}

export default PageLoader;
