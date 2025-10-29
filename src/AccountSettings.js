// In file: src/AccountSettings.js
import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardPages.css'; // Use the new CSS file

function AccountSettings() {
  return (
    <div className="dashboard-page mobile-only-page">
      <div className="dashboard-content-wrapper">
        <div className="dashboard-left-column">
          <div className="section-title-header">
            <h2 className="section-title no-border">Account Settings</h2>
            <div className="header-actions">
              <Link to="/my-dashboard" className="btn-secondary btn-small" style={{ textDecoration: 'none' }}>
                &lt; Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Placeholder Content */}
          <div className="dashboard-card" style={{ minHeight: '300px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '48px', marginBottom: '20px' }} role="img" aria-label="tools">🛠️</span>
            <h3 style={{ margin: 0, color: 'var(--text-primary)'}}>Feature Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
              This page will allow you to manage your profile and account details.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AccountSettings;
