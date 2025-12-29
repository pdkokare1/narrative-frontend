// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import * as api from '../services/api';
import { useRadio } from '../context/RadioContext';
import { useToast } from '../context/ToastContext';
import './Header.css'; 
import { IArticle, INarrative, IFilters, FeedItem } from '../types';
import { Capacitor } from '@capacitor/core'; 
import WeatherWidget from './WeatherWidget'; 

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
  username: string;
  currentFilters?: IFilters;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, username, currentFilters }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [suggestions, setSuggestions] = useState<FeedItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { isPlaying, isPaused, startRadio, resume, pause, currentArticle, contextQueue, contextLabel } = useRadio();
  const { addToast } = useToast();
  const [radioLoading, setRadioLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null); 
  const searchRef = useRef<HTMLDivElement>(null); 
  const inputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (document.activeElement !== inputRef.current) setIsSearchOpen(false);
        setSuggestions([]); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await api.searchArticles(searchQuery, { limit: 5 });
          setSuggestions(data.articles || []);
        } catch (error) { console.error("Live search failed", error); } 
        finally { setIsSearching(false); }
      } else { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  const handleRadioClick = async () => {
    if (radioLoading) return;
    if (isPlaying) { pause(); return; }
    if (isPaused && currentArticle) { resume(); return; }
    
    setRadioLoading(true);

    if (contextQueue && contextQueue.length > 0) {
        addToast(`Tuning into ${contextLabel}...`, 'info');
        startRadio(contextQueue, 0);
        setRadioLoading(false);
        return;
    }

    addToast('Tuning into Gamut Radio...', 'info');
    try {
        const { data } = await api.fetchArticles({ limit: 20, offset: 0 });
        const audioArticles = (data.articles || []).filter(item => item.type !== 'Narrative') as IArticle[];
        
        if (audioArticles.length > 0) startRadio(audioArticles, 0);
        else addToast('No news available for radio.', 'error');
    } catch (err) { addToast('Could not start radio.', 'error'); } 
    finally { setRadioLoading(false); }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-container">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 className="logo-text">The Gamut</h1>
          </Link>
        </div>
      </div>

      <div className="header-right">

        {/* Weather Widget (Desktop Only handled by CSS) */}
        <WeatherWidget />
        
        {!isNative && (
          <button onClick={handleRadioClick} className={`radio-header-btn ${isPlaying ? 'playing' : ''}`} title="Start Radio">
              {radioLoading ? ( 
                  <div className="spinner-small" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--accent-primary)', margin: 0 }}></div> 
              ) : isPlaying ? ( 
                  <span className="radio-pulse"><span className="bar b1"></span><span className="bar b2"></span><span className="bar b3"></span></span> 
              ) : ( 
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> 
              )}
              <span className="radio-label-desktop">Gamut Radio</span>
          </button>
        )}

        <div ref={searchRef} className="search-bar-wrapper">
          <form onSubmit={handleSearchSubmit} className={`search-form ${isSearchOpen ? 'open' : ''}`}>
            <input ref={inputRef} type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </form>
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="search-toggle-btn" title="Search">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          
          {suggestions.length > 0 && isSearchOpen && (
              <div className="live-search-dropdown">
                  <div className="live-search-label">TOP MATCHES</div>
                  {suggestions.map(item => {
                      const isNarrative = item.type === 'Narrative';
                      const headline = isNarrative 
                          ? (item as INarrative).masterHeadline 
                          : (item as IArticle).headline;

                      return (
                          <div key={item._id} className="live-search-item" onClick={handleSearchSubmit}>
                              <span className="live-item-icon">{isNarrative ? '✨' : '📄'}</span>
                              <div className="live-item-text">
                                  <div className="live-item-headline">{headline}</div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
        </div>

        {!isNative && (
          <div className="header-user-desktop" ref={dropdownRef}> 
            <div className="header-user-clickable-area" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span className="header-username-desktop">{username}</span>
              <svg className="custom-select-arrow" style={{ width: '14px', height: '14px', fill: 'var(--text-tertiary)', marginLeft: '4px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"></path></svg>
            </div>
            {isDropdownOpen && (
              <div className="header-user-dropdown">
                <ul>
                  <li><Link to="/my-dashboard" onClick={() => setIsDropdownOpen(false)}>Dashboard</Link></li>
                  <li><Link to="/saved-articles" onClick={() => setIsDropdownOpen(false)}>Saved Articles</Link></li>
                  <li><Link to="/emergency-resources" onClick={() => setIsDropdownOpen(false)}>Emergency Help</Link></li>
                  <li><Link to="/account-settings" onClick={() => setIsDropdownOpen(false)}>Settings</Link></li>
                </ul>
              </div>
            )}
          </div>
        )}

        {!isNative && (
           <button className="theme-toggle" onClick={toggleTheme}>{theme === 'dark' ? '🌙' : '☀️'}</button>
        )}
      </div>
    </header>
  );
};

export default Header;
