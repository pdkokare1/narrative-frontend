import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Ensure App.css is imported

// Use environment variable for API URL, fallback to localhost for local dev
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [articles, setArticles] = useState([]);
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

      console.log(`Fetching articles with filters: ${JSON.stringify(filters)}, Limit: ${limit}, Offset: ${offset}`);

      const response = await axios.get(`${API_URL}/articles`, {
        params: { ...filters, limit, offset }
      });

      console.log("API Response:", response.data); // Log API response

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
            trustScore: Number(article.trustScore) || 0,
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
                    console.log("Scroll near bottom detected, loading more...");
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
          // onApply={fetchArticles} // Replaced by useEffect on filters
          articleCount={totalArticlesCount} // Use total count from API
        />

        <main className="content">
          <div className="content-header">
            <h2>Latest News Analysis</h2>
            <p className="subtitle">{totalArticlesCount} articles analyzed</p>
          </div>

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

      {/* Apply button removed - filtering happens onChange via useEffect in App */}
      {/* <button className="apply-filters-btn" onClick={onApply}>Apply Filters</button> */}

      {/* Show count only if > 0 */}
      {articleCount > 0 && (
        <div className="filter-results">
          <p>Showing {articleCount} articles</p>
        </div>
      )}
    </aside>
  );
}


// --- UPDATED ArticleCard Component ---
function ArticleCard({ article, onCompare, onAnalyze, onShare }) {

  // Determine if it's a review/opinion piece
  const isReview = article.analysisType === 'SentimentOnly';

  // Fallback image handler
  const handleImageError = (e) => {
    e.target.style.display = 'none'; // Hide the broken image
    // Find the sibling placeholder and display it
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'flex';
    }
  };

  return (
    <div className="article-card">
      <div className="article-image">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={`Image for ${article.headline}`} // More descriptive alt text
            onError={handleImageError}
            loading="lazy" // Lazy load images
          />
        ) : null}
         {/* Placeholder is always rendered but hidden by default if imageUrl exists */}
        <div className="image-placeholder" style={{ display: article.imageUrl ? 'none' : 'flex' }}>
          📰 {/* Or use a more abstract icon */}
        </div>
      </div>

      <div className="article-content">
        {/* Use link for headline */}
         <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-headline-link">
             <h3 className="article-headline">{article.headline}</h3>
         </a>

        <p className="article-summary">{article.summary}</p>

        <div className="article-meta">
          <span className="source">{article.source}</span>
          {/* Optionally add published date here */}
          {/* <span className="date">{new Date(article.publishedAt).toLocaleDateString()}</span> */}
        </div>

        {/* --- NEW Simplified Quality Display --- */}
        <div className="quality-display">
             {isReview ? (
                 <span className="quality-grade-text">Review / Opinion Piece</span>
             ) : article.credibilityGrade ? (
                 <span className="quality-grade-text">Quality Grade: {article.credibilityGrade}</span>
             ) : (
                 <span className="quality-grade-text">Quality Grade: N/A</span> // Handle missing grade
             )}
         </div>
         {/* --- End Simplified Display --- */}


        <div className="article-actions">
          <div className="article-actions-top">
            <button
              onClick={() => onAnalyze(article)}
              className="btn-secondary"
              title={isReview ? "Detailed analysis not applicable for reviews" : "View Detailed Analysis"}
              disabled={isReview} // Disable button if it's a review
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
            title={isReview ? "Coverage comparison not applicable for reviews" : "Compare Coverage Across Perspectives"}
            disabled={isReview || !article.clusterId} // Disable if review OR no clusterId
          >
            Compare Coverage
          </button>
        </div>
      </div>
    </div>
  );
}
// --- END of UPDATED ArticleCard Component ---


// --- Modal Components ---

// Compare Coverage Modal
function CompareCoverageModal({ clusterId, articleTitle, onClose, onAnalyze }) {
  const [clusterData, setClusterData] = useState({ left: [], center: [], right: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // Default to 'all'

  useEffect(() => {
    const fetchCluster = async () => {
      if (!clusterId) {
          setLoading(false); // No ID, nothing to fetch
          return;
      }
      try {
        setLoading(true);
        console.log(`Fetching cluster data for ID: ${clusterId}`);
        const response = await axios.get(`${API_URL}/cluster/${clusterId}`);
        console.log("Cluster Response:", response.data);
        setClusterData({
            left: response.data.left || [],
            center: response.data.center || [],
            right: response.data.right || [],
            stats: response.data.stats || {}
        });
        setLoading(false);
      } catch (error) {
        console.error(`❌ Error fetching cluster ${clusterId}:`, error.response ? error.response.data : error.message);
        setLoading(false);
        // Optionally set an error state to display to the user
      }
    };

    fetchCluster();
  }, [clusterId]); // Refetch only when clusterId changes

   // Calculate total once data is loaded
   const totalArticles = clusterData.left.length + clusterData.center.length + clusterData.right.length;

   // Handle click outside modal to close
   const handleOverlayClick = (e) => {
       if (e.target === e.currentTarget) {
           onClose();
       }
   };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside modal from closing it */}
        <div className="modal-header">
          {/* Display original article title for context */}
          <h2>Compare Coverage: "{articleTitle.substring(0, 40)}..."</h2>
          <button className="close-btn" onClick={onClose} title="Close comparison">×</button>
        </div>

        {/* Tabs */}
         <div className="modal-tabs">
          <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
            All ({totalArticles})
          </button>
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
              {(activeTab === 'all' || activeTab === 'left') && renderArticleGroup(clusterData.left, 'Left', onAnalyze)}
              {(activeTab === 'all' || activeTab === 'center') && renderArticleGroup(clusterData.center, 'Center', onAnalyze)}
              {(activeTab === 'all' || activeTab === 'right') && renderArticleGroup(clusterData.right, 'Right', onAnalyze)}

              {/* Message if a specific tab has no articles */}
              {activeTab !== 'all' && clusterData[activeTab]?.length === 0 && (
                 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    <p>No articles found for the '{activeTab}' perspective in this cluster.</p>
                 </div>
              )}
            </>
          )}
        </div>
         {/* Optional Footer */}
         {/* <div className="modal-footer">
             <button onClick={onClose}>Close</button>
         </div> */}
      </div>
    </div>
  );
}

// Helper function to render article groups in Compare Modal
function renderArticleGroup(articleList, perspective, onAnalyze) {
  if (!articleList || articleList.length === 0) return null; // Don't render if empty

  return (
    <div className="perspective-section">
      <h3 className={`perspective-title ${perspective.toLowerCase()}`}>{perspective} Perspective</h3>
      {articleList.map(article => (
        <div key={article._id || article.url} className="coverage-article">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
             <h4>{article.headline || 'No Headline'}</h4>
          </a>
           {/* Display a snippet of the summary */}
           <p>
             {(article.summary || '').substring(0, 150)}{article.summary && article.summary.length > 150 ? '...' : ''}
           </p>

           {/* Simplified scores */}
          <div className="article-scores">
            <span>Bias: {article.biasScore ?? 'N/A'}</span>
            <span>Trust: {article.trustScore ?? 'N/A'}</span>
            <span>Grade: {article.credibilityGrade || 'N/A'}</span>
          </div>
          <div className="coverage-actions">
            {/* Direct link to read article */}
            <a href={article.url} target="_blank" rel="noopener noreferrer" style={{flex: 1}}>
                 <button style={{width: '100%'}}>Read Article</button>
            </a>
            {/* Button to view analysis within the app */}
            <button onClick={() => onAnalyze(article)}>View Analysis</button>
          </div>
        </div>
      ))}
    </div>
  );
}


// Detailed Analysis Modal
function DetailedAnalysisModal({ article, onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // Default tab

   // Handle click outside modal to close
   const handleOverlayClick = (e) => {
       if (e.target === e.currentTarget) {
           onClose();
       }
   };

  // Basic check if article data is missing
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
          {/* Use the article headline in the title */}
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
          {/* Conditionally render tab content */}
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
      {/* Grid for main scores */}
      <div className="overview-grid">
        <ScoreBox label="Trust Score" value={article.trustScore} />
        <ScoreBox label="Bias Score" value={article.biasScore} />
        <ScoreBox label="Credibility" value={article.credibilityScore} />
        <ScoreBox label="Reliability" value={article.reliabilityScore} />
      </div>

       {/* Key Findings Section */}
       {article.keyFindings && article.keyFindings.length > 0 && (
         <div className="recommendations"> {/* Reusing style */}
            <h4>Key Findings</h4>
            <ul>
                {article.keyFindings.map((finding, i) => <li key={`kf-${i}`}>{finding}</li>)}
            </ul>
         </div>
       )}

       {/* Recommendations Section */}
       {article.recommendations && article.recommendations.length > 0 && (
         <div className="recommendations" style={{ marginTop: '20px' }}> {/* Add margin if both sections show */}
            <h4>Recommendations</h4>
            <ul>
                {article.recommendations.map((rec, i) => <li key={`rec-${i}`}>{rec}</li>)}
            </ul>
         </div>
       )}

        {/* Message if no findings/recommendations */}
        {(!article.keyFindings || article.keyFindings.length === 0) &&
         (!article.recommendations || article.recommendations.length === 0) && (
            <p style={{color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '30px'}}>
                No specific key findings or recommendations were generated for this article.
            </p>
         )}
    </div>
  );
}

// Helper to safely get nested properties
const getNested = (obj, path, defaultValue = 0) => {
    return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : defaultValue, obj);
};


function BiasTab({ article }) {
  // Use helper to safely access potentially missing nested components
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

      <div className="component-section">
        <h4>Linguistic Bias</h4>
        <ProgressBar label="Sentiment Polarity" value={linguistic.sentimentPolarity} />
        <ProgressBar label="Emotional Language" value={linguistic.emotionalLanguage} />
        <ProgressBar label="Loaded Terms" value={linguistic.loadedTerms} />
        <ProgressBar label="Complexity Bias" value={linguistic.complexityBias} />
      </div>

      <div className="component-section">
        <h4>Source Selection</h4>
        <ProgressBar label="Source Diversity" value={sourceSelection.sourceDiversity} />
        <ProgressBar label="Expert Balance" value={sourceSelection.expertBalance} />
        <ProgressBar label="Attribution Transparency" value={sourceSelection.attributionTransparency} />
      </div>

      <div className="component-section">
        <h4>Demographic Representation</h4>
        <ProgressBar label="Gender Balance" value={demographic.genderBalance} />
        <ProgressBar label="Racial Balance" value={demographic.racialBalance} />
        <ProgressBar label="Age Representation" value={demographic.ageRepresentation} />
      </div>

      <div className="component-section">
        <h4>Framing Analysis</h4>
        <ProgressBar label="Headline Framing" value={framing.headlineFraming} />
        <ProgressBar label="Story Selection" value={framing.storySelection} />
        <ProgressBar label="Omission Bias" value={framing.omissionBias} />
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

      <div className="component-section">
        <h4>Credibility Components</h4>
        <ProgressBar label="Source Credibility" value={components.sourceCredibility} />
        <ProgressBar label="Fact Verification" value={components.factVerification} />
        <ProgressBar label="Professionalism" value={components.professionalism} />
        <ProgressBar label="Evidence Quality" value={components.evidenceQuality} />
        <ProgressBar label="Transparency" value={components.transparency} />
        <ProgressBar label="Audience Trust" value={components.audienceTrust} />
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

      <div className="component-section">
        <h4>Reliability Components</h4>
        <ProgressBar label="Consistency" value={components.consistency} />
        <ProgressBar label="Temporal Stability" value={components.temporalStability} />
        <ProgressBar label="Quality Control" value={components.qualityControl} />
        <ProgressBar label="Publication Standards" value={components.publicationStandards} />
        <ProgressBar label="Corrections Policy" value={components.correctionsPolicy} />
        <ProgressBar label="Update Maintenance" value={components.updateMaintenance} />
      </div>
    </div>
  );
}

// --- Reusable UI Components ---

// Score Box for Overview Tab
function ScoreBox({ label, value }) {
  return (
    <div className="score-circle"> {/* Keep class name for now, but it's a box */}
      <div className="score-value">{value ?? 'N/A'}</div> {/* Handle null/undefined */}
      <div className="score-label">{label}</div>
    </div>
  );
}

// Progress Bar for Analysis Tabs
function ProgressBar({ label, value }) {
   // Ensure value is a number between 0 and 100
   const numericValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-bar-container">
      <span className="progress-label">{label}</span>
      <div className="progress-bar">
        {/* Animate width change */}
        <div className="progress-fill" style={{ width: `${numericValue}%` }}></div>
      </div>
      <span className="progress-value">{numericValue}</span>
    </div>
  );
}

export default App;
