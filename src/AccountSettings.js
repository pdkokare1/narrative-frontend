// In file: src/AccountSettings.js
import React from 'react';
import { Link } from 'react-router-dom'; // Keep Link for button
import './App.css'; // For theme variables
import './DashboardPages.css'; // Shared CSS file

function AccountSettings() {
  return (
    // Keep dashboard-page for consistent padding/scrolling
    <div className="dashboard-page">

      {/* --- REMOVED Page Header --- */}
      {/* <div className="dashboard-header"> ... </div> */}

      {/* --- Placeholder Content --- */}
      <div className="placeholder-page">
        <h1>Account Settings</h1> {/* Use h1 for page title */}
        <h2>Feature Coming Soon!</h2>
        <p>This page will allow you to manage your account details.</p>
        <Link to="/my-dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Back to Dashboard
        </Link>
      </div>

    </div>
  );
}

export default AccountSettings;
