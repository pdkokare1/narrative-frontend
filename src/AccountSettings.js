// In file: src/AccountSettings.js
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import './App.css'; // For theme variables
import './DashboardPages.css'; // New shared CSS file

function AccountSettings() {
  return (
    <div className="dashboard-page">

      {/* --- Page Header --- */}
      <div className="dashboard-header">
        <h1>Account Settings</h1>
        <nav className="dashboard-nav-links">
          {/* Removed Reading Habits Link */}
          <NavLink to="/my-dashboard" className={({isActive}) => isActive ? "active" : ""}>Dashboard</NavLink>
          <NavLink to="/saved-articles" className={({isActive}) => isActive ? "active" : ""}>Saved Articles</NavLink>
          <NavLink to="/account-settings" className={({isActive}) => isActive ? "active" : ""}>Account</NavLink>
        </nav>
      </div>

      {/* --- Placeholder Content --- */}
      <div className="placeholder-page">
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
