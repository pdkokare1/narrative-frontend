// src/components/ui/FloatingActionMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
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
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Reset search mode whenever the menu is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsSearchMode(false);
        setSearchQuery('');
      }, 300); // Wait for close animation to finish
    }
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSearchIconClick = () => {
     setIsSearchMode(true);
     // Slight delay to ensure the input renders before we force focus to open the keypad
     setTimeout(() => {
       searchInputRef.current?.focus();
     }, 100);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (searchQuery.trim()) {
       navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
       setIsOpen(false);
     }
  };

  const handleCategorySelect = (cat: string) => {
     onFilterChange({ ...filters, category: cat });
     setIsOpen(false);
  };

  // Navigate to Emergency Resources
  const handleSOSClick = () => {
      setIsOpen(false);
      navigate('/emergency-resources');
  };

  return (
    <>
      <style>{`
        .fab-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9998; opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
        }
        .fab-overlay.open { opacity: 1; pointer-events: auto; }

        .fab-container {
          position: fixed;
          bottom: calc(65px + env(safe-area-inset-bottom, 0px)); 
          right: 20px;  
          z-index: 9999; 
        }

        .fab-main-btn {
          width: 50px; height: 50px; border-radius: 50%;
          background: var(--accent-primary, #007bff);
          color: var(--bg-primary, #fff);
          border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; z-index: 10000;
          transition: transform 0.2s ease, background 0.3s ease;
        }
        
        .fab-main-btn:active { transform: scale(0.95); }
        .fab-icon { width: 24px; height: 24px; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .fab-icon.open { transform: rotate(135deg); }

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

        /* Secondary Button Sizes */
        .fab-vertical, .fab-vertical-2, .fab-diagonal {
          width: 42px; height: 42px; border-radius: 50%;
          cursor: pointer; font-size: 1.1rem;
        }
        
        /* 1st Vertical (Theme) */
        .fab-vertical { top: 4px; left: 4px; }
        .fab-container.open .fab-vertical { transform: translateY(-60px); }

        /* 2nd Vertical (SOS) */
        .fab-vertical-2 { top: 4px; left: 4px; color: #ff4b4b; font-weight: 800; font-size: 14px; letter-spacing: 0.5px; }
        .fab-container.open .fab-vertical-2 { transform: translateY(-110px); }

        /* Diagonal (Search) */
        .fab-diagonal { top: 4px; left: 4px; }
        .fab-container.open .fab-diagonal { transform: translate(-50px, -50px); }

        /* Horizontal Track (Categories/Input) */
        .fab-horizontal {
          top: 4px; right: 60px; height: 42px; border-radius: 21px;
          padding: 0 8px; width: calc(100vw - 100px); max-width: 350px;
          transform: translateX(30px); transition: all 0.3s ease;
          overflow: hidden;
        }
        .fab-container.open .fab-horizontal { transform: translateX(0); }

        .fab-horizontal .category-pills-container {
          padding: 0; border: none; background: transparent;
          height: 100%; align-items: center; margin: 0; box-shadow: none;
        }
        .fab-horizontal .category-pills-container::-webkit-scrollbar { display: none; }

        .fab-horizontal .pill {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: var(--text-secondary, #ccc) !important;
          padding: 8px 12px !important;
          font-weight: 500 !important;
        }

        .fab-horizontal .pill.active {
          color: var(--accent-primary, #007bff) !important;
          font-weight: 700 !important;
        }

        /* Search Input Styles */
        .fab-search-form {
          width: 100%; height: 100%; display: flex; align-items: center;
        }
        .fab-search-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-primary, #fff); padding: 0 10px;
          font-size: 16px; 
        }
        .fab-search-input::placeholder {
          color: var(--text-tertiary, #888);
        }
        
        /* UPDATED: Added a hard margin-right to forcefully push the button away from the right curve */
        .fab-search-submit {
          background: none; border: none; color: var(--accent-primary, #007bff);
          padding: 0 10px; margin-right: 12px; font-weight: 700; cursor: pointer; font-size: 14px;
        }
      `}</style>

      {/* 1. Dark Screen Overlay */}
      <div 
        className={`fab-overlay ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(false)} 
      />

      {/* 2. FAB Container & Elements */}
      <div className={`fab-container ${isOpen ? 'open' : ''}`}>
         
         {/* Horizontal: Scrollable Category Track OR Search Bar */}
         <div className="fab-item fab-horizontal">
            {isSearchMode ? (
              <form onSubmit={handleSearchSubmit} className="fab-search-form">
                <input 
                  ref={searchInputRef}
                  type="text" 
                  className="fab-search-input"
                  placeholder="Search articles..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="fab-search-submit">GO</button>
              </form>
            ) : (
              <CategoryPills 
                categories={CATEGORIES}
                selectedCategory={filters.category || 'All'}
                onSelectCategory={handleCategorySelect}
              />
            )}
         </div>

         {/* Diagonal: Search Button (Trigger) */}
         <button 
            className="fab-item fab-diagonal" 
            onClick={handleSearchIconClick} 
            aria-label="Search"
            style={{ color: isSearchMode ? 'var(--accent-primary)' : 'inherit' }}
         >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
         </button>

         {/* Vertical 2: SOS Emergency Toggle */}
         <button 
            className="fab-item fab-vertical-2" 
            onClick={handleSOSClick} 
            aria-label="Emergency Contacts"
         >
            SOS
         </button>

         {/* Vertical 1: Theme Toggle */}
         <button className="fab-item fab-vertical" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
         </button>

         {/* Main Anchor Button */}
         <button className="fab-main-btn" onClick={toggleMenu}>
            <svg className={`fab-icon ${isOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <line x1="12" y1="5" x2="12" y2="19"></line>
               <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
         </button>
      </div>
    </>
  );
};

export default FloatingActionMenu;
