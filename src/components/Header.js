// In file: src/components/Header.js
// --- FIX: Restructured for click-to-open dropdown menu ---
import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; // For header styles

function Header({ 
  theme, 
  toggleTheme, 
  onToggleSidebar, 
  username,
  // --- NEW PROPS ---
  userMenuRef,
  isUserMenuOpen,
  setIsUserMenuOpen
}) {
  return (
    <header className="header">
      <div className="header-left">
         <button className="hamburger-btn" onClick={onToggleSidebar} title="Open Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
         </button>

        <div className="logo-container">
          <h1 className="logo-text">The Gamut</h1>
          <p className="tagline">Analyse The Full Spectrum</p>
        </div>
      </div>

      <div className="header-right">
        
        {/* --- *** THIS IS THE FIX (Request 4) *** --- */}

        {/* --- 1. Dashboard Link (Now separate) --- */}
        <div className="header-user-desktop-link">
          <Link to="/my-dashboard" className="header-dashboard-link" title="View your dashboard">
            Dashboard
          </Link>
        </div>

        {/* --- 2. User Menu (Username + Dropdown) --- */}
        {/* This container holds the clickable menu and the dropdown */}
        <div className="header-user-menu-container" ref={userMenuRef}>
          {/* This is the clickable part */}
          <div 
            className="header-user-desktop"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <span className="header-username-desktop" title="Username">
              {username}
            </span>
            {/* --- Dropdown Arrow --- */}
            <svg className="custom-select-arrow" style={{ width: '16px', height: '16px', fill: 'var(--text-tertiary)', marginLeft: '4px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"></path>
            </svg>
          </div>

          {/* --- Dropdown Menu (conditionally styled) --- */}
          <div className={`header-user-dropdown ${isUserMenuOpen ? 'open' : ''}`}>
            <ul>
              <li><Link to="/saved-articles" onClick={() => setIsUserMenuOpen(false)}>Saved Articles</Link></li>
              <li><Link to="/account-settings" onClick={() => setIsUserMenuOpen(false)}>Account Settings</Link></li>
            </ul>
          </div>
        </div>
        {/* --- *** END OF FIX *** --- */}


        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* --- REMOVED Mobile Only Logout Button --- */}
         {/* <button onClick={null} className="logout-btn header-logout-mobile" title="Sign Out"> ... </button> */}
        {/* --- End Removal --- */}
      </div>
    </header>
  );
}

export default Header;
