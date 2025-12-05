// In file: src/components/Header.js
import React, { useState, useEffect, useRef } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; // <--- Added useNavigate
import '../App.css'; 

function Header({ theme, toggleTheme, onToggleSidebar, username }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // <--- New State
  const [searchQuery, setSearchQuery] = useState('');      // <--- New State
  
  const dropdownRef = useRef(null); 
  const searchRef = useRef(null); // <--- New Ref
  const inputRef = useRef(null);  // <--- New Ref
  
  const navigate = useNavigate(); // <--- Hook for navigation

  // Effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close User Dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      // Close Search Bar
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleUsernameClick = (e) => {
     e.stopPropagation(); 
     setIsDropdownOpen(prev => !prev); 
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery(''); // Optional: Clear after search
    }
  };

  return (
    <header className="header">
      <div className="header-left">
         <button className="hamburger-btn" onClick={(e) => onToggleSidebar(e)} title="Open Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
         </button>

        <div className="logo-container">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 className="logo-text">The Gamut</h1>
            <p className="tagline">Analyse The Full Spectrum</p>
          </Link>
        </div>
      </div>

      <div className="header-right">
        
        {/* --- NEW: Search Bar --- */}
        <div ref={searchRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <form 
            onSubmit={handleSearchSubmit} 
            style={{ 
              display: 'flex', alignItems: 'center',
              width: isSearchOpen ? '200px' : '0px', 
              overflow: 'hidden',
              transition: 'width 0.3s ease',
              background: 'var(--bg-elevated)',
              borderRadius: '20px',
              border: isSearchOpen ? '1px solid var(--border-color)' : 'none',
              marginRight: isSearchOpen ? '10px' : '0'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '5px 15px',
                width: '100%',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </form>
          
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', padding: '5px', display: 'flex'
            }}
            title="Search Articles"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        {/* --- END Search Bar --- */}

        <div className="header-user-desktop" ref={dropdownRef}> 
          <Link to="/my-dashboard" className="header-dashboard-link" title="View your dashboard">
            Dashboard
          </Link>
          <span className="header-user-divider">|</span>
          
          <div className="header-user-clickable-area" onClick={handleUsernameClick}>
            <span className="header-username-desktop" title="Username">
              {username}
            </span>
            <svg className="custom-select-arrow" style={{ width: '16px', height: '16px', fill: 'var(--text-tertiary)', marginLeft: '4px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"></path>
            </svg>
          </div>

          {isDropdownOpen && (
            <div className="header-user-dropdown">
              <ul>
                <li><Link to="/saved-articles" onClick={() => setIsDropdownOpen(false)}>Saved Articles</Link></li>
                <li><Link to="/account-settings" onClick={() => setIsDropdownOpen(false)}>Account Settings</Link></li>
              </ul>
            </div>
          )}
        </div>

        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

      </div>
    </header>
  );
}

export default Header;
