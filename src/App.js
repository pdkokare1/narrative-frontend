import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './App.css'; // Ensure App.css is imported

// Use environment variable for API URL, fallback to localhost for local dev
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// --- Tooltip Helper ---
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
  
  // --- (FIX) Sidebar State ---
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarHidden, setIsDesktopSidebarHidden] = useState(false);
  
  // --- (FIX) Pull-to-Refresh State ---
  const [pullToRefreshState, setPullToRefreshState] = useState('idle'); // idle, pulling, ready, refreshing
  const [pullStartY, setPullStartY] = useState(null);
  const [pullDistance, setPullDistance] = useState(0);
  const pullThreshold = 120; // (FIX) Increased threshold
  
  // --- (FIX) Infinite Scroll Refs ---
  const contentRef = useRef(null);
  const articleGridRef = useRef(null);
  const loadMoreRef = useRef(null);
  const observer = useRef(null); // For IntersectionObserver

  // --- NEW: Custom Tooltip State ---
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });
  
  // (FIX) Combined mobile/desktop check
  const isMobile = () => window.innerWidth <= 768;

  // --- NEW: Custom Tooltip Handlers (Simplified) ---
  const showTooltip = (text, e) => {
    if (isMobile() || !text) return; // (FIX) Only run on DESKTOP
    e.stopPropagation();

    // Get element's position
    const rect = e.currentTarget.getBoundingClientRect();
    // Position tooltip above the element
    const x = rect.left + rect.width / 2;
    const y = rect.top; // Position at the top

    setTooltip({ 
      visible: true, 
      text, 
      x, 
      y,
      // (FIX) Add style for desktop positioning
      style: { 
        transform: 'translate(-50%, -110%)', // Centered, 10% above element
        pointerEvents: 'none' // Prevent flicker
      }
    });
  };

  const hideTooltip = (e) => {
    if (isMobile()) return;
    if (tooltip.visible) {
      setTooltip({ ...tooltip, visible: false });
    }
  };
  // --- End Tooltip Handlers ---


  // Effect to set initial theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme + '-mode';
  }, []);

  // Effect to fetch articles when filters change or on initial load
  useEffect(() => {
    // (FIX) Reset scroll on filter change
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    fetchArticles(false); // 'false' means it's a new fetch, not loadMore
  }, [filters]); // Re-fetch when filters change

  // (FIX) Close mobile sidebar on filter change
  useEffect(() => {
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [filters]); // (FIX) Only depends on filters

  // (FIX) Effect to add class for desktop sidebar
  useEffect(() => {
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      if (isDesktopSidebarHidden) {
        mainContainer.classList.add('desktop-sidebar-hidden');
      } else {
        mainContainer.classList.remove('desktop-sidebar-hidden');
      }
    }
  }, [isDesktopSidebarHidden]);
  
  
  // --- (FIX) Infinite Scroll Logic ---
  const loadMoreArticles = useCallback(() => {
    // Prevent loading more if already loading or no more articles
    if (loading || displayedArticles.length >= totalArticlesCount) return;
    fetchArticles(true); // Pass flag indicating this is a "load more" action
  }, [loading, displayedArticles, totalArticlesCount]); // Dependencies

  useEffect(() => {
    // Disconnect previous observer
    if (observer.current) {
      observer.current.disconnect();
    }
  
    // Create new observer
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          // (FIX) Use the stable callback
          loadMoreArticles();
        }
      },
      {
        root: contentRef.current, // Use content area as scroll root on mobile
        rootMargin: isMobile() ? '0px' : '800px', // (FIX) Load earlier on desktop
        threshold: 0.1,
      }
    );
  
    // Observe the loadMoreRef
    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }
  
    // Cleanup
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadMoreArticles, loading]); // (FIX) Re-run when loadMoreArticles callback changes


  const fetchArticles = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true); // Show loading spinner only on filter change/initial load
        setInitialLoad(true);
      } else {
        // (FIX) Set loading to true for loadMore to prevent multiple triggers
        setLoading(true); 
      }
      
      const limit = 12; // Articles per page/load
      const offset = loadMore ? displayedArticles.length : 0;

      // --- Prepare params, handle special 'Review / Opinion' quality filter ---
      const queryParams = { ...filters, limit, offset };
      if (filters.quality === 'Review / Opinion') {
        queryParams.quality = null; // Don't send score range
        queryParams.analysisType = 'SentimentOnly'; // Send this instead
      } else {
        queryParams.analysisType = null; // Ensure this isn't sent for score-based filters
      }

      const response = await axios.get(`${API_URL}/articles`, {
        params: queryParams // Use the modified params
      });

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
      setPullToRefreshState('idle'); // (FIX) Reset pull-to-refresh state

    } catch (error) {
      console.error('❌ Error fetching articles:', error.response ? error.response.data : error.message);
      setLoading(false); // Ensure loading stops on error
      setInitialLoad(false);
      setPullToRefreshState('idle'); // (FIX) Reset pull-to-refresh state
    }
  };


  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };
  
  // (FIX) Sidebar Toggle Logic
  const handleToggleSidebar = () => {
    if (isMobile()) {
      setIsMobileSidebarOpen(true);
    } else {
      setIsDesktopSidebarHidden(prev => !prev);
    }
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
      // Fetching is handled by the useEffect watching filters
  };

  // (FIX) Share Article Logic
  const shareArticle = (article) => {
    // Create the link to our site with the article hash
    const shareUrl = `${window.location.origin}${window.location.pathname}#article-${article._id}`;

    if (navigator.share) {
      navigator.share({
        title: article.headline,
        text: `Check out this analysis on The Gamut: ${article.headline}`,
        url: shareUrl
      }).then(() => {
        console.log('Article shared successfully');
      }).catch((error) => {
        console.error('Share failed:', error);
        // Fallback to copy link
        navigator.clipboard.writeText(shareUrl).then(() => alert('Link to this analysis copied to clipboard!'));
      });
    } else {
      // Fallback for browsers without navigator.share
      navigator.clipboard.writeText(shareUrl).then(() => alert('Link to this analysis copied to clipboard!'));
    }
  };
  
  // --- (FIX) Pull-to-Refresh Handlers ---
  const handleTouchStart = (e) => {
    if (!isMobile() || contentRef.current?.scrollTop !== 0 || loading) {
      setPullStartY(null);
      return;
    }
    setPullStartY(e.touches[0].clientY);
    setPullDistance(0);
  };

  const handleTouchMove = (e) => {
    if (pullStartY === null || !isMobile() || loading) return;

    const currentY = e.touches[0].clientY;
    let dist = currentY - pullStartY;

    if (dist > 0) {
      // (FIX) Apply resistance
      dist = Math.pow(dist, 0.85); 
      
      setPullDistance(dist);

      if (dist > pullThreshold && pullToRefreshState !== 'ready') {
        setPullToRefreshState('ready');
      } else if (dist <= pullThreshold && pullToRefreshState !== 'pulling') {
        setPullToRefreshState('pulling');
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (pullStartY === null || !isMobile() || loading) return;

    if (pullDistance > pullThreshold) {
      setPullToRefreshState('refreshing');
      // Reset filters to trigger a refresh
      setFilters(prev => ({ ...prev })); 
    } else {
      setPullToRefreshState('idle');
    }
    setPullStartY(null);
    setPullDistance(0);
  };
  // --- End Pull-to-Refresh ---


  // (FIX) Scroll to hash element on load
  useEffect(() => {
    if (initialLoad || loading) return; // Wait for articles to be ready

    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [initialLoad, loading]); // Run when loading completes


  // (FIX) Determine pull indicator text/icon
  const getPullIndicator = () => {
    const style = { 
      transform: `translateY(${Math.min(pullDistance, pullThreshold)}px)`,
      opacity: Math.min(pullDistance / pullThreshold, 1)
    };
    
    let content = 'Pull to refresh';
    let arrowClass = 'pull-indicator-arrow';

    if (pullToRefreshState === 'ready') {
      content = 'Release to refresh';
      arrowClass += ' rotated'; // (Need to add CSS for .rotated)
    }
    
    if (pullToRefreshState === 'refreshing') {
      return (
        <div className="pull-to-refresh-container" style={{ opacity: 1 }}>
          <div className="spinner-small"></div>
          <span>Refreshing...</span>
        </div>
      );
    }
    
    if (pullToRefreshState === 'pulling' || pullToRefreshState === 'ready') {
      return (
        <div className="pull-indicator" style={style}>
          <span className={arrowClass}>↓</span> {content}
        </div>
      );
    }
    
    return null;
  };


  return (
    <div className="app">
      {/* --- NEW: Custom Tooltip Render --- */}
      <CustomTooltip
        visible={tooltip.visible}
        text={tooltip.text}
        x={tooltip.x}
        y={tooltip.y}
        style={tooltip.style}
      />

      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onToggleSidebar={handleToggleSidebar} // (FIX) Use new handler
      />

      {/* (FIX) main-container class is now set by useEffect */}
      <div className="main-container">
        {/* --- NEW: Mobile Sidebar Overlay --- */}
        <div
          className={`sidebar-mobile-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>

        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          articleCount={totalArticlesCount}
          isOpen={isMobileSidebarOpen} // (FIX) Prop for mobile
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        <main 
          className="content" 
          ref={contentRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* (FIX) Pull to refresh indicator */}
          {isMobile() && getPullIndicator()}

          {(loading && initialLoad) ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : (
            <>
              {displayedArticles.length > 0 ? (
                 <div className="articles-grid" ref={articleGridRef}>
                  {displayedArticles.map((article) => (
                    // (FIX) Add wrapper for mobile snapping
                    <ArticleCardWrapper 
                      key={article._id || article.url}
                      id={`article-${article._id}`} // (FIX) Add ID for sharing
                    >
                      <ArticleCard
                        article={article}
                        onCompare={(clusterId, title) => setCompareModal({ open: true, clusterId, articleTitle: title })}
                        onAnalyze={(article) => setAnalysisModal({ open: true, article })}
                        onShare={shareArticle}
                        showTooltip={showTooltip}
                        hideTooltip={hideTooltip}
                      />
                    </ArticleCardWrapper>
                  ))}
                 </div>
              ) : (
                // Show message if no articles match filters (and not loading)
                 <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                    <p>No articles found matching your current filters.</p>
                 </div>
              )}

              {/* (FIX) Load More "Sentinel" Element */}
              <div 
                ref={loadMoreRef} 
                className="load-more" 
                style={{ height: '100px', pointerEvents: 'none' }}
              >
                {/* Show spinner inside sentinel when loading more */}
                {loading && !initialLoad && (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
                    <div className="spinner-small"></div>
                  </div>
                )}
              </div>
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
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
        />
      )}

      {analysisModal.open && (
        <DetailedAnalysisModal
          article={analysisModal.article}
          onClose={() => setAnalysisModal({ open: false, article: null })}
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
        />
      )}
    </div>
  );
}

// === Sub-Components ===

// --- NEW: Custom Tooltip Component ---
function CustomTooltip({ visible, text, x, y, style }) {
  if (!visible) return null;

  // (FIX) Default mobile style
  const defaultStyle = {
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -100%)',
  };

  return (
    <div
      className="tooltip-custom"
      // (FIX) Apply default mobile style or specific desktop style
      style={style || defaultStyle}
    >
      {text}
    </div>
  );
}


// --- Header (Text Logo, Toggle Fix, NEW Hamburger) ---
function Header({ theme, toggleTheme, onToggleSidebar }) {
  return (
    <header className="header">
      <div className="header-left">
         {/* --- (FIX) Hamburger Button (Always visible) --- */}
         <button className="hamburger-btn" onClick={onToggleSidebar} title="Toggle Filters">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
         </button>

        {/* --- Text Logo --- */}
        <div className="logo-container">
          <h1 className="logo-text">The Gamut</h1>
          <p className="tagline">Analyse The Full Spectrum</p>
        </div>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} title={`Current mode: ${theme}`}>
          {/* (FIX) Show icon for CURRENT mode */}
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

// --- (FIX) Custom Select Component ---
function CustomSelect({ name, value, options, onChange, labelKey = 'label', valueKey = 'value' }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find(opt => opt[valueKey] === value) || options[0];

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } }); // Mimic event object
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="custom-select-container" ref={wrapperRef}>
      <button 
        type="button" 
        className={`custom-select-value ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption[labelKey]}</span>
        <svg className="custom-select-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <ul className="custom-select-options" role="listbox">
          {options.map(option => (
            <li
              key={option[valueKey]}
              className={`custom-select-option ${value === option[valueKey] ? 'selected' : ''}`}
              onClick={() => handleSelect(option[valueKey])}
              onKeyPress={(e) => e.key === 'Enter' && handleSelect(option[valueKey])}
              role="option"
              aria-selected={value === option[valueKey]}
              tabIndex={0}
            >
              {option[labelKey]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


// --- Sidebar (Updated Quality Options, NEW mobile props) ---
function Sidebar({ filters, onFilterChange, articleCount, isOpen, onClose }) {
  const categories = ['All Categories', 'Politics', 'Economy', 'Technology', 'Health', 'Environment', 'Justice', 'Education', 'Entertainment', 'Sports', 'Other'];
  const leans = ['All Leans', 'Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];

  // --- (FIX) UPDATED Quality Level Options (v2.11) ---
  const qualityLevels = [
    { value: 'All Quality Levels', label: 'All Quality Levels' },
    { value: 'A+ Excellent (90-100)', label: 'A+ : Excellent' },
    { value: 'A High (80-89)', label: 'A : High' },
    { value: 'B Professional (70-79)', label: 'B : Professional' },
    { value: 'C Acceptable (60-69)', label: 'C : Acceptable' },
    { value: 'D-F Poor (0-59)', label: 'D-F : Poor' },
    { value: 'Review / Opinion', label: 'Review / Opinion' },
  ];
  // Map to options for CustomSelect
  const qualityOptions = qualityLevels.map(q => ({ value: q.value, label: q.label }));

  const sortOptions = [
    { value: 'Latest First', label: 'Latest First' },
    { value: 'Highest Quality', label: 'Highest Quality' },
    { value: 'Most Covered', label: 'Most Covered' },
    { value: 'Lowest Bias', label: 'Lowest Bias' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div> {/* Filters Wrapper */}
        <div className="sidebar-header-mobile">
          <h3>Filters</h3>
          <button className="sidebar-close-btn" onClick={onClose} title="Close Filters">×</button>
        </div>

        <div className="filter-section">
          <h3>Category</h3>
          <CustomSelect
            name="category"
            value={filters.category}
            onChange={handleChange}
            options={categories.map(c => ({ value: c, label: c }))}
          />
        </div>

        <div className="filter-section">
          <h3>Political Leaning</h3>
          <CustomSelect
            name="lean"
            value={filters.lean}
            onChange={handleChange}
            options={leans.map(l => ({ value: l, label: l }))}
          />
        </div>

        <div className="filter-section">
          <h3>Quality Level</h3>
           <CustomSelect
            name="quality"
            value={filters.quality}
            onChange={handleChange}
            options={qualityOptions}
          />
        </div>

        <div className="filter-section">
          <h3>Sort By</h3>
          <CustomSelect
            name="sort"
            value={filters.sort}
            onChange={handleChange}
            options={sortOptions}
          />
        </div>
      </div>

      {/* Article Count */}
      {articleCount > 0 && (
        <div className="filter-results">
          <p>{articleCount} articles analyzed</p>
        </div>
      )}
    </aside>
  );
}


// (FIX) NEW: Wrapper component for mobile snap
function ArticleCardWrapper({ id, children }) {
  if (isMobile()) {
    return (
      <div id={id} className="article-card-wrapper">
        {children}
      </div>
    );
  }
  // On desktop, just render the card directly
  return (
    <div id={id} style={{height: '100%'}}> {/* (FIX) Ensure wrapper has height for grid stretch */}
      {children}
    </div>
  );
}


// --- UPDATED ArticleCard Component (v2.11) ---
function ArticleCard({ article, onCompare, onAnalyze, onShare, showTooltip, hideTooltip }) {

  const isReview = article.analysisType === 'SentimentOnly';
  // --- (FIX) Check for non-political leaning ---
  const isNonPolitical = article.politicalLean === 'Not Applicable';
  // --- (FIX) Show stacked buttons if review OR non-political ---
  const showReadArticleStack = isReview || isNonPolitical;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'flex';
    }
  };

  const stopTouch = (e) => e.stopPropagation();

  // --- (FIX) Helper function for lean color class ---
  const getLeanClass = (lean) => {
    if (['Left', 'Left-Leaning'].includes(lean)) return 'text-accent-lean-left';
    if (['Right', 'Right-Leaning'].includes(lean)) return 'text-accent-lean-right';
    if (lean === 'Center') return 'text-accent-lean-center';
    return '';
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
           <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="article-headline-link"
              onTouchStart={stopTouch} // NEW: Prevent scroll on tap
           >
               <h3 className="article-headline">{article.headline}</h3>
           </a>

          <p className="article-summary">{article.summary}</p>

          {/* --- UPDATED Meta Section --- */}
          <div className="article-meta-v2">
            <span className="source">{article.source}</span>
            {/* Show Bias/Lean only if it's a 'Full' analysis article */}
            {!isReview && (
              <>
                <span className="meta-divider">|</span>
                <span
                  // (FIX) Add accent class
                  className={`bias-score-card ${article.biasScore > 0 ? 'text-accent' : ''}`}
                  title="Bias Score (0-100). Less is better."
                  onMouseEnter={(e) => showTooltip("Bias Score (0-100). Less is better.", e)}
                  onMouseLeave={hideTooltip}
                >
                  Bias: {article.biasScore}
                </span>
                 <span className="meta-divider">|</span>
                 <span
                  // (FIX) Add conditional lean class
                  className={`political-lean-card ${getLeanClass(article.politicalLean)}`}
                  title="Detected political leaning."
                  onMouseEnter={(e) => showTooltip("Detected political leaning.", e)}
                  onMouseLeave={hideTooltip}
                 >
                   {article.politicalLean}
                 </span>
              </>
             )}
          </div>


          {/* --- Quality Display (v2.8) --- */}
          <div className="quality-display-v2">
               {isReview ? (
                   <span
                      className="quality-grade-text"
                      title="This article is an opinion, review, or summary."
                      onMouseEnter={(e) => showTooltip("This article is an opinion, review, or summary.", e)}
                      onMouseLeave={hideTooltip}
                   >
                     Review / Opinion
                   </span>
               ) : article.credibilityGrade ? (
                   <span
                      // (FIX) Add accent class
                      className={`quality-grade-text ${article.credibilityGrade ? 'text-accent' : ''}`}
                      title="This grade (A+ to F) is based on the article's Credibility and Reliability."
                      onMouseEnter={(e) => showTooltip("This grade (A+ to F) is based on the article's Credibility and Reliability.", e)}
                      onMouseLeave={hideTooltip}
                   >
                     Grade: {article.credibilityGrade}
                   </span>
               ) : (
                   <span
                      className="quality-grade-text"
                      title="Quality grade not available."
                      onMouseEnter={(e) => showTooltip("Quality grade not available.", e)}
                      onMouseLeave={hideTooltip}
                   >
                     Grade: N/A
                   </span>
               )}

               <span
                  // (FIX) Add accent class
                  className={`sentiment-text ${article.sentiment !== 'Neutral' ? 'text-accent' : ''}`}
                  title="The article's overall sentiment towards its main subject."
                  onMouseEnter={(e) => showTooltip("The article's overall sentiment towards its main subject.", e)}
                  onMouseLeave={hideTooltip}
               >
                  Sentiment: {article.sentiment}
               </span>
           </div>
           {/* --- End Simplified Display --- */}


          {/* --- Actions (v2.10 Stacked Buttons) --- */}
          <div className="article-actions">
            {/* --- (FIX) Show stacked buttons if review OR non-political --- */}
            {showReadArticleStack ? (
              // --- UI for SentimentOnly OR NonPolitical (STACKED BUTTONS) ---
              <>
                <button
                  onClick={() => onShare(article)}
                  onTouchStart={stopTouch}
                  className="btn-secondary btn-full-width"
                  title="Share this analysis" // (FIX) Updated title
                >
                  Share
                </button>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-full-width"
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                  title="Read the full article on the source's website"
                  onTouchStart={stopTouch}
                >
                  Read Article
                </a>
              </>
            ) : (
              // --- UI for Full Analysis (Standard) ---
              <>
                <div className="article-actions-top">
                  <button
                    onClick={() => onAnalyze(article)}
                    onTouchStart={stopTouch}
                    className="btn-secondary"
                    title="View Detailed Analysis"
                  >
                    Analysis
                  </button>
                  <button
                    onClick={() => onShare(article)}
                    onTouchStart={stopTouch}
                    className="btn-secondary"
                    title="Share this analysis" // (FIX) Updated title
                  >
                    Share
                  </button>
                </div>
                <button
                  onClick={() => onCompare(article.clusterId, article.headline)}
                  onTouchStart={stopTouch}
                  className="btn-primary btn-full-width"
                  title="Compare Coverage Across Perspectives"
                  disabled={!article.clusterId} // (FIX) Disabled if no clusterId
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
function CompareCoverageModal({ clusterId, articleTitle, onClose, onAnalyze, showTooltip, hideTooltip }) {
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
        const response = await axios.get(`${API_URL}/cluster/${clusterId}`);

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
              {activeTab === 'left' && renderArticleGroup(clusterData.left, 'Left', onAnalyze, showTooltip, hideTooltip)}
              {activeTab === 'center' && renderArticleGroup(clusterData.center, 'Center', onAnalyze, showTooltip, hideTooltip)}
              {activeTab === 'right' && renderArticleGroup(clusterData.right, 'Right', onAnalyze, showTooltip, hideTooltip)}

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

// --- Helper function to render article groups ---
function renderArticleGroup(articleList, perspective, onAnalyze, showTooltip, hideTooltip) {
  if (!articleList || articleList.length === 0) return null;
  const stopTouch = (e) => e.stopPropagation();

  return (
    <div className="perspective-section">
      <h3 className={`perspective-title ${perspective.toLowerCase()}`}>{perspective} Perspective</h3>
      {articleList.map(article => (
        <div key={article._id || article.url} className="coverage-article">
          {/* --- Content Wrapper --- */}
          <div className="coverage-content">
            <a href={article.url} target="_blank" rel="noopener noreferrer" onTouchStart={stopTouch}>
              <h4>{article.headline || 'No Headline'}</h4>
            </a>
            <p>
              {(article.summary || '').substring(0, 150)}{article.summary && article.summary.length > 150 ? '...' : ''}
            </p>

            <div className="article-scores">
              <span
                title="Bias Score (0-100, lower is less biased)"
                // (FIX) Add accent class
                className={article.biasScore > 0 ? 'text-accent' : ''}
                onMouseEnter={(e) => showTooltip("Bias Score (0-100, lower is less biased)", e)}
                onMouseLeave={hideTooltip}
              >Bias: {article.biasScore ?? 'N/A'}</span>
              <span
                title="Overall Trust Score (0-100, higher is more trustworthy)"
                // (FIX) Add accent class
                className={article.trustScore > 0 ? 'text-accent' : ''}
                onMouseEnter={(e) => showTooltip("Overall Trust Score (0-100, higher is more trustworthy)", e)}
                onMouseLeave={hideTooltip}
              >Trust: {article.trustScore ?? 'N/A'}</span>
              <span
                title="Credibility Grade (A+ to F)"
                // (FIX) Add accent class
                className={article.credibilityGrade ? 'text-accent' : ''}
                onMouseEnter={(e) => showTooltip("Credibility Grade (A+ to F)", e)}
                onMouseLeave={hideTooltip}
              >Grade: {article.credibilityGrade || 'N/A'}</span>
            </div>
            <div className="coverage-actions">
              <a href={article.url} target="_blank" rel="noopener noreferrer" style={{flex: 1}} onTouchStart={stopTouch}>
                  <button style={{width: '100%'}} onTouchStart={stopTouch}>Read Article</button>
              </a>
              <button onClick={() => onAnalyze(article)} onTouchStart={stopTouch}>View Analysis</button>
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


// --- Detailed Analysis Modal ---
function DetailedAnalysisModal({ article, onClose, showTooltip, hideTooltip }) {
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
          {activeTab === 'overview' && <OverviewTab article={article} showTooltip={showTooltip} hideTooltip={hideTooltip} />}
          {activeTab === 'breakdown' && <OverviewBreakdownTab article={article} showTooltip={showTooltip} hideTooltip={hideTooltip} />}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close Analysis</button>
        </div>
      </div>
    </div>
  );
}

// --- Analysis Tab Components ---

function OverviewTab({ article, showTooltip, hideTooltip }) {
  return (
    <div className="tab-content">
      <div className="overview-grid">
        <ScoreBox label="Trust Score" value={article.trustScore} showTooltip={showTooltip} hideTooltip={hideTooltip} />
        <ScoreBox label="Bias Score" value={article.biasScore} showTooltip={showTooltip} hideTooltip={hideTooltip} />
        <ScoreBox label="Credibility" value={article.credibilityScore} showTooltip={showTooltip} hideTooltip={hideTooltip} />
        <ScoreBox label="Reliability" value={article.reliabilityScore} showTooltip={showTooltip} hideTooltip={hideTooltip} />
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

// --- UPDATED Consolidated Breakdown Tab (v2.11 Spacing) ---
function OverviewBreakdownTab({ article, showTooltip, hideTooltip }) {
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
        <div className="divider" /> {/* Added Divider */}
        <div className="component-grid-v2 section-spacing"> {/* Added Spacing */}
            {visibleBias.length > 0 ? (
                visibleBias.map(comp => (
                  <CircularProgressBar
                    key={comp.label}
                    label={comp.label}
                    value={comp.value}
                    tooltip={getBreakdownTooltip(comp.label)}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                  />
                ))
            ) : (
              <p className="zero-score-note">All bias components scored 0. Enable the toggle above to see them.</p>
            )}
        </div>
      </div>

      {/* --- Credibility Section --- */}
      <div className="component-section">
        <div className="component-section-header"> {/* Re-added header for spacing consistency */}
            <h4>Credibility Details ({article.credibilityScore ?? 'N/A'}/100)</h4>
        </div>
         <div className="divider" /> {/* Added Divider */}
        <div className="component-grid-v2 section-spacing"> {/* Added Spacing */}
            {visibleCredibility.length > 0 ? (
                visibleCredibility.map(comp => (
                  <CircularProgressBar
                    key={comp.label}
                    label={comp.label}
                    value={comp.value}
                    tooltip={getBreakdownTooltip(comp.label)}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                   />
                ))
            ) : (
              <p className="zero-score-note">All credibility components scored 0. Enable the toggle above to see them.</p>
            )}
        </div>
      </div>

      {/* --- Reliability Section --- */}
      <div className="component-section">
         <div className="component-section-header"> {/* Re-added header for spacing consistency */}
            <h4>Reliability Details ({article.reliabilityScore ?? 'N/A'}/100)</h4>
         </div>
         <div className="divider" /> {/* Added Divider */}
        <div className="component-grid-v2 section-spacing"> {/* Added Spacing */}
            {visibleReliability.length > 0 ? (
                visibleReliability.map(comp => (
                  <CircularProgressBar
                    key={comp.label}
                    label={comp.label}
                    value={comp.value}
                    tooltip={getBreakdownTooltip(comp.label)}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                   />
                ))
            ) : (
              <p className="zero-score-note">All reliability components scored 0. Enable the toggle above to see them.</p>
            )}
        </div>
      </div>

    </div>
  );
}


// --- Reusable UI Components ---

// Score Box for Overview Tab
function ScoreBox({ label, value, showTooltip, hideTooltip }) {
  let tooltip = '';
  switch(label) {
    case 'Trust Score':
      tooltip = 'Overall Trust Score (0-100). A combined measure of Credibility and Reliability. Higher is better.';
      break;
    case 'Bias Score':
      tooltip = 'Overall Bias Score (0-100). Less is better. 0 indicates minimal bias, 100 indicates significant bias.'; // UPDATED
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
    <div
      className="score-circle"
      title={tooltip}
      onMouseEnter={(e) => showTooltip(tooltip, e)}
      onMouseLeave={hideTooltip}
    >
      <div className="score-value">{value ?? 'N/A'}</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

// --- Circular Progress Bar Component (Donut) ---
function CircularProgressBar({ label, value, tooltip, showTooltip, hideTooltip }) { // Added tooltip prop
  const numericValue = Math.max(0, Math.min(100, Number(value) || 0));
  const strokeWidth = 8;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (numericValue / 100) * circumference;

  const strokeColor = 'var(--accent-primary)'; // Consistent accent color
  const finalTooltip = tooltip || `${label}: ${numericValue}/100`;

  return (
    <div
      className="circle-progress-container"
      title={finalTooltip}
      onMouseEnter={(e) => showTooltip(finalTooltip, e)}
      onMouseLeave={hideTooltip}
    > {/* Use provided tooltip */}
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

