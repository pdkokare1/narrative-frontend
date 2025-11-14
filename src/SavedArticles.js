// In file: src/SavedArticles.js
// --- COMPLETE REWRITE ---
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './App.css'; // For theme variables
import './DashboardPages.css'; // Shared CSS file
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
    // Use dashboard-page for consistent padding/scrolling
    <div className="dashboard-page">
      
      {/* We re-use the placeholder-page class for centering, but add our grid */}
      <div className="placeholder-page" style={{ justifyContent: 'flex-start', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ width: '100%', textAlign: 'left', paddingLeft: '10px' }}>Saved Articles</h1>

        {loading && (
          <div className="loading-container" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-tertiary)' }}>Loading saved articles...</p>
          </div>
        )}

        {error && (
          <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
        )}

        {!loading && !error && (
          <>
            {visibleArticles.length > 0 ? (
              <div className="articles-grid">
                {visibleArticles.map((article) => (
                  // We don't need the mobile "wrapper" here, just the card
                  <ArticleCard
                    key={article._id}
                    article={article}
                    onCompare={() => onCompare(article)}
                    onAnalyze={onAnalyze}
                    onShare={onShare}
                    onRead={onRead}
                    showTooltip={showTooltip}
                    isSaved={savedArticleIds.has(article._id)}
                    onToggleSave={() => onToggleSave(article)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-tertiary)' }}>
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
    </div>
  );
}

export default SavedArticles;
