// src/pages/MobileProfileMenu.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import '../App.css';

const MenuIcon = ({ char }: { char: string }) => (
  <div style={{ 
    width: '32px', height: '32px', borderRadius: '50%', 
    background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', marginRight: '15px', border: '1px solid rgba(212, 175, 55, 0.3)'
  }}>
    {char}
  </div>
);

interface MobileProfileMenuProps {
  isInstallable?: boolean;
  triggerInstall?: () => void;
}

const MobileProfileMenu: React.FC<MobileProfileMenuProps> = ({ isInstallable, triggerInstall }) => {
  const { user } = useAuth();
  
  // Platform Detection (Case insensitive now to be safer)
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  // Check if already running as an app
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  const menuItems = [
    { label: 'My Dashboard', path: '/my-dashboard', icon: '📊', desc: 'View your reading stats' },
    { label: 'Saved Articles', path: '/saved-articles', icon: '🔖', desc: 'Your personal library' },
    { label: 'Emergency Help', path: '/emergency-resources', icon: '🚨', desc: 'Critical resources' },
    { label: 'Account Settings', path: '/account-settings', icon: '⚙️', desc: 'Manage profile & preferences' },
    { label: 'Legal & Privacy', path: '/legal', icon: '⚖️', desc: 'Terms & Privacy Policy' },
  ];

  return (
    <div className="content">
      <SectionHeader 
        title="My Profile" 
        subtitle={`Signed in as ${user?.displayName || 'User'}`} 
      />

      {/* --- INSTALL APP SECTION --- */}
      {/* Logic: If not currently in "App Mode" (Standalone), show ONE of the options below */}
      {!isStandalone && (
        <div style={{ marginBottom: '20px' }}>
            
            {/* OPTION A: The Magic Button (If Browser supports it) */}
            {isInstallable && triggerInstall ? (
                <div onClick={triggerInstall} style={{ cursor: 'pointer', marginBottom: '15px' }}>
                    <Card variant="glass" padding="sm" className="menu-card-item" style={{ background: 'rgba(212, 175, 55, 0.15)', borderColor: 'var(--accent-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                        <MenuIcon char="📲" />
                        <div>
                            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)' }}>
                            Install App
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Add to home screen for better experience
                            </div>
                        </div>
                        </div>
                    </Card>
                </div>
            ) : (
                /* OPTION B: Manual Instructions (If Magic Button not ready/supported) */
                <>
                    {/* iOS Manual Instructions */}
                    {isIOS && (
                        <div style={{ marginBottom: '15px' }}>
                            <Card variant="glass" padding="sm" className="menu-card-item">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                <MenuIcon char="🍏" />
                                <div>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)' }}>
                                    Install on iPhone
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Tap <strong>Share</strong> button <span style={{fontSize: '14px'}}>⎋</span> below, then <strong>"Add to Home Screen"</strong>
                                    </div>
                                </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Android Manual Instructions (Show if Android OR if we couldn't detect OS) */}
                    {(isAndroid || (!isIOS && !isAndroid)) && (
                        <div style={{ marginBottom: '15px' }}>
                            <Card variant="glass" padding="sm" className="menu-card-item">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                <MenuIcon char="🤖" />
                                <div>
                                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)' }}>
                                    Install App
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Tap the menu <strong>(⋮)</strong> and select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>
                                    </div>
                                </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {menuItems.map((item) => (
          <Link to={item.path} key={item.path} style={{ textDecoration: 'none' }}>
            <Card variant="glass" padding="sm" className="menu-card-item">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <MenuIcon char={item.icon} />
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileProfileMenu;
