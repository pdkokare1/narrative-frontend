// src/AccountSettings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { getToken } from "firebase/messaging";
import { signOut } from 'firebase/auth'; 
import { messaging, auth } from './firebaseConfig'; 
import * as api from './services/api'; 
import './App.css'; 
import './AccountSettings.css'; 
import { IUserProfile } from './types';

// --- UI Components ---
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import SectionHeader from './components/ui/SectionHeader';
import PageLoader from './components/PageLoader';

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

  if (loading && !profileData) {
      return <PageLoader />;
  }

  return (
    <div className="content">
      <div className="settings-container">
        
        <SectionHeader 
            title="Account Settings" 
            subtitle="Manage your preferences and data"
            align="center"
        />

        {error && (
          <Card className="settings-card error-card">
             <p style={{ color: 'var(--color-error)', marginBottom: '15px' }}>{error}</p>
             <Button onClick={() => window.location.reload()} variant="secondary">Retry</Button>
          </Card>
        )}

        {profileData && (
          <>
            {/* --- PROFILE INFO --- */}
            <Card className="settings-card">
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
                <div className="stat-row"><strong>Daily Streak</strong><span className="accent-text">{profileData.currentStreak || 0} Days 🔥</span></div>
                <div className="stat-row"><strong>Articles Analyzed</strong><span>{profileData.articlesViewedCount || 0}</span></div>
                <div className="stat-row"><strong>Comparisons Viewed</strong><span>{profileData.comparisonsViewedCount || 0}</span></div>
            </Card>

            {/* --- APPEARANCE --- */}
            <Card className="settings-card mt-20">
                <h2 className="settings-section-title">Appearance</h2>
                <div className="settings-field">
                    <span className="settings-label" style={{ marginBottom: '10px', display: 'block' }}>Text Size</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button 
                            variant={currentFontSize === 'medium' ? 'primary' : 'secondary'} 
                            onClick={() => onSetFontSize('medium')}
                            style={{ flex: 1 }}
                        >
                            Normal
                        </Button>
                        <Button 
                            variant={currentFontSize === 'large' ? 'primary' : 'secondary'} 
                            onClick={() => onSetFontSize('large')}
                            style={{ flex: 1, fontSize: '12px' }}
                        >
                            Large
                        </Button>
                        <Button 
                            variant={currentFontSize === 'xl' ? 'primary' : 'secondary'} 
                            onClick={() => onSetFontSize('xl')}
                            style={{ flex: 1, fontSize: '13px' }}
                        >
                            Extra
                        </Button>
                    </div>
                </div>
            </Card>

            {/* --- NOTIFICATIONS --- */}
            <Card className="settings-card mt-20">
                <h2 className="settings-section-title">Notifications</h2>
                <div className="settings-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span className="settings-label">Daily Briefing</span>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Get a morning summary.</p>
                        </div>
                        {notifStatus === 'granted' ? (
                            <Button variant="secondary" disabled style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                                Enabled ✓
                            </Button>
                        ) : (
                            <Button 
                                variant="primary" 
                                onClick={handleEnableNotifications} 
                                isLoading={notifStatus === 'loading'}
                            >
                                Enable
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* --- DANGER ZONE --- */}
            <Card className="settings-card danger-card mt-30">
                <h2 className="settings-section-title danger-title">Danger Zone</h2>
                <p className="danger-text">
                    Permanently delete your account and all data.
                </p>
                <Button 
                    onClick={handleDeleteAccount} 
                    variant="secondary" 
                    className="btn-danger-custom"
                >
                    Delete Account
                </Button>
            </Card>

            {/* --- SIGN OUT --- */}
            <div style={{ marginTop: '40px', marginBottom: '60px' }}>
                <Button 
                    variant="secondary" 
                    onClick={handleSignOut}
                    className="btn-signout-custom"
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
