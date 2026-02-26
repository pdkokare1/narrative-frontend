// src/components/ui/FloatingActionMenu.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryPills from './CategoryPills';
import { IFilters } from '../../types';
import './FloatingActionMenu.css';

interface FloatingActionMenuProps {
  theme: string;
  toggleTheme: () => void;
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
}

const CATEGORIES = ["All", "Technology", "Business", "Science", "Health", "Entertainment", "Sports", "World", "Politics"];

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ 
  theme, 
  toggleTheme, 
  filters, 
  onFilterChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSearchClick = () => {
     setIsOpen(false);
     navigate('/search');
  };

  const handleCategorySelect = (cat: string) => {
     onFilterChange({ ...filters, category: cat });
     setIsOpen(false);
  };

  return (
    <>
      {/* 1. Dark Screen Overlay */}
      <div 
        className={`fab-overlay ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(false)} 
      />

      {/* 2. FAB Container & Elements */}
      <div className={`fab-container ${isOpen ? 'open' : ''}`}>
         
         {/* Horizontal: Scrollable Category Track */}
         <div className="fab-item fab-horizontal">
            <CategoryPills 
              categories={CATEGORIES}
              selectedCategory={filters.category || 'All'}
              onSelectCategory={handleCategorySelect}
            />
         </div>

         {/* Diagonal: Search Button */}
         <button className="fab-item fab-diagonal" onClick={handleSearchClick} aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
         </button>

         {/* Vertical: Theme Toggle */}
         <button className="fab-item fab-vertical" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
         </button>

         {/* Main Anchor Button */}
         <button className="fab-main-btn" onClick={toggleMenu}>
            <svg className={`fab-icon ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <line x1="3" y1="12" x2="21" y2="12"></line>
               <line x1="3" y1="6" x2="21" y2="6"></line>
               <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
         </button>
      </div>
    </>
  );
};

export default FloatingActionMenu;
