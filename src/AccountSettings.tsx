// src/AccountSettings.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { getToken } from "firebase/messaging";
import { messaging } from './firebaseConfig';
import * as api from './services/api'; 
import './App.css'; 
import './AccountSettings.css'; 
import { IUserProfile } from './types';

interface AccountSettingsProps {
  currentFontSize: string;
  onSetFontSize: (size: string) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ currentFontSize, onSetFontSize }) => {
  const [profileData, setProfileData] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied' | 'loading'>('default');

  useEffect(() => {
    const fetchProfile = async () => {
      setError('');
      setLoading(true);
      try {
        const { data } = await api.getProfile(); 
        setProfileData(data);
        
        // Check current notification permission
        if (data.notificationsEnabled && Notification.permission === 'granted') {
            setNotifStatus('granted');
        } else if (Notification.permission === 'denied') {
            setNotifStatus('denied');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Could not load your profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- HANDLER: Enable Notifications ---
  const handleEnableNotifications = async () => {
      if (!messaging) {
          alert("Notifications are not supported on this browser.");
          return;
      }

      setNotifStatus('loading');

      try {
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
              const token = await getToken(messaging, {
                  vapidKey: process.env.REACT_APP_VAPID_KEY 
              });
              
              if (token) {
                  await api.saveNotificationToken(token);
                  setNotifStatus('granted');
                  alert("Success! You will now receive daily briefings.");
              } else {
                  console.warn("No registration token available.");
                  setNotifStatus('default');
              }
          } else {
              setNotifStatus('denied');
              alert("Permission denied. You can enable them in your browser settings.");
          }
      } catch (err) {
          console.error("Notification Error:", err);
          setNotifStatus('default');
      }
  };

  // --- RENDER HELPERS ---
  const renderSizeBtn = (size: string, label: string) => {
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
          <div className="settings-card" style={{ textAlign: 'center', borderColor: 'var(--color-error)' }}>
             <p style={{ color: 'var(--color-error)', marginBottom: '15px' }}>{error}</p>
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
                
                <h2 className="settings-section-title">Your Progress</h2>
                
                <div className="stat-row">
                    <strong>Daily Streak</strong>
                    <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {profileData.currentStreak || 0} Days 🔥
                    </span>
                </div>
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

                {/* --- Badges Section --- */}
                {profileData.badges && profileData.badges.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <span className="settings-label">Earned Badges</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                            {profileData.badges.map((badge, idx) => (
                                <div key={idx} style={{ 
                                    background: 'var(--bg-elevated)', 
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '12px',
                                    color: 'var(--text-primary)'
                                }}>
                                    <span style={{ fontSize: '16px' }}>{badge.icon}</span>
                                    <span style={{ fontWeight: 600 }}>{badge.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- Appearance Section --- */}
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

            {/* --- Notifications Section --- */}
            <div className="settings-card" style={{ marginTop: '20px' }}>
                <h2 className="settings-section-title">Notifications</h2>
                <div className="settings-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span className="settings-label">Daily Briefing</span>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Get a morning summary of key stories.
                            </p>
                        </div>
                        
                        {notifStatus === 'granted' ? (
                            <button className="btn-secondary" disabled style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                                Enabled ✓
                            </button>
                        ) : notifStatus === 'loading' ? (
                            <button className="btn-secondary" disabled>Wait...</button>
                        ) : (
                            <button onClick={handleEnableNotifications} className="btn-primary">
                                Enable
                            </button>
                        )}
                    </div>
                    {notifStatus === 'denied' && (
                        <p style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '10px' }}>
                            * Notifications are blocked in your browser settings.
                        </p>
                    )}
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
};

export default AccountSettings;
