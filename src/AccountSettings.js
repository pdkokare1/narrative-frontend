// In file: src/AccountSettings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // For linking back
import './App.css'; // Re-use general styles
import './DashboardPages.css'; // Re-use dashboard styles

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function AccountSettings() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setError('');
      setLoading(true);
      try {
        // The axios interceptor automatically adds the auth token
        const response = await axios.get(`${API_URL}/profile/me`);
        setProfileData(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Could not load your profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Run only once on component mount

  return (
    // Re-use the dashboard page wrapper for consistent layout
    <div className="dashboard-page">
      {/* Use the placeholder-page class for centering the content */}
      <div className="placeholder-page" style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <h1>Account Settings</h1>

        {loading && (
          <div className="loading-container" style={{ minHeight: '150px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
          </div>
        )}

        {error && (
          <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
        )}

        {profileData && !loading && (
          <div style={{ 
            textAlign: 'left', 
            color: 'var(--text-primary)', 
            width: '100%', 
            padding: '20px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)' 
          }}>
            
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Username</strong>
              <p style={{ fontSize: '16px', margin: '2px 0 0 0' }}>
                {profileData.username}
              </p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Email</strong>
              <p style={{ fontSize: '16px', margin: '2px 0 0 0' }}>
                {profileData.email}
              </p>
            </div>
            
            <hr style={{ borderColor: 'var(--border-light)', margin: '20px 0' }} />
            
            <h2 style={{ fontSize: '14px', color: 'var(--accent-primary)', marginBottom: '15px', textTransform: 'uppercase' }}>Your Stats</h2>
            
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              <strong>Articles Analyzed:</strong> {profileData.articlesViewedCount || 0}
            </p>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              <strong>Comparisons Viewed:</strong> {profileData.comparisonsViewedCount || 0}
            </p>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              <strong>Articles Shared:</strong> {profileData.articlesSharedCount || 0}
            </p>
          </div>
        )}

        <Link to="/my-dashboard" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '25px' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default AccountSettings;
