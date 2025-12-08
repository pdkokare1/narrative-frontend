import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TuneIcon from '@mui/icons-material/Tune';
// import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // Removed import

const Sidebar = ({ isOpen, toggleSidebar, filters, onFilterChange, trendingTopics, onTopicClick }) => {
  const location = useLocation();

  const navItems = [
    { label: 'My Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Saved Articles', path: '/saved', icon: <BookmarkIcon /> },
    // Icon property removed for Emergency Resources based on request
    { label: 'Emergency Resources', path: '/emergency', icon: null },
  ];

  const isSettingsPage = location.pathname === '/settings';
  const isProfileCreation = location.pathname === '/create-profile';

  // If we are on settings or profile creation, we might want a simplified sidebar or none at all.
  // For now, following the original design, we keep it.

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* ... rest of the file remains unchanged ... */}
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${!item.icon ? 'no-icon' : ''}`
              }
              onClick={toggleSidebar && window.innerWidth <= 768 ? toggleSidebar : undefined}
            >
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Don't show filters/trending on specific pages if needed */}
        {!isSettingsPage && !isProfileCreation && (
            <>
           <div className="sidebar-section">
          <h3 className="section-title">
            <TuneIcon className="section-icon" />
            Filters
          </h3>
          {/* Add filter controls here (e.g., date range, source select) */}
          <div className="filter-placeholder">Filters coming soon...</div>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">Trending Topics</h3>
          <div className="trending-topics-list">
            {trendingTopics.map((topic, index) => (
              <button key={index} className="topic-chip" onClick={() => onTopicClick(topic)}>
                {topic}
              </button>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
