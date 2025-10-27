// In file: src/ProfilePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // For linking back home
import './App.css'; // Re-use general styles
import './Login.css'; // Re-use login page wrapper styles

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function ProfilePage() {
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
        // Handle specific errors if needed (like 404, although App.js should prevent this)
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Run only once on component mount

  return (
    // Re-use the login page wrapper for centering, but customize the card
    <div className="login-page-wrapper" style={{ minHeight: 'calc(100vh - 60px)', paddingTop: '60px' }}>
      <div className="login-container" style={{ maxWidth: '600px', backgroundColor: 'var(--bg-card-flat)', padding: '30px' }}>
        <div className="login-form-panel" style={{ padding: '0' }}> {/* Remove inner padding */}
          <h1 style={{ marginBottom: '30px' }}>Your Profile</h1>

          {loading && (
            <div className="loading-container" style={{ minHeight: '100px' }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
              <p>Loading profile...</p>
            </div>
          )}

          {error && (
            <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
          )}

          {profileData && !loading && (
            <div style={{ textAlign: 'left', color: 'var(--text-primary)', width: '100%' }}>
              <p style={{ fontSize: '16px', marginBottom: '15px' }}>
                <strong>Username:</strong> {profileData.username}
              </p>
              <p style={{ fontSize: '16px', marginBottom: '15px' }}>
                <strong>Email:</strong> {profileData.email}
              </p>
              <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />
              <h2 style={{ fontSize: '18px', color: 'var(--accent-primary)', marginBottom: '15px' }}>📊 Your Stats</h2>
              <p style={{ fontSize: '16px', marginBottom: '25px' }}>
                <strong>Articles Analyzed:</strong> {profileData.articlesViewedCount || 0}
              </p>
            </div>
          )}

          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>
            Back to Articles
          </Link>

        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
