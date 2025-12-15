// src/AccountSettings.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { getToken } from "firebase/messaging";
import { signOut } from 'firebase/auth'; 
import { messaging, auth } from './firebaseConfig'; 
import * as api from './services/api'; 
import './App.css'; 
import './AccountSettings.css'; 
import { IUserProfile } from './types';
import Button from './components/ui/Button'; // Updated to use Button component

interface AccountSettingsProps {
  currentFontSize: string;
  onSetFontSize: (size: string) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ currentFontSize, onSetFontSize }) => {
  const [profileData, setProfileData] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied' | 'loading'>('default');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setError('');
      setLoading(true);
      try {
        const { data } = await api.getProfile(); 
        setProfileData(data);
        
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

  const handleEnableNotifications = async () => {
      if (!messaging) {
          alert("Notifications are not supported on this browser.");
          return;
      }
      setNotifStatus('loading');
      try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
              const token = await getToken(messaging, { vapidKey: process.env.REACT_APP_VAPID_KEY });
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

  const handleDeleteAccount = async () => {
      const confirm = window.confirm("Are you sure? This will permanently delete your stats, saved articles, and profile.");
      if (!confirm) return;
      try {
          setLoading(true);
          await api.deleteAccount(); 
          await signOut(auth); 
          alert("Account deleted.");
          navigate('/'); 
      } catch (err) {
          console.error("Delete Account Error:", err);
          alert("Failed to delete account.");
          setLoading(false);
      }
  };

  const handleSignOut = async () => {
      try {
          await signOut(auth);
          navigate('/');
      } catch (err) {
          console.error("Sign Out Error:", err);
      }
  };

  const renderSizeBtn = (size: string, label: string) => {
      const isActive = currentFontSize === size;
      return (
          <button 
            onClick={() => onSetFontSize(size)}
            style={{
                flex: 1, padding: '12px',
                background: isActive ? 'var(--accent-primary)' : 'var(--bg-primary)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: size === 'medium' ? '13px' : size === 'large' ? '15px' : '17px',
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease'
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
                <div className="stat-row"><strong>Daily Streak</strong><span style={{ color: 'var(--accent-primary)' }}>{profileData.currentStreak || 0} Days 🔥</span></div>
                <div className="stat-row"><strong>Articles Analyzed</strong><span>{profileData.articlesViewedCount || 0}</span></div>
                <div className="stat-row"><strong>Comparisons Viewed</strong><span>{profileData.comparisonsViewedCount || 0}</span></div>
            </div>

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

            <div className="settings-card" style={{ marginTop: '20px' }}>
                <h2 className="settings-section-title">Notifications</h2>
                <div className="settings-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span className="settings-label">Daily Briefing</span>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Get a morning summary.</p>
                        </div>
                        {notifStatus === 'granted' ? (
                            <button className="btn-secondary" disabled style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>Enabled ✓</button>
                        ) : (
                            <button onClick={handleEnableNotifications} className="btn-primary" disabled={notifStatus === 'loading'}>Enable</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="settings-card" style={{ marginTop: '30px', borderColor: 'var(--color-error)' }}>
                <h2 className="settings-section-title" style={{ color: 'var(--color-error)' }}>Danger Zone</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                    Permanently delete your account and all data.
                </p>
                <button onClick={handleDeleteAccount} className="btn-secondary" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)', width: '100%' }}>
                    Delete Account
                </button>
            </div>

            {/* --- NEW SIGN OUT BUTTON --- */}
            <div style={{ marginTop: '40px', marginBottom: '60px' }}>
                <Button 
                    variant="secondary" 
                    onClick={handleSignOut}
                    style={{ width: '100%', borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)' }}
                >
                    Sign Out
                </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
