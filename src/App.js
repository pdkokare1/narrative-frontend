import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Ensure App.css is imported

// Use environment variable for API URL, fallback to localhost for local dev
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// --- NEW Tooltip Helper ---
const getBreakdownTooltip = (label) => {
  const tooltips = {
    // Bias Linguistic
    "Sentiment Polarity": "Measures the overall positive, negative, or neutral leaning of the language used.",
    "Emotional Language": "Detects the prevalence of words intended to evoke strong emotional responses.",
    "Loaded Terms": "Identifies words or phrases with strong connotations beyond their literal meaning.",
    "Complexity Bias": "Assesses if overly complex or simplistic language is used to obscure or mislead.",
    // Bias Source Selection
    "Source Diversity": "Evaluates the variety of sources cited (e.g., political, expert, eyewitness).",
    "Expert Balance": "Checks if experts from different perspectives are represented fairly.",
    "Attribution Transparency": "Assesses how clearly sources are identified and attributed.",
    // Bias Demographic
    "Gender Balance": "Measures the representation of different genders in sources and examples.",
    "Racial Balance": "Measures the representation of different racial or ethnic groups.",
    "Age Representation": "Checks for biases related to age groups in reporting.",
    // Bias Framing
    "Headline Framing": "Analyzes if the headline presents a neutral or skewed perspective of the story.",
    "Story Selection": "Considers if the choice of this story over others indicates a potential bias.",
    "Omission Bias": "Evaluates if significant facts or contexts are left out, creating a misleading picture.",
    // Credibility
    "Source Credibility": "Assesses the reputation and track record of the news source itself.",
    "Fact Verification": "Evaluates the rigor of the fact-checking processes evident in the article.",
    "Professionalism": "Measures adherence to journalistic standards like objectivity and transparency.",
    "Evidence Quality": "Assesses the strength and reliability of the data and evidence presented.",
    "Transparency": "Evaluates openness about sources, funding, and potential conflicts of interest.",
    "Audience Trust": "Considers public perception and trust metrics associated with the source (if available).",
    // Reliability
    "Consistency": "Measures the source's consistency in accuracy and quality over time.",
    "Temporal Stability": "Evaluates the source's track record and how long it has been operating reliably.",
    "Quality Control": "Assesses the internal editorial review and error correction processes.",
    "Publication Standards": "Evaluates adherence to established journalistic codes and ethics.",
    "Corrections Policy": "Assesses the clarity, visibility, and timeliness of corrections for errors.",
    "Update Maintenance": "Measures how well the source updates developing stories with new information.",
  };
  return tooltips[label] || label; // Return explanation or the label itself as fallback
};


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

// --- Header (UPDATED with SVG Logo) ---
function Header({ theme, toggleTheme }) {
  return (
    <header className="header">
      <div className="header-left">
        {/* --- SVG Logo --- */}
        <div className="logo-container">
          <svg className="logo-svg" width="160" height="40" viewBox="0 0 160 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.38 29.86H8.76V13.3H12.38V29.86ZM10.57 11.2C9.47 11.2 8.58 10.79 7.9 10.01C7.22 9.22 6.88 8.24 6.88 7.07C6.88 5.9 7.22 4.93 7.9 4.16C8.58 3.38 9.47 3 10.57 3C11.67 3 12.55 3.38 13.23 4.16C13.91 4.93 14.25 5.9 14.25 7.07C14.25 8.24 13.91 9.22 13.23 10.01C12.55 10.79 11.67 11.2 10.57 11.2ZM32.33 29.86H28.71V13.3H32.33V29.86ZM30.52 11.2C29.42 11.2 28.53 10.79 27.85 10.01C27.17 9.22 26.83 8.24 26.83 7.07C26.83 5.9 27.17 4.93 27.85 4.16C28.53 3.38 29.42 3 30.52 3C31.62 3 32.5 3.38 33.18 4.16C33.86 4.93 34.2 5.9 34.2 7.07C34.2 8.24 33.86 9.22 33.18 10.01C32.5 10.79 31.62 11.2 30.52 11.2ZM53.68 21.61C53.68 20.08 53.3 18.82 52.54 17.83C51.8 16.83 50.76 16.14 49.42 15.76L46.99 15.01C46.06 14.74 45.32 14.42 44.77 14.05C44.22 13.68 43.94 13.2 43.94 12.61C43.94 11.89 44.23 11.33 44.81 10.93C45.39 10.52 46.16 10.32 47.12 10.32C48.01 10.32 48.75 10.51 49.34 10.89C49.93 11.27 50.36 11.78 50.64 12.42L53.77 10.9C53.33 9.94 52.61 9.14 51.61 8.5C50.62 7.86 49.4 7.54 47.95 7.54C46.33 7.54 44.97 7.9 43.87 8.62C42.78 9.33 42.02 10.23 41.59 11.32C41.16 12.4 40.94 13.56 40.94 14.8C40.94 16.42 41.31 17.75 42.05 18.79C42.79 19.82 43.81 20.57 45.11 21.04L47.54 21.84C48.56 22.15 49.35 22.48 49.91 22.83C50.47 23.18 50.75 23.67 50.75 24.3C50.75 25.04 50.45 25.62 49.85 26.04C49.25 26.46 48.42 26.67 47.36 26.67C46.19 26.67 45.24 26.42 44.51 25.92C43.79 25.41 43.27 24.7 42.95 23.78L39.73 25.15C40.23 26.54 41.07 27.67 42.25 28.54C43.44 29.4 44.93 29.83 46.72 29.83C48.31 29.83 49.67 29.49 50.8 28.81C51.94 28.12 52.78 27.18 53.32 25.99C53.86 24.79 54.13 23.36 54.13 21.69L53.68 21.61ZM70.47 30.13C68.99 30.13 67.73 29.74 66.69 28.96C65.65 28.17 64.88 27.1 64.38 25.75L67.69 24.46C67.97 25.4 68.46 26.12 69.16 26.62C69.86 27.12 70.68 27.37 71.62 27.37C72.68 27.37 73.49 27.1 74.05 26.56C74.61 26.01 74.89 25.26 74.89 24.31V13.3H78.51V23.95C78.51 25.74 78.02 27.13 77.04 28.12C76.06 29.1 74.7 29.59 72.96 29.59C72.01 29.59 71.17 29.45 70.44 29.17L70.47 30.13ZM89.98 29.86H86.85L81.76 17.59V29.86H78.14V7.84H81.27L86.36 20.11V7.84H89.98V29.86ZM102.77 30.13C101.3 30.13 100.03 29.74 98.96 28.96C97.91 28.17 97.14 27.1 96.65 25.75L99.96 24.46C100.23 25.4 100.72 26.12 101.43 26.62C102.13 27.12 102.95 27.37 103.89 27.37C104.95 27.37 105.75 27.1 106.31 26.56C106.87 26.01 107.15 25.26 107.15 24.31V13.3H110.77V23.95C110.77 25.74 110.28 27.13 109.3 28.12C108.33 29.1 106.97 29.59 105.23 29.59C104.28 29.59 103.44 29.45 102.71 29.17L102.77 30.13ZM128.87 29.86H125.3V19.78C125.3 18.68 125.04 17.82 124.52 17.2C123.99 16.57 123.23 16.25 122.24 16.25C121.32 16.25 120.57 16.54 119.99 17.12C119.41 17.69 119.12 18.49 119.12 19.52V29.86H115.5V7.84H119.12V14.11C119.98 12.98 121.01 12.18 122.21 11.71C123.41 11.23 124.7 11 126.08 11C127.87 11 129.28 11.45 130.31 12.35C131.34 13.25 131.85 14.54 131.85 16.22V29.86H128.87Z" />
              <path d="M149.37 29.86H145.75V13.3H149.37V29.86ZM147.56 11.2C146.46 11.2 145.57 10.79 144.89 10.01C144.21 9.22 143.87 8.24 143.87 7.07C143.87 5.9 144.21 4.93 144.89 4.16C145.57 3.38 146.46 3 147.56 3C148.66 3 149.54 3.38 150.22 4.16C150.9 4.93 151.24 5.9 151.24 7.07C151.24 8.24 150.9 9.22 150.22 10.01C149.54 10.79 148.66 11.2 147.56 11.2Z" />
          </svg>
          <p className="tagline">Analyse The Full Spectrum</p>
        </div>
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


// --- UPDATED ArticleCard Component (v2.9) ---
// --- Button symmetry for reviews ---
function ArticleCard({ article, onCompare, onAnalyze, onShare }) {

  const isReview = article.analysisType === 'SentimentOnly';

  const handleImageError = (e) => {
    e.target.style.display = 'none';
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

        {/* --- Quality Display (v2.8) --- */}
        <div className="quality-display-v2">
             {isReview ? (
                 <span className="quality-grade-text" title="This article is an opinion, review, or summary.">
                   Review / Opinion
                 </span>
             ) : article.credibilityGrade ? (
                 <span className="quality-grade-text" title={`Overall Trust Score: ${article.trustScore}/100. This grade (A+ to F) is based on the article's combined Credibility and Reliability.`}>
                   Grade: {article.credibilityGrade}
                 </span>
             ) : (
                 <span className="quality-grade-text" title="Quality grade not available.">
                   Grade: N/A
                 </span>
             )}
             
             <span 
                className="sentiment-text" 
                title="The article's overall sentiment towards its main subject."
             >
                Sentiment: {article.sentiment}
             </span>
         </div>
         {/* --- End Simplified Display --- */}


        {/* --- Actions (v2.9 Button Symmetry) --- */}
        <div className="article-actions">
          {isReview ? (
            // --- UI for SentimentOnly (SYMMETRIC BUTTONS) ---
            <>
              <div className="article-actions-top">
                <button
                  onClick={() => onShare(article)}
                  className="btn-secondary" /* Share is secondary style */
                  title="Share article link"
                >
                  Share
                </button>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary" /* Read is primary style */
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                  title="Read the full article on the source's website"
                >
                  Read Article
                </a>
              </div>
              {/* No bottom button needed */}
            </>
          ) : (
            // --- UI for Full Analysis (Standard) ---
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

// --- Compare Coverage Modal ---
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


// --- UPDATED Detailed Analysis Modal (New Tabs) ---
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

        {/* --- UPDATED Tabs --- */}
        <div className="modal-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={activeTab === 'breakdown' ? 'active' : ''} onClick={() => setActiveTab('breakdown')}>
            Overview Breakdown
          </button>
        </div>

        <div className="modal-content">
          {/* Conditionally render tab content */}
          {activeTab === 'overview' && <OverviewTab article={article} />}
          {activeTab === 'breakdown' && <OverviewBreakdownTab article={article} />}
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

// --- NEW Consolidated Breakdown Tab (v2.9) ---
function OverviewBreakdownTab({ article }) {
  const [showZeroScores, setShowZeroScores] = useState(false);

  // --- Bias Components ---
  const biasComps = article.biasComponents || {};
  const allBiasComponents = [
    { label: "Sentiment Polarity", value: biasComps.linguistic?.sentimentPolarity },
    { label: "Emotional Language", value: biasComps.linguistic?.emotionalLanguage },
    { label: "Loaded Terms", value: biasComps.linguistic?.loadedTerms },
    { label: "Complexity Bias", value: biasComps.linguistic?.complexityBias },
    { label: "Source Diversity", value: biasComps.sourceSelection?.sourceDiversity },
    { label: "Expert Balance", value: biasComps.sourceSelection?.expertBalance },
    { label: "Attribution Transparency", value: biasComps.sourceSelection?.attributionTransparency },
    { label: "Gender Balance", value: biasComps.demographic?.genderBalance },
    { label: "Racial Balance", value: biasComps.demographic?.racialBalance },
    { label: "Age Representation", value: biasComps.demographic?.ageRepresentation },
    { label: "Headline Framing", value: biasComps.framing?.headlineFraming },
    { label: "Story Selection", value: biasComps.framing?.storySelection },
    { label: "Omission Bias", value: biasComps.framing?.omissionBias },
  ].map(c => ({ ...c, value: Number(c.value) || 0 })); // Ensure value is a number

  // --- Credibility Components ---
  const credComps = article.credibilityComponents || {};
  const allCredibilityComponents = [
    { label: "Source Credibility", value: credComps.sourceCredibility },
    { label: "Fact Verification", value: credComps.factVerification },
    { label: "Professionalism", value: credComps.professionalism },
    { label: "Evidence Quality", value: credComps.evidenceQuality },
    { label: "Transparency", value: credComps.transparency },
    { label: "Audience Trust", value: credComps.audienceTrust },
  ].map(c => ({ ...c, value: Number(c.value) || 0 }));

  // --- Reliability Components ---
  const relComps = article.reliabilityComponents || {};
  const allReliabilityComponents = [
    { label: "Consistency", value: relComps.consistency },
    { label: "Temporal Stability", value: relComps.temporalStability },
    { label: "Quality Control", value: relComps.qualityControl },
    { label: "Publication Standards", value: relComps.publicationStandards },
    { label: "Corrections Policy", value: relComps.correctionsPolicy },
    { label: "Update Maintenance", value: relComps.updateMaintenance },
  ].map(c => ({ ...c, value: Number(c.value) || 0 }));

  // --- Filtered Lists ---
  const visibleBias = allBiasComponents.filter(c => c.value > 0 || showZeroScores);
  const visibleCredibility = allCredibilityComponents.filter(c => c.value > 0 || showZeroScores);
  const visibleReliability = allReliabilityComponents.filter(c => c.value > 0 || showZeroScores);

  return (
    <div className="tab-content">

      {/* --- Bias Section --- */}
      <div className="component-section">
        {/* --- Heading + Toggle --- */}
        <div className="component-section-header">
            <h4>Bias Details ({article.biasScore ?? 'N/A'}/100)</h4>
            <div className="toggle-zero-scores">
                <label>
                  <input
                    type="checkbox"
                    checked={showZeroScores}
                    onChange={() => setShowZeroScores(!showZeroScores)}
                  />
                  Show Parameters That Have Not Been Scored
                </label>
            </div>
        </div>

        {/* --- Grid --- */}
        {visibleBias.length > 0 ? (
          <div className="component-grid-v2">
            {visibleBias.map(comp => (
              <CircularProgressBar 
                 key={comp.label} 
                 label={comp.label} 
                 value={comp.value} 
                 tooltip={getBreakdownTooltip(comp.label)} 
              />
            ))}
          </div>
        ) : (
          <p className="zero-score-note">All bias components scored 0. Enable the toggle above to see them.</p>
        )}
      </div>

      {/* --- Credibility Section --- */}
      <div className="component-section">
        <h4>Credibility Details ({article.credibilityScore ?? 'N/A'}/100)</h4>
        {visibleCredibility.length > 0 ? (
          <div className="component-grid-v2">
            {visibleCredibility.map(comp => (
              <CircularProgressBar 
                 key={comp.label} 
                 label={comp.label} 
                 value={comp.value} 
                 tooltip={getBreakdownTooltip(comp.label)}
               />
            ))}
          </div>
        ) : (
          <p className="zero-score-note">All credibility components scored 0. Enable the toggle above to see them.</p>
        )}
      </div>

      {/* --- Reliability Section --- */}
      <div className="component-section">
        <h4>Reliability Details ({article.reliabilityScore ?? 'N/A'}/100)</h4>
        {visibleReliability.length > 0 ? (
          <div className="component-grid-v2">
            {visibleReliability.map(comp => (
              <CircularProgressBar 
                 key={comp.label} 
                 label={comp.label} 
                 value={comp.value} 
                 tooltip={getBreakdownTooltip(comp.label)}
               />
            ))}
          </div>
        ) : (
          <p className="zero-score-note">All reliability components scored 0. Enable the toggle above to see them.</p>
        )}
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
      tooltip = 'Overall Trust Score (0-100). A combined measure of Credibility and Reliability. Higher is better.';
      break;
    case 'Bias Score':
      tooltip = 'Overall Bias Score (0-100). 0 indicates minimal bias, 100 indicates significant bias.';
      break;
    case 'Credibility':
      tooltip = 'Credibility Score (0-100). Measures the article\'s trustworthiness based on sources, facts, and professionalism.';
      break;
    case 'Reliability':
      tooltip = 'Reliability Score (0-100). Measures the source\'s consistency, standards, and corrections policy over time.';
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

// --- UPDATED Circular Progress Bar Component (Donut) ---
function CircularProgressBar({ label, value, tooltip }) { // Added tooltip prop
  const numericValue = Math.max(0, Math.min(100, Number(value) || 0));
  const strokeWidth = 8;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (numericValue / 100) * circumference;
  
  // Use accent color consistently
  const strokeColor = 'var(--accent-primary)'; 

  return (
    <div className="circle-progress-container" title={tooltip || `${label}: ${numericValue}/100`}> {/* Use provided tooltip */}
      <svg className="circle-progress-svg" width="100" height="100" viewBox="0 0 100 100">
        <circle
          className="circle-progress-bg"
          stroke="var(--bg-elevated)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        {/* Only render the progress bar if value > 0 */}
        {numericValue > 0 && (
          <circle
            className="circle-progress-bar"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)" // Start from the top
          />
        )}
        <text
          x="50"
          y="50"
          className="circle-progress-text-value"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {numericValue}
        </text>
      </svg>
      <div className="circle-progress-label">{label}</div>
    </div>
  );
}

export default App;
