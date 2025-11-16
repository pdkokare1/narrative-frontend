// In file: src/components/Sidebar.js
// --- UPDATED: Added Dashboard link for mobile ---
// --- FIX (2025-11-16): Made Account Settings link visible on desktop ---
// --- FIX (2025-11-16b): Removed ul/li from Account Settings link ---
// --- *** THIS IS THE FIX: Re-added Account Settings button for mobile/desktop *** ---
import React from 'react';
import { NavLink } from 'react-router-dom';
import CustomSelect from './ui/CustomSelect'; // Import the CustomSelect component
import '../App.css'; // For sidebar styles

function Sidebar({ filters, onFilterChange, isOpen, onClose, onLogout }) {
  const categories = ['All Categories', 'Politics', 'Economy', 'Technology', 'Health', 'Environment', 'Justice', 'Education', 'Entertainment', 'Sports', 'Other'];
  const leans = ['All Leans', 'Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];
  const regions = [
    { value: 'All', label: 'All Regions' },
    { value: 'Global', label: 'Global' },
    { value: 'India', label: 'India' },
  ];
  const articleTypes = [
    { value: 'All Types', label: 'All Article Types' },
    { value: 'Hard News', label: 'Hard News' },
    { value: 'Opinion & Reviews', label: 'Opinion & Reviews' },
  ];
  const qualityLevels = [
    { value: 'All Quality Levels', label: 'All Quality Levels' },
    { value: 'A+ Excellent (90-100)', label: 'A+ : Excellent' },
    { value: 'A High (80-89)', label: 'A : High' },
    { value: 'B Professional (70-79)', label: 'B : Professional' },
    { value: 'C Acceptable (60-69)', label: 'C : Acceptable' },
    { value: 'D-F Poor (0-59)', label: 'D-F : Poor' },
  ];
  const sortOptions = ['Latest First', 'Highest Quality', 'Most Covered', 'Lowest Bias'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const SidebarNavLink = ({ to, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) => "sidebar-nav-link " + (isActive ? "active-link" : "")}
      onClick={onClose} // Close sidebar on nav click
    >
      {children}
    </NavLink>
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* --- Main Content Sections (User Nav, Filters, Sort) --- */}
      <div className="sidebar-main-content">
        <div className="sidebar-header-mobile">
          <h3>Menu</h3>
          <button className="sidebar-close-btn" onClick={onClose} title="Close Menu">×</button>
        </div>

        {/* --- *** THIS IS THE FIX (Request 5) *** --- */}
        {/* This div will be hidden on desktop by App.css */}
        <div className="sidebar-section sidebar-section-mobile-only">
          {/* --- REMOVED <h3>Navigation</h3> --- */}
          <ul>
            {/* --- *** THIS IS THE FIX: Added Dashboard Link *** --- */}
            <li><SidebarNavLink to="/my-dashboard">Dashboard</SidebarNavLink></li>
            <li><SidebarNavLink to="/saved-articles">Saved Articles</SidebarNavLink></li>
          </ul>
        </div>
        {/* --- *** END OF FIX *** --- */}


        {/* --- Filters Section --- */}
        <div className="sidebar-section">
          <h3>Filters</h3>
          <div className="filter-group">
            <CustomSelect
              name="region"
              value={filters.region}
              options={regions}
              onChange={handleChange}
            />
          </div>
          <div className="filter-group">
            <CustomSelect
              name="articleType"
              value={filters.articleType}
              options={articleTypes}
              onChange={handleChange}
            />
          </div>
          <div className="filter-group">
            <CustomSelect
              name="category"
              value={filters.category}
              options={categories}
              onChange={handleChange}
            />
          </div>
          <div className="filter-group">
            <CustomSelect
              name="lean"
              value={filters.lean}
              options={leans}
              onChange={handleChange}
            />
          </div>
          <div className="filter-group">
            <CustomSelect
              name="quality"
              value={filters.quality}
              options={qualityLevels}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* --- End Filters --- */}

        {/* --- Sort By Section --- */}
        <div className="sidebar-section">
          <h3>Sort By</h3>
          <CustomSelect
            name="sort"
            value={filters.sort}
            options={sortOptions}
            onChange={handleChange}
          />
        </div>
        {/* --- End Sort By --- */}

        {/* --- *** REMOVED Old Nav Sections *** --- */}
      </div>

      {/* --- Footer Area (Logout) --- */}
      <div className="sidebar-footer">
        
        {/* --- *** THIS IS THE FIX: Added Account Settings link back *** --- */}
        {/* Removed 'sidebar-section-mobile-only' class so it shows on desktop */}
        {/* Removed ul/li wrapper to fix bullet point */}
        <div className="sidebar-section" style={{ marginBottom: '15px' }}>
          <SidebarNavLink to="/account-settings">Account Settings</SidebarNavLink>
        </div>
        {/* --- *** END OF FIX *** --- */}

        {/* --- Logout Button --- */}
        <button onClick={onLogout} className="sidebar-logout-btn">
          Sign Out
        </button>
        {/* --- END Logout --- */}
      </div>
    </aside>
  );
}

export default Sidebar;
