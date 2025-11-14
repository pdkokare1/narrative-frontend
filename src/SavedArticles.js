// In file: src/SavedArticles.js
// --- COMPLETE REWRITE (v2) ---
// --- Implements snap-scroll layout identical to main feed ---
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './App.css'; // For theme variables & layout
// --- REMOVED: './DashboardPages.css' ---
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
    // Use the exact same layout as App.js for snap-scrolling
    <main className="content">
      <div className="content-scroll-wrapper">
        
        {loading && (
          <div className="article-card-wrapper"> {/* Wrap spinner in card wrapper */}
            <div className="loading-container" style={{ minHeight: '300px' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-tertiary)' }}>Loading saved articles...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="article-card-wrapper"> {/* Wrap error in card wrapper */}
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-tertiary)' }}>
              <h2 style={{color: 'red'}}>Error</h2>
              <p>{error}</p>
              <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
                Back to Articles
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {visibleArticles.length > 0 ? (
              // Use articles-grid (which is 'display: block' on mobile)
              <div className="articles-grid">
                {visibleArticles.map((article) => (
                  // MUST use article-card-wrapper for snap-scroll
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
              </div>
            ) : (
              // Show "No Articles" message inside a snap-scroll wrapper
              <div className="article-card-wrapper">
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-tertiary)' }}>
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
