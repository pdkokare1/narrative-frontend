// In file: src/SavedArticles.js
// --- COMPLETE REWRITE (v5) ---
// --- FIX: Renders a desktop-style grid (.articles-grid) on desktop screens ---
// --- FIX: Keeps the mobile snap-scroll layout (.article-card-wrapper) on mobile ---
// --- *** MOBILE FIX: Reduced font size for mobile title *** ---
// --- *** MOBILE FIX: Changed title format, centered, and reduced spacing *** ---
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './App.css'; // For theme variables AND .content/.article-card-wrapper styles
import './DashboardPages.css'; // Shared CSS file (for .placeholder-page styles)
import ArticleCard from './components/ArticleCard'; // Import the card

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// --- NEW: Helper function to check if we are on mobile ---
const isMobile = () => window.innerWidth <= 768;

function SavedArticles({
  onToggleSave, // We still call the original function to update App.js
  onCompare,
  onAnalyze,
  onShare,
  onRead,
  showTooltip
}) {
  const [savedArticles, setSavedArticles] = useState([]); // Local state for articles
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- NEW: State to track view mode ---
  const [isMobileView, setIsMobileView] = useState(isMobile()); 
  
  const contentRef = useRef(null); // Ref for the main scrolling container

  // Fetch saved articles when the component loads
  useEffect(() => {
    const fetchSavedArticles = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/articles/saved`);
        setSavedArticles(response.data.articles || []);
      } catch (err) {
        console.error('Error fetching saved articles:', err);
        setError('Could not load your saved articles. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSavedArticles();
  }, []); // Run once on mount
  
  // --- NEW: Effect to listen for resize ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Run once

  // This local function updates BOTH the global state (in App.js)
  // AND the local state (in this component) to provide an
  // instant "unsave" animation.
  const handleToggleSave = (article) => {
    // 1. Instantly remove the article from the local state
    setSavedArticles(prevArticles =>
      prevArticles.filter(a => a._id !== article._id)
    );
    // 2. Call the original function from App.js to update global state
    onToggleSave(article);
  };
  
  // --- NEW: Render function for the Desktop Grid ---
  const renderDesktopView = () => (
    // Use 'content-router-outlet' as the desktop scroller
    // Add a 'saved-articles-desktop-page' class for styling
    <div className="content-router-outlet saved-articles-desktop-page" ref={contentRef}>
      {loading && (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading saved articles...</p>
        </div>
      )}
      
      {error && (
        <div className="placeholder-page" style={{ padding: '20px' }}>
          <h2 style={{ color: '#E57373' }}>Error</h2>
          <p style={{ color: 'var(--text-tertiary)' }}>{error}</p>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
            Back to Articles
          </Link>
        </div>
      )}

      {!loading && !error && (
        <>
          {savedArticles.length > 0 ? (
            <>
              {/* --- Desktop Title --- */}
              <h1 className="saved-articles-desktop-title">
                Saved Articles ({savedArticles.length})
              </h1>
              
              {/* --- Desktop Grid (like NewsFeed) --- */}
              <div className="articles-grid">
                {savedArticles.map((article) => (
                  // --- NO wrapper needed on desktop ---
                  <ArticleCard
                    key={article._id}
                    article={article}
                    onCompare={() => onCompare(article)}
                    onAnalyze={onAnalyze}
                    onShare={onShare}
                    onRead={onRead}
                    showTooltip={showTooltip}
                    isSaved={true}
                    onToggleSave={() => handleToggleSave(article)}
                  />
                ))}
              </div>
            </>
          ) : (
            // --- Show "No Saved Articles" message ---
            <div className="placeholder-page" style={{ padding: '20px', minHeight: 'calc(100vh - 200px)' }}>
              <h2>No Saved Articles</h2>
              <p>You haven't saved any articles yet.</p>
              <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
                Back to Articles
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
  
  // --- NEW: Render function for the Mobile Snap-Scroll View ---
  const renderMobileView = () => (
    // Use the 'content' class from App.css to get the mobile snap-scroll container
    <main className="content" ref={contentRef}>
      {loading && (
        <div className="article-card-wrapper">
          <div className="loading-container" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-tertiary)' }}>Loading saved articles...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="article-card-wrapper">
          <div className="placeholder-page" style={{ padding: '20px' }}>
            <h2 style={{ color: '#E57373' }}>Error</h2>
            <p style={{ color: 'var(--text-tertiary)' }}>{error}</p>
            <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
              Back to Articles
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {savedArticles.length > 0 ? (
            <>
              {/* --- *** THIS IS THE MOBILE FIX (POSITION) *** --- */}
              <div style={{ 
                position: 'absolute', // Lifts text out of layout
                top: '0',
                left: '0',
                right: '0',
                paddingTop: '10px', // Reduced top padding
                paddingBottom: '10px',
                zIndex: 0, // Set to 0 so cards (z=1) scroll OVER it
                pointerEvents: 'none' // Lets you click "through" it
              }}>
                <h1 style={{ 
                  width: '100%', maxWidth: '500px',
                  margin: '0 auto', // Center the h1
                  textAlign: 'center', 
                  fontSize: '14px', 
                  color: 'var(--text-tertiary)', 
                  fontWeight: '500', 
                }}>
                  {savedArticles.length} Saved Articles 
                </h1>
              </div>
              {/* --- *** END OF FIX *** --- */}

              {/* --- Mobile List --- */}
              {savedArticles.map((article, index) => (
                // --- *** THIS IS THE MOBILE FIX (PADDING) *** ---
                <div 
                  className="article-card-wrapper" 
                  key={article._id} 
                  style={{
                    // Index 0 (First Card): 45px top padding to clear the "Saved Articles" text
                    // Index > 0 (Other Cards): 20px top padding so they don't touch the header
                    paddingTop: index === 0 ? '45px' : '20px' 
                  }}
                >
                {/* --- *** END OF FIX *** --- */}
                  <ArticleCard
                    article={article}
                    onCompare={() => onCompare(article)}
                    onAnalyze={onAnalyze}
                    onShare={onShare}
                    onRead={onRead}
                    showTooltip={showTooltip}
                    isSaved={true}
                    onToggleSave={() => handleToggleSave(article)}
                  />
                </div>
              ))}
            </>
          ) : (
            // --- Mobile "No Saved Articles" message ---
            <div className="article-card-wrapper">
              <div className="placeholder-page" style={{ padding: '20px' }}>
                <h2>No Saved Articles</h2>
                <p>You haven't saved any articles yet.</p>
                <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
                  Back to Articles
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );

  // --- NEW: Return desktop or mobile view based on state ---
  return isMobileView ? renderMobileView() : renderDesktopView();
}

export default SavedArticles;
