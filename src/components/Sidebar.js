// In file: src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import CustomSelect from './ui/CustomSelect'; 
import * as api from '../services/api'; 
import '../App.css'; 
import './Sidebar.css'; 

// --- NEW IMPORTS ---
import { 
  CATEGORIES, 
  LEANS, 
  REGIONS, 
  ARTICLE_TYPES, 
  QUALITY_LEVELS, 
  SORT_OPTIONS 
} from '../utils/constants';

function Sidebar({ filters = {}, onFilterChange, isOpen, onClose, onLogout, trendingTopics = [] }) {
  const [localTrending, setLocalTrending] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch if not provided by parent
    if (trendingTopics.length === 0 && isOpen) {
      const loadTrending = async () => {
        try {
          const { data } = await api.getTrendingTopics();
          setLocalTrending(data.topics || []);
        } catch (error) {
          console.error("Failed to load trending:", error);
        }
      };
      loadTrending();
    }
  }, [isOpen, trendingTopics]);

  // Use passed props or local state
  const displayTopics = trendingTopics.length > 0 ? trendingTopics : localTrending;

  const handleTopicClick = (topic) => {
    if (onClose) onClose(); 
    navigate(`/search?q=${encodeURIComponent(topic)}`); 
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const SidebarNavLink = ({ to, children, className }) => (
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

        {/* Trending Section */}
        {displayTopics.length > 0 && (
          <div className="sidebar-section">
            <h3>Trending Now</h3>
            <div className="trending-tags-container">
              {displayTopics.map((item, index) => (
                <button 
                  key={index} 
                  className="trending-tag" 
                  onClick={() => handleTopicClick(item.topic)}
                >
                  #{item.topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters Section (Now using Constants) */}
        <div className="sidebar-section">
          <h3>Filters</h3>
          <div className="filter-group"><CustomSelect name="region" value={filters.region} options={REGIONS} onChange={handleChange} /></div>
          <div className="filter-group"><CustomSelect name="articleType" value={filters.articleType} options={ARTICLE_TYPES} onChange={handleChange} /></div>
          <div className="filter-group"><CustomSelect name="category" value={filters.category} options={CATEGORIES} onChange={handleChange} /></div>
          <div className="filter-group"><CustomSelect name="lean" value={filters.lean} options={LEANS} onChange={handleChange} /></div>
          <div className="filter-group"><CustomSelect name="quality" value={filters.quality} options={QUALITY_LEVELS} onChange={handleChange} /></div>
        </div>

        <div className="sidebar-section">
          <h3>Sort By</h3>
          <CustomSelect name="sort" value={filters.sort} options={SORT_OPTIONS} onChange={handleChange} />
        </div>
      </div>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="sidebar-logout-btn">
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
