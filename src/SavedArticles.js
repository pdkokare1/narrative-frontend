// In file: src/SavedArticles.js
// --- COMPLETE REWRITE ---
// --- FIX: Use main 'content' wrapper to enable snap-scrolling ---
// --- FIX: Use 'article-card-wrapper' to fix card height bug ---
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './App.css'; // For theme variables AND .content/.article-card-wrapper styles
import './DashboardPages.css'; // Shared CSS file (for .placeholder-page styles)
import ArticleCard from './components/ArticleCard'; // Import the card

// Get API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function SavedArticles({
  savedArticleIds,
  onToggleSave,
  onCompare,
  onAnalyze,
  onShare,
  onRead,
  showTooltip
}) {
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // --- NEW: Filter articles on the client-side ---
  // When a user unsaves an article, the `savedArticleIds` prop updates.
  // We use this to filter the list instantly without a re-fetch.
  const visibleArticles = savedArticles.filter(article => 
    savedArticleIds.has(article._id)
  );

  return (
    // --- *** THIS IS THE FIX *** ---
    // Use the 'content' class from App.css to get the mobile snap-scroll container
    <main className="content" ref={contentRef}>
      <div className="content-scroll-wrapper">

        {loading && (
          // --- Use article-card-wrapper to center the loading spinner ---
          <div className="article-card-wrapper">
            <div className="loading-container" style={{ minHeight: '300px' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-tertiary)' }}>Loading saved articles...</p>
            </div>
          </div>
        )}

        {error && (
          // --- Use article-card-wrapper to center the error ---
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
            {visibleArticles.length > 0 ? (
              <>
                {/* --- Add a Title as the first item, it will scroll away --- */}
                <div className="article-card-wrapper" style={{ 
                  height: 'auto', // Don't make title full-height
                  minHeight: 'auto',
                  paddingTop: '20px', 
                  paddingBottom: '0', 
                  justifyContent: 'flex-start' 
                }}>
                  <h1 style={{ 
                    width: '100%', 
                    maxWidth: '500px', // Match card width
                    textAlign: 'left', 
                    fontSize: '24px',
                    color: 'var(--text-primary)',
                  }}>
                    Saved Articles ({visibleArticles.length})
                  </h1>
                </div>

                {/* --- Map over the articles, wrapping each in a card wrapper --- */}
                {visibleArticles.map((article) => (
                  <div className="article-card-wrapper" key={article._id}>
                    <ArticleCard
                      article={article}
                      onCompare={() => onCompare(article)}
                      onAnalyze={onAnalyze}
                      onShare={onShare}
                      onRead={onRead}
                      showTooltip={showTooltip}
                      isSaved={savedArticleIds.has(article._id)}
                      onToggleSave={() => onToggleSave(article)}
                    />
                  </div>
                ))}
              </>
            ) : (
              // --- Show "No Saved Articles" message in a wrapper ---
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
      </div>
    </main>
    // --- *** END OF FIX *** ---
  );
}

export default SavedArticles;
