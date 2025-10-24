import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Ensure App.css is imported

// Use environment variable for API URL, fallback to localhost for local dev
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [displayedArticles, setDisplayedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load
  const [theme, setTheme] = useState('dark');
  const [filters, setFilters] = useState({
    category: 'All Categories',
    lean: 'All Leans',
    quality: 'All Quality Levels',
    sort: 'Latest First'
  });
  const [compareModal, setCompareModal] = useState({ open: false, clusterId: null, articleTitle: '' }); // Added title
  const [analysisModal, setAnalysisModal] = useState({ open: false, article: null });
  const [totalArticlesCount, setTotalArticlesCount] = useState(0); // Track total count from API

  // Effect to set initial theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme + '-mode';
  }, []);

  // Effect to fetch articles when filters change or on initial load
  useEffect(() => {
    fetchArticles();
  }, [filters]); // Re-fetch when filters change

  const fetchArticles = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true); // Show loading spinner only on filter change/initial load
        setInitialLoad(true);
      }
      const limit = 12; // Articles per page/load
      const offset = loadMore ? displayedArticles.length : 0;

      // console.log(`Fetching articles with filters: ${JSON.stringify(filters)}, Limit: ${limit}, Offset: ${offset}`);

      const response = await axios.get(`${API_URL}/articles`, {
        params: { ...filters, limit, offset }
      });

      // console.log("API Response:", response.data); // Log API response

      const articlesData = response.data.articles || [];
      const paginationData = response.data.pagination || { total: 0 };
      setTotalArticlesCount(paginationData.total || 0);

      // --- Data Cleaning and Defaulting (Important) ---
      const uniqueNewArticles = articlesData
        .filter(article => article && article.url) // Ensure article and URL exist
        .map(article => ({
            _id: article._id || article.url, // Use URL as fallback key if _id missing
            headline: article.headline || article.title || 'No Headline Available',
            summary: article.summary || article.description || 'No summary available.',
            source: article.source || 'Unknown Source',
            category: article.category || 'General',
            politicalLean: article.politicalLean || 'Center',
            url: article.url,
            imageUrl: article.imageUrl || null, // Default to null if missing
            publishedAt: article.publishedAt || new Date().toISOString(),
            analysisType: ['Full', 'SentimentOnly'].includes(article.analysisType) ? article.analysisType : 'Full', // Validate or default
            sentiment: ['Positive', 'Negative', 'Neutral'].includes(article.sentiment) ? article.sentiment : 'Neutral',
            // Scores (ensure they are numbers, default 0)
            biasScore: Number(article.biasScore) || 0,
            trustScore: Number(article.trustScore) || 0, // This is now calculated on backend
            credibilityScore: Number(article.credibilityScore) || 0,
            reliabilityScore: Number(article.reliabilityScore) || 0,
            // Grades/Labels (default if missing)
            credibilityGrade: article.credibilityGrade || null,
            // Components (ensure they exist as objects)
            biasComponents: article.biasComponents && typeof article.biasComponents === 'object' ? article.biasComponents : {},
            credibilityComponents: article.credibilityComponents && typeof article.credibilityComponents === 'object' ? article.credibilityComponents : {},
            reliabilityComponents: article.reliabilityComponents && typeof article.reliabilityComponents === 'object' ? article.reliabilityComponents : {},
            // Arrays (ensure they exist)
            keyFindings: Array.isArray(article.keyFindings) ? article.keyFindings : [],
            recommendations: Array.isArray(article.recommendations) ? article.recommendations : [],
            // Cluster ID
            clusterId: article.clusterId || null // Use null if missing
        }));
      // --- End Data Cleaning ---


      if (loadMore) {
        // Append new articles, preventing duplicates based on URL
         const currentUrls = new Set(displayedArticles.map(a => a.url));
         const trulyNewArticles = uniqueNewArticles.filter(a => !currentUrls.has(a.url));
         setDisplayedArticles(prev => [...prev, ...trulyNewArticles]);
      } else {
         // Replace articles on filter change/initial load
         setDisplayedArticles(uniqueNewArticles);
      }

      setLoading(false);
      setInitialLoad(false);

    } catch (error) {
      console.error('❌ Error fetching articles:', error.response ? error.response.data : error.message);
      setLoading(false); // Ensure loading stops on error
      setInitialLoad(false);
      // Optionally: Add user-facing error message state here
    }
  };

  const loadMoreArticles = () => {
    // Prevent loading more if already loading or no more articles
    if (loading || displayedArticles.length >= totalArticlesCount) return;
    fetchArticles(true); // Pass flag indicating this is a "load more" action
  };


  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
      // Fetching is handled by the useEffect watching filters
  };

  // Debounced scroll handler (optional optimization)
  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            // Check if user is near the bottom
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
                // Check if not loading, and if there are more articles to load
                if (!loading && displayedArticles.length < totalArticlesCount) {
                    // console.log("Scroll near bottom detected, loading more...");
                    loadMoreArticles();
                }
            }
        }, 150); // Adjust debounce delay as needed
    };

    window.addEventListener('scroll', handleScroll);
    // Cleanup function
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', handleScroll);
    };
}, [loading, displayedArticles, totalArticlesCount]); // Dependencies for the scroll effect


  const shareArticle = (article) => {
    if (navigator.share) {
      navigator.share({
        title: article.headline,
        text: `Check out this analysis: ${article.headline}`, // Shorter text
        url: article.url
      }).then(() => {
        console.log('Article shared successfully');
      }).catch((error) => {
        console.error('Share failed:', error);
        // Fallback to copy link if share fails (e.g., user cancels)
        navigator.clipboard.writeText(article.url).then(() => alert('Link copied to clipboard!'));
      });
    } else {
      // Fallback for browsers without navigator.share
      navigator.clipboard.writeText(article.url).then(() => alert('Link copied to clipboard!'));
    }
  };


  return (
    <div className="app">
      <Header theme={theme} toggleTheme={toggleTheme} />

      <div className="main-container">
        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange} // Use handler to potentially debounce/manage filter state
          articleCount={totalArticlesCount} // Use total count from API
        />

        <main className="content">
          {/* --- REMOVED .content-header --- */}

          {(loading && initialLoad) ? ( // Show loading only on initial/filter load
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : (
            <>
              {displayedArticles.length > 0 ? (
                 <div className="articles-grid">
                  {displayedArticles.map((article) => ( // Use unique _id or url
                    <ArticleCard
                      key={article._id || article.url}
                      article={article}
                      onCompare={(clusterId, title) => setCompareModal({ open: true, clusterId, articleTitle: title })}
                      onAnalyze={(article) => setAnalysisModal({ open: true, article })}
                      onShare={shareArticle}
                    />
                  ))}
                 </div>
              ) : (
                // Show message if no articles match filters (and not loading)
                 <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                    <p>No articles found matching your current filters.</p>
                 </div>
              )}


              {/* Show Load More button only if there are more articles */}
              {!loading && displayedArticles.length < totalArticlesCount && (
                <div className="load-more">
                  <button onClick={loadMoreArticles} className="load-more-btn">
                    Load More ({totalArticlesCount - displayedArticles.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {compareModal.open && (
        <CompareCoverageModal
          clusterId={compareModal.clusterId}
          articleTitle={compareModal.articleTitle} // Pass title
          onClose={() => setCompareModal({ open: false, clusterId: null, articleTitle: '' })}
          onAnalyze={(article) => {
            setCompareModal({ open: false, clusterId: null, articleTitle: '' }); // Close compare modal
            setAnalysisModal({ open: true, article }); // Open analysis modal
          }}
        />
      )}

      {analysisModal.open && (
        <DetailedAnalysisModal
          article={analysisModal.article}
          onClose={() => setAnalysisModal({ open: false, article: null })}
        />
      )}
    </div>
  );
}

// === Sub-Components ===

// --- Header ---
function Header({ theme, toggleTheme }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1>The Narrative</h1>
        <p>Refined Multi-Perspective Analysis</p>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}

// --- Sidebar ---
// --- MOVED articleCount to the bottom ---
function Sidebar({ filters, onFilterChange, articleCount }) {
  // Define options directly in the component
  const categories = ['All Categories', 'Politics', 'Economy', 'Technology', 'Health', 'Environment', 'Justice', 'Education', 'Entertainment', 'Sports', 'Other'];
  const leans = ['All Leans', 'Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];
  const qualityLevels = ['All Quality Levels', 'A+ Premium (90-100)', 'A High (80-89)', 'B Professional (70-79)', 'C Acceptable (60-69)', 'D-F Poor (0-59)'];
  const sortOptions = ['Latest First', 'Highest Quality', 'Most Covered', 'Lowest Bias'];

  // Handle individual filter changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <aside className="sidebar">
      <div> {/* Added wrapper div to control flex */}
        <div className="filter-section">
          <h3>Category</h3>
          <select name="category" value={filters.category} onChange={handleChange}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="filter-section">
          <h3>Political Leaning</h3>
          <select name="lean" value={filters.lean} onChange={handleChange}>
            {leans.map(lean => <option key={lean} value={lean}>{lean}</option>)}
          </select>
        </div>

        <div className="filter-section">
          <h3>Quality Level</h3>
          <select name="quality" value={filters.quality} onChange={handleChange}>
            {qualityLevels.map(level => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>

        <div className="filter-section">
          <h3>Sort By</h3>
          <select name="sort" value={filters.sort} onChange={handleChange}>
            {sortOptions.map(sort => <option key={sort} value={sort}>{sort}</option>)}
          </select>
        </div>
      </div>

      {/* --- MOVED to bottom --- */}
      {articleCount > 0 && (
        <div className="filter-results">
          <p>{articleCount} articles analyzed</p>
        </div>
      )}
    </aside>
  );
}


// --- UPDATED ArticleCard Component (v2.7) ---
// --- Adds Sentiment to quality display ---
function ArticleCard({ article, onCompare, onAnalyze, onShare }) {

  const isReview = article.analysisType === 'SentimentOnly';

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'flex';
    }
  };
  
  // Get sentiment-based tooltip
  const getSentimentTooltip = (sentiment) => {
    switch(sentiment) {
      case 'Positive': return 'The article has a positive sentiment towards its subject.';
      case 'Negative': return 'The article has a negative sentiment towards its subject.';
      case 'Neutral': return 'The article has a neutral sentiment towards its subject.';
      default: return 'Sentiment analysis';
    }
  };
  
  // Get sentiment-based icon
  const getSentimentIcon = (sentiment) => {
    switch(sentiment) {
      case 'Positive': return '😊';
      case 'Negative': return '😠';
      case 'Neutral': return '😐';
      default: return '😐';
    }
  };

  return (
    <div className="article-card">
      <div className="article-image">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={`Image for ${article.headline}`}
            onError={handleImageError}
            loading="lazy"
          />
        ) : null}
        <div className="image-placeholder" style={{ display: article.imageUrl ? 'none' : 'flex' }}>
          📰
        </div>
      </div>

      <div className="article-content">
         <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-headline-link">
             <h3 className="article-headline">{article.headline}</h3>
         </a>

        <p className="article-summary">{article.summary}</p>

        <div className="article-meta">
          <span className="source">{article.source}</span>
        </div>

        {/* --- NEW Quality Display (with Grade and Sentiment) --- */}
        <div className="quality-display-v2">
             {isReview ? (
                 <span className="quality-grade-text" title="This article is an opinion, review, or summary.">
                   Review / Opinion
                 </span>
             ) : article.credibilityGrade ? (
                 <span className="quality-grade-text" title={`Overall Trust Score: ${article.trustScore}/100`}>
                   Grade: {article.credibilityGrade}
                 </span>
             ) : (
                 <span className="quality-grade-text" title="Quality grade not available.">
                   Grade: N/A
                 </span>
             )}
             
             {/* --- ADDED SENTIMENT --- */}
             <span 
                className="sentiment-text" 
                title={getSentimentTooltip(article.sentiment)}
             >
                {getSentimentIcon(article.sentiment)} {article.sentiment}
             </span>
         </div>
         {/* --- End Simplified Display --- */}


        {/* --- Actions (Handles SentimentOnly) --- */}
        <div className="article-actions">
          {isReview ? (
            // --- UI for SentimentOnly (Reviews, Sports, etc.) ---
            <>
              <div className="article-actions-top">
                <button
                  onClick={() => onShare(article)}
                  className="btn-secondary"
                  title="Share article link"
                  style={{ width: '100%' }} // Make share button full width
                >
                  Share
                </button>
              </div>
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary btn-full-width" 
                style={{ textDecoration: 'none', textAlign: 'center' }}
                title="Read the full article on the source's website"
              >
                Read Article
              </a>
            </>
          ) : (
            // --- UI for Full Analysis ---
            <>
              <div className="article-actions-top">
                <button
                  onClick={() => onAnalyze(article)}
                  className="btn-secondary"
                  title="View Detailed Analysis"
                >
                  Analysis
                </button>
                <button
                  onClick={() => onShare(article)}
                  className="btn-secondary"
                  title="Share article link"
                >
                  Share
                </button>
              </div>
              <button
                onClick={() => onCompare(article.clusterId, article.headline)} // Pass headline too
                className="btn-primary btn-full-width"
                title="Compare Coverage Across Perspectives"
                disabled={!article.clusterId} // Disable if no clusterId
              >
                Compare Coverage
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// --- END of UPDATED ArticleCard Component ---


// --- Modal Components ---

// --- Compare Coverage Modal (REMOVED 'All' Tab) ---
function CompareCoverageModal({ clusterId, articleTitle, onClose, onAnalyze }) {
  const [clusterData, setClusterData] = useState({ left: [], center: [], right: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null); // Set to null initially

  useEffect(() => {
    const fetchCluster = async () => {
      if (!clusterId) {
          setLoading(false);
          return;
      }
      try {
        setLoading(true);
        // console.log(`Fetching cluster data for ID: ${clusterId}`);
        const response = await axios.get(`${API_URL}/cluster/${clusterId}`);
        // console.log("Cluster Response:", response.data);
        
        const data = {
            left: response.data.left || [],
            center: response.data.center || [],
            right: response.data.right || [],
            stats: response.data.stats || {}
        };
        setClusterData(data);
        
        // --- Set default active tab ---
        if (data.left.length > 0) setActiveTab('left');
        else if (data.center.length > 0) setActiveTab('center');
        else if (data.right.length > 0) setActiveTab('right');
        else setActiveTab('left'); // Fallback

        setLoading(false);
      } catch (error) {
        console.error(`❌ Error fetching cluster ${clusterId}:`, error.response ? error.response.data : error.message);
        setLoading(false);
      }
    };

    fetchCluster();
  }, [clusterId]);

   const totalArticles = (clusterData.left?.length || 0) + (clusterData.center?.length || 0) + (clusterData.right?.length || 0);

   const handleOverlayClick = (e) => {
       if (e.target === e.currentTarget) {
           onClose();
       }
   };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Compare Coverage: "{articleTitle.substring(0, 40)}..."</h2>
          <button className="close-btn" onClick={onClose} title="Close comparison">×</button>
        </div>

        {/* --- Tabs (REMOVED 'All') --- */}
         <div className="modal-tabs">
          <button className={activeTab === 'left' ? 'active' : ''} onClick={() => setActiveTab('left')}>
            Left ({clusterData.left.length})
          </button>
          <button className={activeTab === 'center' ? 'active' : ''} onClick={() => setActiveTab('center')}>
            Center ({clusterData.center.length})
          </button>
          <button className={activeTab === 'right' ? 'active' : ''} onClick={() => setActiveTab('right')}>
            Right ({clusterData.right.length})
          </button>
        </div>


        <div className="modal-body">
          {loading ? (
            <div className="loading-container" style={{ minHeight: '200px' }}>
              <div className="spinner"></div>
              <p>Loading coverage comparison...</p>
            </div>
          ) : totalArticles === 0 ? (
             <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                <p>No other articles found covering this specific topic.</p>
             </div>
          ) : (
            <>
              {/* --- Logic updated to NOT show all by default --- */}
              {activeTab === 'left' && renderArticleGroup(clusterData.left, 'Left', onAnalyze)}
              {activeTab === 'center' && renderArticleGroup(clusterData.center, 'Center', onAnalyze)}
              {activeTab === 'right' && renderArticleGroup(clusterData.right, 'Right', onAnalyze)}

              {/* Message if a specific tab has no articles */}
              {activeTab && clusterData[activeTab]?.length === 0 && (
                 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    <p>No articles found for the '{activeTab}' perspective in this cluster.</p>
                 </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper function to render article groups (ADDED Image) ---
function renderArticleGroup(articleList, perspective, onAnalyze) {
  if (!articleList || articleList.length === 0) return null;

  return (
    <div className="perspective-section">
      <h3 className={`perspective-title ${perspective.toLowerCase()}`}>{perspective} Perspective</h3>
      {articleList.map(article => (
        <div key={article._id || article.url} className="coverage-article">
          {/* --- Content Wrapper --- */}
          <div className="coverage-content">
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <h4>{article.headline || 'No Headline'}</h4>
            </a>
            <p>
              {(article.summary || '').substring(0, 150)}{article.summary && article.summary.length > 150 ? '...' : ''}
            </p>

            <div className="article-scores">
              <span title="Bias Score (0-100, lower is less biased)">Bias: {article.biasScore ?? 'N/A'}</span>
              <span title="Overall Trust Score (0-100, higher is more trustworthy)">Trust: {article.trustScore ?? 'N/A'}</span>
              <span title="Credibility Grade (A+ to F)">Grade: {article.credibilityGrade || 'N/A'}</span>
            </div>
            <div className="coverage-actions">
              <a href={article.url} target="_blank" rel="noopener noreferrer" style={{flex: 1}}>
                  <button style={{width: '100%'}}>Read Article</button>
              </a>
              <button onClick={() => onAnalyze(article)}>View Analysis</button>
            </div>
          </div>
          
          {/* --- Image Thumbnail --- */}
          <div className="coverage-image">
            {article.imageUrl ? (
              <img src={article.imageUrl} alt="Article thumbnail" loading="lazy" />
            ) : (
              <div className="image-placeholder-small">📰</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


// Detailed Analysis Modal
function DetailedAnalysisModal({ article, onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // Default tab

   const handleOverlayClick = (e) => {
       if (e.target === e.currentTarget) {
           onClose();
       }
   };

  if (!article) {
    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Analysis Unavailable</h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="modal-content" style={{textAlign: 'center', padding: '50px'}}>
                 <p style={{color: 'var(--text-tertiary)'}}>Article data is missing or corrupted.</p>
            </div>
          </div>
        </div>
    );
  }


  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Analysis: "{article.headline.substring(0, 50)}{article.headline.length > 50 ? '...' : ''}"</h2>
          <button className="close-btn" onClick={onClose} title="Close analysis">×</button>
        </div>

        <div className="modal-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={activeTab === 'bias' ? 'active' : ''} onClick={() => setActiveTab('bias')}>
            Bias Details
          </button>
          <button className={activeTab === 'credibility' ? 'active' : ''} onClick={() => setActiveTab('credibility')}>
            Credibility
          </button>
          <button className={activeTab === 'reliability' ? 'active' : ''} onClick={() => setActiveTab('reliability')}>
            Reliability
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && <OverviewTab article={article} />}
          {activeTab === 'bias' && <BiasTab article={article} />}
          {activeTab === 'credibility' && <CredibilityTab article={article} />}
          {activeTab === 'reliability' && <ReliabilityTab article={article} />}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close Analysis</button>
        </div>
      </div>
    </div>
  );
}

// --- Analysis Tab Components ---

function OverviewTab({ article }) {
  return (
    <div className="tab-content">
      <div className="overview-grid">
        <ScoreBox label="Trust Score" value={article.trustScore} />
        <ScoreBox label="Bias Score" value={article.biasScore} />
        <ScoreBox label="Credibility" value={article.credibilityScore} />
        <ScoreBox label="Reliability" value={article.reliabilityScore} />
      </div>

       {article.keyFindings && article.keyFindings.length > 0 && (
         <div className="recommendations">
            <h4>Key Findings</h4>
            <ul>
                {article.keyFindings.map((finding, i) => <li key={`kf-${i}`}>{finding}</li>)}
            </ul>
         </div>
       )}

       {article.recommendations && article.recommendations.length > 0 && (
         <div className="recommendations" style={{ marginTop: '20px' }}>
            <h4>Recommendations</h4>
            <ul>
                {article.recommendations.map((rec, i) => <li key={`rec-${i}`}>{rec}</li>)}
            </ul>
         </div>
       )}

        {(!article.keyFindings || article.keyFindings.length === 0) &&
         (!article.recommendations || article.recommendations.length === 0) && (
            <p style={{color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '30px'}}>
                No specific key findings or recommendations were generated for this article.
            </p>
         )}
    </div>
  );
}

function BiasTab({ article }) {
  const components = article.biasComponents || {};
  const linguistic = components.linguistic || {};
  const sourceSelection = components.sourceSelection || {};
  const demographic = components.demographic || {};
  const framing = components.framing || {};

  return (
    <div className="tab-content">
      <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 600 }}>
        Bias Analysis: {article.biasScore ?? 'N/A'}/100 ({article.biasLabel || 'Not Available'})
      </h3>

      <div className="component-grid">
        <SemiCircleProgressBar label="Sentiment Polarity" value={linguistic.sentimentPolarity} />
        <SemiCircleProgressBar label="Emotional Language" value={linguistic.emotionalLanguage} />
        <SemiCircleProgressBar label="Loaded Terms" value={linguistic.loadedTerms} />
        <SemiCircleProgressBar label="Complexity Bias" value={linguistic.complexityBias} />
        <SemiCircleProgressBar label="Source Diversity" value={sourceSelection.sourceDiversity} />
        <SemiCircleProgressBar label="Expert Balance" value={sourceSelection.expertBalance} />
        <SemiCircleProgressBar label="Attribution Transparency" value={sourceSelection.attributionTransparency} />
        <SemiCircleProgressBar label="Gender Balance" value={demographic.genderBalance} />
        <SemiCircleProgressBar label="Racial Balance" value={demographic.racialBalance} />
        <SemiCircleProgressBar label="Age Representation" value={demographic.ageRepresentation} />
        <SemiCircleProgressBar label="Headline Framing" value={framing.headlineFraming} />
        <SemiCircleProgressBar label="Story Selection" value={framing.storySelection} />
        <SemiCircleProgressBar label="Omission Bias" value={framing.omissionBias} />
      </div>
    </div>
  );
}

function CredibilityTab({ article }) {
  const components = article.credibilityComponents || {};
  return (
    <div className="tab-content">
      <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 600 }}>
        Credibility Score: {article.credibilityScore ?? 'N/A'}/100 (Grade: {article.credibilityGrade || 'N/A'})
      </h3>

      <div className="component-grid">
        <SemiCircleProgressBar label="Source Credibility" value={components.sourceCredibility} />
        <SemiCircleProgressBar label="Fact Verification" value={components.factVerification} />
        <SemiCircleProgressBar label="Professionalism" value={components.professionalism} />
        <SemiCircleProgressBar label="Evidence Quality" value={components.evidenceQuality} />
        <SemiCircleProgressBar label="Transparency" value={components.transparency} />
        <SemiCircleProgressBar label="Audience Trust" value={components.audienceTrust} />
      </div>
    </div>
  );
}

function ReliabilityTab({ article }) {
  const components = article.reliabilityComponents || {};
  return (
    <div className="tab-content">
      <h3 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 600 }}>
        Reliability Score: {article.reliabilityScore ?? 'N/A'}/100 (Grade: {article.reliabilityGrade || 'N/A'})
      </h3>

      <div className="component-grid">
        <SemiCircleProgressBar label="Consistency" value={components.consistency} />
        <SemiCircleProgressBar label="Temporal Stability" value={components.temporalStability} />
        <SemiCircleProgressBar label="Quality Control" value={components.qualityControl} />
        <SemiCircleProgressBar label="Publication Standards" value={components.publicationStandards} />
        <SemiCircleProgressBar label="Corrections Policy" value={components.correctionsPolicy} />
        <SemiCircleProgressBar label="Update Maintenance" value={components.updateMaintenance} />
      </div>
    </div>
  );
}

// --- Reusable UI Components ---

// Score Box for Overview Tab
function ScoreBox({ label, value }) {
  let tooltip = '';
  switch(label) {
    case 'Trust Score':
      tooltip = 'Overall Trust Score (0-100) = sqrt(Credibility * Reliability). Higher is better.';
      break;
    case 'Bias Score':
      tooltip = 'Overall Bias Score (0-100). 0 is least biased, 100 is most biased.';
      break;
    case 'Credibility':
      tooltip = 'Credibility Score (UCS, 0-100). Based on source, verification, professionalism, evidence, transparency, and audience trust.';
      break;
    case 'Reliability':
      tooltip = 'Reliability Score (URS, 0-100). Based on consistency, stability, quality control, standards, and corrections policy.';
      break;
    default:
      tooltip = `${label} (0-100)`;
  }
  
  return (
    <div className="score-circle" title={tooltip}>
      <div className="score-value">{value ?? 'N/A'}</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

// --- NEW Semi-Circular Progress Bar Component ---
function SemiCircleProgressBar({ label, value }) {
  const numericValue = Math.max(0, Math.min(100, Number(value) || 0));
  // Map value (0-100) to rotation (0-180 degrees)
  const rotation = (numericValue / 100) * 180;
  
  return (
    <div className="semicircle-container" title={`${label}: ${numericValue}/100`}>
      <div className="semicircle">
        <div className="semicircle-mask">
          <div className="semicircle-fill" style={{ transform: `rotate(${rotation}deg)` }}></div>
        </div>
      </div>
      <div className="semicircle-label">{label}</div>
      <div className="semicircle-value">{numericValue}</div>
    </div>
  );
}

export default App;
