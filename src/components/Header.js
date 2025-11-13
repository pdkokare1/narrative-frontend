// In file: src/components/Header.js
// --- *** HAMBURGER GLITCH FIX: Pass the 'event' (e) to onToggleSidebar *** ---
// --- *** TYPO FIX: Removed extra 24" from hamburger SVG viewBox *** ---
// --- BUG FIX (2): Removed special click handler for Dashboard link ---
// --- BUG FIX (1): Component now manages its own state ---
import React, { useState, useEffect, useRef } from 'react'; // <-- Import hooks
import { Link } from 'react-router-dom';
import '../App.css'; // For header styles

function Header({ theme, toggleTheme, onToggleSidebar, username }) {
  // --- *** THIS IS THE FIX (BUG 1) *** ---
  // This state is now managed *inside* the header, not in App.js
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // Ref to the dropdown container (trigger + menu)

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the dropdown is open and the click is outside the ref
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    // Add listener
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Only run once

  // --- *** THIS IS THE FIX (BUG 2) *** ---
  // --- REMOVED handleDashboardClick function ---
  // It is no longer needed. The <Link> component will handle navigation.
  // --- *** END OF FIX *** ---
  
  const handleUsernameClick = (e) => {
     e.stopPropagation(); // Stop click from bubbling to document
     setIsDropdownOpen(prev => !prev); // Toggle
  };
  // --- *** END OF FIX *** ---

  return (
    <header className="header">
      <div className="header-left">
         {/* --- *** THIS IS THE HAMBURGER GLITCH FIX *** --- */}
         <button className="hamburger-btn" onClick={(e) => onToggleSidebar(e)} title="Open Menu">
         {/* --- *** END OF FIX *** --- */}
            {/* --- *** THIS IS THE TYPO FIX *** --- */}
            {/* The extra 24" after viewBox="0 0 24 24" has been removed. */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* --- *** END OF FIX *** --- */}
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
        {/* --- *** THIS IS THE FIX (BUG 1 & 2) *** --- */}
        {/* 1. Main Container Block: Attach ref here */}
        <div className="header-user-desktop" ref={dropdownRef}> 
          
          {/* 2. Dashboard Link (now a normal link) */}
          <Link 
            to="/my-dashboard" 
            className="header-dashboard-link" 
            title="View your dashboard" 
            // --- REMOVED onClick={handleDashboardClick} ---
          >
            Dashboard
          </Link>
          <span className="header-user-divider">|</span>
          
          {/* 3. Clickable Username Area */}
          <div 
            className="header-user-clickable-area"
            onClick={handleUsernameClick} /* Toggle handler */
          >
            <span className="header-username-desktop" title="Username">
              {username}
            </span>
            <svg className="custom-select-arrow" style={{ width: '16px', height: '16px', fill: 'var(--text-tertiary)', marginLeft: '4px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"></path>
            </svg>
          </div>

          {/* 4. Dropdown Menu (conditionally rendered sibling) */}
          {isDropdownOpen && (
            <div className="header-user-dropdown">
              <ul>
                {/* Clicks here are inside the ref, so need to close manually */}
                <li><Link to="/saved-articles" onClick={() => setIsDropdownOpen(false)}>Saved Articles</Link></li>
                <li><Link to="/account-settings" onClick={() => setIsDropdownOpen(false)}>Account Settings</Link></li>
              </ul>
            </div>
          )}
        </div>
        {/* --- *** END OF FIX *** --- */}


        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

      </div>
    </header>
  );
}

export default Header;
