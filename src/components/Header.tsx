// src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import * as api from '../services/api';
import { useRadio } from '../context/RadioContext';
import { useToast } from '../context/ToastContext';
import './Header.css'; 
import { IArticle } from '../types';

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  onToggleSidebar: (e: React.MouseEvent) => void;
  username: string;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onToggleSidebar, username }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // Live Search State
  const [suggestions, setSuggestions] = useState<IArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Radio State
  const { isPlaying, isPaused, startRadio, resume, pause, currentArticle } = useRadio();
  const { addToast } = useToast();
  const [radioLoading, setRadioLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null); 
  const searchRef = useRef<HTMLDivElement>(null); 
  const inputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();

  // Effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (document.activeElement !== inputRef.current) {
             setIsSearchOpen(false);
        }
        setSuggestions([]); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // --- LIVE SEARCH DEBOUNCE ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await api.searchArticles(searchQuery, { limit: 5 });
          setSuggestions(data.articles || []);
        } catch (error) {
          console.error("Live search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleUsernameClick = (e: React.MouseEvent) => {
     e.stopPropagation(); 
     setIsDropdownOpen(prev => !prev); 
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSuggestions([]);
      setSearchQuery(''); 
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const handleSuggestionClick = (articleId: string) => {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`); 
      setIsSearchOpen(false);
      setSuggestions([]);
      setSearchQuery('');
  };

  const toggleSearch = () => {
      setIsSearchOpen(!isSearchOpen);
      if (isSearchOpen) {
          setSuggestions([]);
          setSearchQuery('');
      }
  };

  // --- RADIO HANDLER ---
  const handleRadioClick = async () => {
    if (radioLoading) return;

    if (isPlaying) {
        pause();
        return;
    }

    if (isPaused && currentArticle) {
        resume();
        return;
    }

    setRadioLoading(true);
    addToast('Tuning into Gamut Radio...', 'info');
    
    try {
        const { data } = await api.fetchArticles({ limit: 20, offset: 0 });
        if (data.articles && data.articles.length > 0) {
            startRadio(data.articles, 0);
        } else {
            addToast('No news available for radio.', 'error');
        }
    } catch (err) {
        console.error("Radio start failed", err);
        addToast('Could not start radio.', 'error');
    } finally {
        setRadioLoading(false);
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
        
        {/* --- RADIO BUTTON (Moved from Bottom Nav) --- */}
        <button 
            onClick={handleRadioClick}
            className={`radio-header-btn ${isPlaying ? 'playing' : ''}`}
            title="Start Radio"
        >
            {radioLoading ? (
                <div className="spinner-small" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--accent-primary)', margin: 0 }}></div>
            ) : isPlaying ? (
                /* Pulse Animation for Playing */
                <span className="radio-pulse">
                    <span className="bar b1"></span>
                    <span className="bar b2"></span>
                    <span className="bar b3"></span>
                </span>
            ) : (
                /* Headphones Icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
            )}
        </button>

        {/* --- Responsive Search Bar --- */}
        <div ref={searchRef} className="search-bar-wrapper">
          <form 
            onSubmit={handleSearchSubmit} 
            className={`search-form ${isSearchOpen ? 'open' : ''}`}
          >
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && <div className="search-spinner"></div>}
          </form>
          
          <button 
            onClick={toggleSearch}
            className="search-toggle-btn"
            title="Search Articles"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isSearchOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </>
              )}
            </svg>
          </button>

          {suggestions.length > 0 && isSearchOpen && (
              <div className="live-search-dropdown">
                  <div className="live-search-label">TOP MATCHES</div>
                  {suggestions.map(article => (
                      <div 
                        key={article._id} 
                        className="live-search-item"
                        onClick={() => handleSuggestionClick(article._id)}
                      >
                          <span className="live-item-icon">📄</span>
                          <div className="live-item-text">
                              <div className="live-item-headline">{article.headline}</div>
                              <div className="live-item-meta">{article.source} • {new Date(article.publishedAt).toLocaleDateString()}</div>
                          </div>
                      </div>
                  ))}
                  <div className="live-search-footer" onClick={handleSearchSubmit}>
                      See all results for "{searchQuery}" →
                  </div>
              </div>
          )}
        </div>

        {/* --- Desktop User Menu --- */}
        <div className="header-user-desktop" ref={dropdownRef}> 
          <Link to="/my-dashboard" className="header-dashboard-link" title="View your dashboard">
            Dashboard
          </Link>
          <span className="header-user-divider">|</span>
          <div className="header-user-clickable-area" onClick={handleUsernameClick}>
            <span className="header-username-desktop" title="Username">{username}</span>
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

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

      </div>
    </header>
  );
};

export default Header;
