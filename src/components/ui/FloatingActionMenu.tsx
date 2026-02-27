// src/components/ui/FloatingActionMenu.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryPills from './CategoryPills';
import { IFilters } from '../../types';

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
      {/* INJECTED CSS: Guarantees styling without relying on external files */}
      <style>{`
        .fab-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.8); /* Darkened slightly for better contrast */
          backdrop-filter: blur(8px); /* ADDED: Prominent glassmorphism blur */
          -webkit-backdrop-filter: blur(8px); /* For iOS/Safari support */
          z-index: 9998; opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
        }
        .fab-overlay.open { opacity: 1; pointer-events: auto; }

        .fab-container {
          position: fixed;
          bottom: 90px; /* Safely above the BottomNav */
          right: 20px;  /* Locked to the right side */
          z-index: 9999; /* Highest layer */
        }

        .fab-main-btn {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--accent-primary, #007bff);
          color: var(--bg-primary, #fff);
          border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; z-index: 10000;
          transition: transform 0.2s ease, background 0.3s ease;
        }
        
        .fab-main-btn:active { transform: scale(0.95); }
        .fab-icon { width: 26px; height: 26px; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .fab-icon.open { transform: rotate(90deg) scale(1.1); }

        .fab-item {
          position: absolute; background: var(--bg-elevated, #222);
          color: var(--text-primary, #fff);
          border: 1px solid var(--border-color, #444);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; pointer-events: none;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fab-container.open .fab-item { opacity: 1; pointer-events: auto; }

        .fab-vertical, .fab-diagonal {
          width: 46px; height: 46px; border-radius: 50%;
          cursor: pointer; font-size: 1.2rem;
        }
        
        .fab-vertical { top: 5px; left: 5px; }
        .fab-container.open .fab-vertical { transform: translateY(-70px); }

        .fab-diagonal { top: 5px; left: 5px; }
        .fab-container.open .fab-diagonal { transform: translate(-60px, -60px); }

        .fab-horizontal {
          top: 5px; right: 66px; height: 46px; border-radius: 23px;
          padding: 0 8px; width: calc(100vw - 110px); max-width: 350px;
          transform: translateX(30px); transition: all 0.3s ease;
          overflow: hidden;
        }
        .fab-container.open .fab-horizontal { transform: translateX(0); }

        .fab-horizontal .category-pills-container {
          padding: 0; border: none; background: transparent;
          height: 100%; align-items: center; margin: 0; box-shadow: none;
        }
        .fab-horizontal .category-pills-container::-webkit-scrollbar { display: none; }

        /* ADDED: Strip backgrounds from pills in the FAB track */
        .fab-horizontal .pill {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: var(--text-secondary, #ccc) !important;
          padding: 8px 12px !important;
          font-weight: 500 !important;
        }

        /* ADDED: Highlight the active category using accent color instead of a background box */
        .fab-horizontal .pill.active {
          color: var(--accent-primary, #007bff) !important;
          font-weight: 700 !important;
        }
      `}</style>

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
