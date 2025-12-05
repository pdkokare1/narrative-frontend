import React from 'react';
import { NavLink } from 'react-router-dom';
import '../App.css'; 

function MobileNavBar() {
  return (
    <nav className="mobile-nav">
      {/* 1. Home Link */}
      <NavLink 
        to="/" 
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        end // Ensures this is only active on exact "/" match
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Home</span>
      </NavLink>

      {/* 2. Saved Link */}
      <NavLink 
        to="/saved-articles" 
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Saved</span>
      </NavLink>

      {/* 3. Dashboard Link */}
      <NavLink 
        to="/my-dashboard" 
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
        <span>Stats</span>
      </NavLink>
    </nav>
  );
}

export default MobileNavBar;
