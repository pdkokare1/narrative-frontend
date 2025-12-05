// In file: src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import CustomSelect from './ui/CustomSelect'; 
import * as api from '../services/api'; // <--- Import API
import '../App.css'; 

function Sidebar({ filters, onFilterChange, isOpen, onClose, onLogout }) {
  const [trendingTopics, setTrendingTopics] = useState([]);
  const navigate = useNavigate();

  // --- Fetch Trending Topics on Mount ---
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const { data } = await api.getTrendingTopics();
        setTrendingTopics(data.topics || []);
      } catch (error) {
        console.error("Failed to load trending:", error);
      }
    };
    if (isOpen) loadTrending(); // Only fetch when sidebar opens to save resources
  }, [isOpen]);

  const handleTopicClick = (topic) => {
    onClose(); // Close sidebar
    navigate(`/search?q=${encodeURIComponent(topic)}`); // Go to search
  };

  // --- Filter Options ---
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

        {/* Mobile Navigation Links */}
        <div className="sidebar-section sidebar-section-mobile-only">
          <ul>
            <li><SidebarNavLink to="/my-dashboard">Dashboard</SidebarNavLink></li>
            <li><SidebarNavLink to="/saved-articles">Saved Articles</SidebarNavLink></li>
          </ul>
        </div>

        {/* --- NEW: Trending Section --- */}
        {trendingTopics.length > 0 && (
          <div className="sidebar-section">
            <h3>Trending Now</h3>
            <div className="trending-tags-container">
              {trendingTopics.map((item, index) => (
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
        {/* --- END Trending --- */}

        {/* Filters Section */}
        <div className="sidebar-section">
          <h3>Filters</h3>
          <div className="filter-group">
            <CustomSelect name="region" value={filters.region} options={regions} onChange={handleChange} />
          </div>
          <div className="filter-group">
            <CustomSelect name="articleType" value={filters.articleType} options={articleTypes} onChange={handleChange} />
          </div>
          <div className="filter-group">
            <CustomSelect name="category" value={filters.category} options={categories} onChange={handleChange} />
          </div>
          <div className="filter-group">
            <CustomSelect name="lean" value={filters.lean} options={leans} onChange={handleChange} />
          </div>
          <div className="filter-group">
            <CustomSelect name="quality" value={filters.quality} options={qualityLevels} onChange={handleChange} />
          </div>
        </div>

        {/* Sort By Section */}
        <div className="sidebar-section">
          <h3>Sort By</h3>
          <CustomSelect name="sort" value={filters.sort} options={sortOptions} onChange={handleChange} />
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
