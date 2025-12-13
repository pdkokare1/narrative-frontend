// src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import CustomSelect from './ui/CustomSelect'; 
import usePWAInstall from '../hooks/usePWAInstall'; 
import '../App.css'; 
import './Sidebar.css'; 
import { IFilters } from '../types';

import { 
  CATEGORIES, 
  LEANS, 
  REGIONS, 
  ARTICLE_TYPES, 
  QUALITY_LEVELS, 
  SORT_OPTIONS 
} from '../utils/constants';

interface SidebarProps {
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ filters, onFilterChange, isOpen, onClose, onLogout }) => {
  const { isInstallable, triggerInstall } = usePWAInstall();

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const SidebarNavLink = ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-nav-link ${isActive ? "active-link" : ""} ${className || ""}`}
      onClick={onClose} 
    >
      {children}
    </NavLink>
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-main-content">
        <div className="sidebar-header-mobile">
          <h3>Menu</h3>
          <button className="sidebar-close-btn" onClick={onClose} title="Close Menu">×</button>
        </div>

        <div className="sidebar-section sidebar-section-mobile-only">
          <ul>
            <li><SidebarNavLink to="/my-dashboard">Dashboard</SidebarNavLink></li>
            <li><SidebarNavLink to="/saved-articles">Saved Articles</SidebarNavLink></li>
          </ul>
        </div>

        {/* Emergency Help Button */}
        <div className="sidebar-section">
           <SidebarNavLink 
             to="/emergency-resources" 
             className="emergency-sidebar-btn"
           >
             Emergency Help
           </SidebarNavLink>
        </div>

        {/* Filters Section */}
        <div className="sidebar-section">
          <h3>Filters</h3>
          <div className="filter-group"><CustomSelect name="region" value={filters.region || 'Global'} options={REGIONS} onChange={handleChange} /></div>
          <div className="filter-group"><CustomSelect name="articleType" value={filters.articleType || 'All Types'} options={ARTICLE_TYPES} onChange={handleChange} /></div>
          <div className="filter-group"><CustomSelect name="category" value={filters.category || 'All Categories'} options={CATEGORIES} onChange={handleChange} /></div>
          <div className="filter-group"><CustomSelect name="lean" value={filters.lean || 'All Leans'} options={LEANS} onChange={handleChange} /></div>
          <div className="filter-group"><CustomSelect name="quality" value={filters.quality || 'All Quality Levels'} options={QUALITY_LEVELS} onChange={handleChange} /></div>
        </div>

        <div className="sidebar-section">
          <h3>Sort By</h3>
          <CustomSelect name="sort" value={filters.sort || 'Latest First'} options={SORT_OPTIONS} onChange={handleChange} />
        </div>
      </div>

      <div className="sidebar-footer">
        {/* --- NEW: Install App Button (Only shows if installable) --- */}
        {isInstallable && (
          <button 
            onClick={triggerInstall} 
            className="sidebar-logout-btn" 
            style={{ 
              marginBottom: '10px', 
              borderColor: 'var(--accent-primary)', 
              color: 'var(--accent-primary)',
              background: 'rgba(179, 143, 95, 0.1)' // Subtle gold tint
            }}
          >
            Install App
          </button>
        )}

        <button onClick={onLogout} className="sidebar-logout-btn">
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
