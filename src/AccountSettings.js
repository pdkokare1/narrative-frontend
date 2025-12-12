// In file: src/AccountSettings.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import * as api from './services/api'; 
import './App.css'; 
import './AccountSettings.css'; 

function AccountSettings({ currentFontSize, onSetFontSize }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setError('');
      setLoading(true);
      try {
        const { data } = await api.getProfile(); 
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

  // --- RENDER HELPERS ---
  const renderSizeBtn = (size, label) => {
      const isActive = currentFontSize === size;
      return (
          <button 
            onClick={() => onSetFontSize(size)}
            style={{
                flex: 1,
                padding: '12px',
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-primary)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: size === 'medium' ? '13px' : size === 'large' ? '15px' : '17px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
          >
              {label}
          </button>
      );
  };

  return (
    <div className="content">
      <div className="settings-container">
        
        <h1>Account Settings</h1>

        {loading && (
          <div className="loading-container" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
          </div>
        )}

        {error && (
          <div className="settings-card" style={{ textAlign: 'center', borderColor: '#E57373' }}>
             <p style={{ color: '#E57373', marginBottom: '15px' }}>{error}</p>
             <button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>
          </div>
        )}

        {profileData && !loading && (
          <>
            <div className="settings-card">
                <div className="settings-field">
                <span className="settings-label">Username</span>
                <p className="settings-value">{profileData.username}</p>
                </div>

                <div className="settings-field">
                <span className="settings-label">Email</span>
                <p className="settings-value">{profileData.email}</p>
                </div>
                
                <hr className="settings-divider" />
                
                <h2 className="settings-section-title">Your Stats</h2>
                
                <div className="stat-row">
                    <strong>Articles Analyzed</strong>
                    <span>{profileData.articlesViewedCount || 0}</span>
                </div>
                <div className="stat-row">
                    <strong>Comparisons Viewed</strong>
                    <span>{profileData.comparisonsViewedCount || 0}</span>
                </div>
                <div className="stat-row">
                    <strong>Articles Shared</strong>
                    <span>{profileData.articlesSharedCount || 0}</span>
                </div>
            </div>

            {/* --- NEW: Appearance Section --- */}
            <div className="settings-card" style={{ marginTop: '20px' }}>
                <h2 className="settings-section-title">Appearance</h2>
                
                <div className="settings-field">
                    <span className="settings-label" style={{ marginBottom: '10px', display: 'block' }}>Text Size</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {renderSizeBtn('medium', 'Normal')}
                        {renderSizeBtn('large', 'Large')}
                        {renderSizeBtn('xl', 'Extra')}
                    </div>
                </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '30px' }}>
            <Link to="/my-dashboard" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 25px' }}>
            Back to Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;
