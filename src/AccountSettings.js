// In file: src/AccountSettings.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import * as api from './services/api'; // <--- Centralized API
import './App.css'; 
import './DashboardPages.css'; 

function AccountSettings() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setError('');
      setLoading(true);
      try {
        const { data } = await api.getProfile(); // <--- API Call
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Could not load your profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="dashboard-page">
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
            textAlign: 'left', color: 'var(--text-primary)', width: '100%', padding: '20px', 
            background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' 
          }}>
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Username</strong>
              <p style={{ fontSize: '16px', margin: '2px 0 0 0' }}>{profileData.username}</p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Email</strong>
              <p style={{ fontSize: '16px', margin: '2px 0 0 0' }}>{profileData.email}</p>
            </div>
            
            <hr style={{ borderColor: 'var(--border-light)', margin: '20px 0' }} />
            
            <h2 style={{ fontSize: '14px', color: 'var(--accent-primary)', marginBottom: '15px', textTransform: 'uppercase' }}>Your Stats</h2>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}><strong>Articles Analyzed:</strong> {profileData.articlesViewedCount || 0}</p>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}><strong>Comparisons Viewed:</strong> {profileData.comparisonsViewedCount || 0}</p>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}><strong>Articles Shared:</strong> {profileData.articlesSharedCount || 0}</p>
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
