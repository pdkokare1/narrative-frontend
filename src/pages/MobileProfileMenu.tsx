// src/pages/MobileProfileMenu.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import '../App.css';

// Simple Icons for the menu list
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

const MobileProfileMenu: React.FC = () => {
  const { user } = useAuth();

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
