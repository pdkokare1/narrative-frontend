import React, { useState, useEffect, useRef } from 'react';
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
  const [isRefreshing, setIsRefreshing] = useState(false); // NEW: For pull-to-refresh
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // NEW: State for mobile sidebar
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(true); // NEW: State for desktop sidebar

  // --- NEW: Custom Tooltip State ---
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });
  const isMobile = () => window.innerWidth <= 768;

  // --- (FIX) Refs for Pull-to-Refresh ---
  const contentRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0); // NEW: State for visual pull

  // --- NEW: Custom Tooltip Handlers (Simplified) ---
  const showTooltip = (text, e) => {
    if (!isMobile() || !text) return; // Only run on mobile
    e.stopPropagation(); // Stop tap from triggering scroll

    // Get touch position
    const touch = e.touches[0];
    // Position tooltip above the finger
    const x = touch.clientX;
    const y = touch.clientY - 40; // 40px above finger

    // Show tooltip immediately
    setTooltip({ visible: true, text, x, y });
  };

  const hideTooltip = (e) => {
    if (!isMobile()) return;
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

  // --- (FIX) NEW: Effect to check for shared article on load ---
  useEffect(() => {
    const fetchAndShowArticle = async (id) => {
      // Basic sanitization
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
         console.error('Invalid article ID format from URL');
         return;
      }
      try {
        console.log(`Fetching shared article: ${id}`);
        // We need to fetch the full article object, not just get from displayed ones
        const response = await axios.get(`${API_URL}/articles/${id}`);
        if (response.data) {
          // Manually clean/default this single article just in case
           const article = response.data;
           const cleanedArticle = {
              _id: article._id || article.url,
              headline: article.headline || article.title || 'No Headline Available',
              summary: article.summary || article.description || 'No summary available.',
              source: article.source || 'Unknown Source',
              category: article.category || 'General',
              politicalLean: article.politicalLean || 'Center',
              url: article.url,
              imageUrl: article.imageUrl || null,
              publishedAt: article.publishedAt || new Date().toISOString(),
              analysisType: ['Full', 'SentimentOnly'].includes(article.analysisType) ? article.analysisType : 'Full',
              sentiment: ['Positive', 'Negative', 'Neutral'].includes(article.sentiment) ? article.sentiment : 'Neutral',
              biasScore: Number(article.biasScore) || 0,
              trustScore: Number(article.trustScore) || 0,
              credibilityScore: Number(article.credibilityScore) || 0,
              reliabilityScore: Number(article.reliabilityScore) || 0,
              credibilityGrade: article.credibilityGrade || null,
              biasComponents: article.biasComponents && typeof article.biasComponents === 'object' ? article.biasComponents : {},
              credibilityComponents: article.credibilityComponents && typeof article.credibilityComponents === 'object' ? article.credibilityComponents : {},
              reliabilityComponents: article.reliabilityComponents && typeof article.reliabilityComponents === 'object' ? article.reliabilityComponents : {},
              keyFindings: Array.isArray(article.keyFindings) ? article.keyFindings : [],
              recommendations: Array.isArray(article.recommendations) ? article.recommendations : [],
              clusterId: article.clusterId || null
           };
           setAnalysisModal({ open: true, article: cleanedArticle });
        }
      } catch (error) {
        console.error('Failed to fetch shared article:', error.response ? error.response.data : error.message);
        // Don't alert user, just fail silently
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    if (articleId) {
       fetchAndShowArticle(articleId);
       // Optional: Clean the URL
       // window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // Runs only once on mount

  // Effect to fetch articles when filters change or on initial load
  useEffect(() => {
    fetchArticles();
  }, [filters]); // Re-fetch when filters change

  // --- (FIXED) ---
  // Close sidebar on filter change (for mobile)
  // Removed `isSidebarOpen` from dependency array to fix instant-close bug
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [filters]); // Note: isSidebarOpen dependency removed

  // --- (FIX) Pull-to-Refresh Effects ---
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || !isMobile()) return;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      touchEndY.current = e.touches[0].clientY;
      // No setPullDistance(0) here, allows move to take over
    };

    const handleTouchMove = (e) => {
      touchEndY.current = e.touches[0].clientY;
      const pullDistance = touchEndY.current - touchStartY.current;
      
      // Only track pull distance if at top and pulling down
      if (contentEl.scrollTop === 0 && pullDistance > 0 && !isRefreshing) {
        setPullDistance(pullDistance);
        // Prevent default scroll behavior only when we are actively pulling down at the top
        e.preventDefault(); 
      } else {
        setPullDistance(0); // Reset if scrolling up or not at top
      }
    };

    const handleTouchEnd = () => {
      const pullThreshold = 120; // (FIX) Increased threshold
      if (contentEl.scrollTop === 0 && pullDistance > pullThreshold && !isRefreshing) {
        setIsRefreshing(true);
        fetchArticles().finally(() => setIsRefreshing(false));
      }
      setPullDistance(0); // Reset visual pull on touch end
    };

    // Use non-passive listeners *only* for move, to allow preventDefault
    contentEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    contentEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    contentEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      contentEl.removeEventListener('touchstart', handleTouchStart);
      contentEl.removeEventListener('touchmove', handleTouchMove);
      contentEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, contentRef]); // Re-attach if refreshing state changes

  const fetchArticles = async (loadMore = false) => {
    try {
      // --- (FIX) Set loading true for ALL fetches to prevent scroll-spam ---
      setLoading(true);
      if (!loadMore) {
        setInitialLoad(true);
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

      // console.log(`Fetching articles with queryParams: ${JSON.stringify(queryParams)}`);

      const response = await axios.get(`${API_URL}/articles`, {
        params: queryParams // Use the modified params
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
      setIsRefreshing(false); // NEW: Ensure refreshing stops

    } catch (error) {
      console.error('❌ Error fetching articles:', error.response ? error.response.data : error.message);
      setLoading(false); // Ensure loading stops on error
      setInitialLoad(false);
      setIsRefreshing(false); // NEW: Ensure refreshing stops on error
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
    // Get the scrollable element (content area on mobile, window on desktop)
    const scrollableElement = window.innerWidth <= 768 ? contentRef.current : window;

    if (!scrollableElement) return; // Exit if element not found yet

    const handleScroll = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const isWindow = scrollableElement === window;
            const scrollHeight = isWindow ? document.body.offsetHeight : scrollableElement.scrollHeight;
            const scrollTop = isWindow ? window.scrollY : scrollableElement.scrollTop;
            const clientHeight = isWindow ? window.innerHeight : scrollableElement.clientHeight;

            // Check if user is near the bottom
            if (clientHeight + scrollTop >= scrollHeight - 800) {
                // Check if not loading, and if there are more articles to load
                // (FIX) The 'loading' state check now correctly prevents spam
                if (!loading && displayedArticles.length < totalArticlesCount) {
                    // console.log("Scroll near bottom detected, loading more...");
                    loadMoreArticles();
                }
            }
        }, 150); // Adjust debounce delay as needed
    };

    scrollableElement.addEventListener('scroll', handleScroll);
    // Cleanup function
    return () => {
        clearTimeout(timeoutId);
        scrollableElement.removeEventListener('scroll', handleScroll);
    };
}, [loading, displayedArticles, totalArticlesCount, contentRef]); // Dependencies for the scroll effect


  const shareArticle = (article) => {
    // --- (FIX) Share link to our app, not the direct URL ---
    const appUrl = window.location.origin;
    const shareUrl = `${appUrl}?article=${article._id}`; // Use internal _id
    const shareTitle = article.headline;
    const shareText = `Check out this analysis on The Gamut: ${article.headline}`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).then(() => {
        console.log('Article shared successfully');
      }).catch((error) => {
        console.error('Share failed:', error);
        // Fallback to copy link if share fails (e.g., user cancels)
        navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!'));
      });
    } else {
      // Fallback for browsers without navigator.share
      navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!'));
    }
  };

  // --- NEW: Combined Sidebar Toggle Logic ---
  const toggleSidebar = () => {
    if (isMobile()) {
      setIsSidebarOpen(!isSidebarOpen); // Toggle mobile overlay
    } else {
      setIsDesktopSidebarVisible(!isDesktopSidebarVisible); // Toggle desktop minimize
    }
  };

  // --- NEW: Combined Sidebar Close Logic ---
  const closeSidebar = () => {
    if (isMobile()) {
      setIsSidebarOpen(false);
    } else {
      // On desktop, "close" just minimizes it
      setIsDesktopSidebarVisible(false);
    }
  };


  return (
    <div className="app">
      {/* --- NEW: Custom Tooltip Render --- */}
      <CustomTooltip
        visible={tooltip.visible}
        text={tooltip.text}
        x={tooltip.x}
        y={tooltip.y}
      />

      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onToggleSidebar={toggleSidebar} // UPDATED: Pass combined toggle function
      />

      <div className={`main-container ${!isDesktopSidebarVisible ? 'desktop-sidebar-hidden' : ''}`}> {/* UPDATED: Add class */}
        {/* --- NEW: Mobile Sidebar Overlay --- */}
        <div
          className={`sidebar-mobile-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange} // Use handler to potentially debounce/manage filter state
          articleCount={totalArticlesCount} // Use total count from API
          isOpen={isSidebarOpen} // NEW Prop
          onClose={closeSidebar} // UPDATED: Pass combined close function
        />

        <main className="content" ref={contentRef}> {/* NEW: Added ref */}
          
          {/* --- (FIX) NEW: Pull-to-refresh Visual Indicators --- */}
          <div 
            className="pull-indicator" 
            style={{ 
              opacity: Math.min(pullDistance / 120, 1), 
              transform: `translateY(${Math.min(pullDistance, 90)}px)`, // Move indicator down
              transition: pullDistance === 0 ? 'all 0.3s ease' : 'none' 
            }}
          >
            <span 
              className="pull-indicator-arrow" 
              style={{ 
                transform: `rotate(${pullDistance > 120 ? '180deg' : '0deg'})` 
              }}
            >
              ↓
            </span>
            <span>{pullDistance > 120 ? 'Release to refresh' : 'Pull to refresh'}</span>
          </div>

          <div 
            className="pull-to-refresh-container" // This is the spinner
            style={{ 
              display: isRefreshing ? 'flex' : 'none' 
            }}
          >
            <div className="spinner-small"></div>
            <p>Refreshing...</p>
          </div>
          {/* --- End Pull-to-refresh --- */}


          {(loading && initialLoad) ? ( // Show loading only on initial/filter load
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : (
            <>
              {displayedArticles.length > 0 ? (
                 <div className="articles-grid">
                  {displayedArticles.map((article) => (
                    // --- NEW: Added wrapper for mobile scroll-snap ---
                    <div className="article-card-wrapper" key={article._id || article.url}>
                      <ArticleCard
                        article={article}
                        onCompare={(clusterId, title) => setCompareModal({ open: true, clusterId, articleTitle: title })}
                        onAnalyze={(article) => setAnalysisModal({ open: true, article })}
                        onShare={shareArticle}
                        // --- NEW: Tooltip props ---
                        showTooltip={showTooltip}
                        hideTooltip={hideTooltip}
                      />
                    </div>
                  ))}
                 </div>
              ) : (
                // Show message if no articles match filters (and not loading)
                 <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                    <p>No articles found matching your current filters.</p>
                 </div>
              )}


              {/* (FIX) Show Load More button only if there are more articles */}
              {/* This is now a snap-point on mobile */}
              {!loading && displayedArticles.length < totalArticlesCount && (
                <div className="article-card-wrapper load-more-wrapper">
                  <div className="load-more">
                    <button onClick={loadMoreArticles} className="load-more-btn">
                      Load More ({totalArticlesCount - displayedArticles.length} remaining)
                    </button>
                  </div>
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
          // --- NEW: Tooltip props ---
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
        />
      )}

      {analysisModal.open && (
        <DetailedAnalysisModal
          article={analysisModal.article}
          onClose={() => setAnalysisModal({ open: false, article: null })}
          // --- NEW: Tooltip props ---
          showTooltip={showTooltip}
          hideTooltip={hideTooltip}
        />
      )}
    </div>
  );
}

// === Sub-Components ===

// --- NEW: Custom Tooltip Component ---
function CustomTooltip({ visible, text, x, y }) {
  if (!visible) return null;

  return (
    <div
      className="tooltip-custom"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        // Position centered horizontally, above the touch point
        transform: 'translate(-50%, -100%)',
      }}
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
         {/* --- NEW: Hamburger Button --- */}
         <button className="hamburger-btn" onClick={onToggleSidebar} title="Open Filters">
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
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}

// --- NEW: Custom Select Component ---
function CustomSelect({ name, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Find the display label for the current value
  const selectedOption = options.find(option => (option.value || option) === value);
  const displayLabel = selectedOption?.label || selectedOption || value;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectRef]);

  const handleSelectOption = (optionValue) => {
    onChange({ target: { name, value: optionValue } }); // Mimic event object
    setIsOpen(false);
  };

  return (
    <div className="custom-select-container" ref={selectRef}>
      <button
        type="button"
        className={`custom-select-value ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{displayLabel}</span>
        <svg className="custom-select-arrow" xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
          <path d="M7 10l5 5 5-5z"></path><path d="M0 0h24v24H0z" fill="none"></path>
        </svg>
      </button>
      
      {isOpen && (
        <ul className="custom-select-options" role="listbox">
          {options.map((option, index) => {
            const optionValue = option.value || option;
            const optionLabel = option.label || option;
            const isSelected = optionValue === value;

            return (
              <li
                key={index}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectOption(optionValue)}
                role="option"
                aria-selected={isSelected}
              >
                {optionLabel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// --- Sidebar (UPDATED with CustomSelect and new Quality Labels) ---
function Sidebar({ filters, onFilterChange, articleCount, isOpen, onClose }) {
  const categories = ['All Categories', 'Politics', 'Economy', 'Technology', 'Health', 'Environment', 'Justice', 'Education', 'Entertainment', 'Sports', 'Other'];
  const leans = ['All Leans', 'Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];

  // --- UPDATED Quality Level Options (v2.11) ---
  const qualityLevels = [
    { value: 'All Quality Levels', label: 'All Quality Levels' },
    { value: 'A+ Excellent (90-100)', label: 'A+ : Excellent' },
    { value: 'A High (80-89)', label: 'A : High' },
    { value: 'B Professional (70-79)', label: 'B : Professional' },
    { value: 'C Acceptable (60-69)', label: 'C : Acceptable' },
    { value: 'D-F Poor (0-59)', label: 'D-F : Poor' },
    { value: 'Review / Opinion', label: 'Review / Opinion' }, // NEW Option
  ];

  const sortOptions = ['Latest First', 'Highest Quality', 'Most Covered', 'Lowest Bias'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}> {/* NEW: conditional class */}
      <div> {/* Filters Wrapper */}
        <div className="sidebar-header-mobile"> {/* NEW: Mobile header in sidebar */}
          <h3>Filters</h3>
          <button className="sidebar-close-btn" onClick={onClose} title="Close Filters">×</button>
        </div>

        <div className="filter-section">
          <h3>Category</h3>
          <CustomSelect
            name="category"
            value={filters.category}
            options={categories}
            onChange={handleChange}
          />
        </div>

        <div className="filter-section">
          <h3>Political Leaning</h3>
          <CustomSelect
            name="lean"
            value={filters.lean}
            options={leans}
            onChange={handleChange}
          />
        </div>

        <div className="filter-section">
          <h3>Quality Level</h3>
          <CustomSelect
            name="quality"
            value={filters.quality}
            options={qualityLevels} // Pass the array of objects
            onChange={handleChange}
          />
        </div>

        <div className="filter-section">
          <h3>Sort By</h3>
          <CustomSelect
            name="sort"
            value={filters.sort}
            options={sortOptions}
            onChange={handleChange}
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


// --- UPDATED ArticleCard Component (v2.11) ---
// --- Show Bias/Lean, updated grade tooltip ---
// --- NEW: Added onTouchStart/End={(e) => e.stopPropagation()} to all interactive elements ---
function ArticleCard({ article, onCompare, onAnalyze, onShare, showTooltip, hideTooltip }) {

  const isReview = article.analysisType === 'SentimentOnly';
  // --- (FIX) NEW: Check for non-political leaning ---
  const isNonPolitical = article.politicalLean === 'Not Applicable';

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'flex';
    }
  };

  const stopTouch = (e) => e.stopPropagation();

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
                className="bias-score-card"
                title="Bias Score (0-100). Less is better."
                onTouchStart={(e) => showTooltip("Bias Score (0-100). Less is better.", e)}
                onTouchEnd={hideTooltip}
              >
                Bias: {article.biasScore}
              </span>
               <span className="meta-divider">|</span>
               <span
                className="political-lean-card"
                title="Detected political leaning."
                onTouchStart={(e) => showTooltip("Detected political leaning.", e)}
                onTouchEnd={hideTooltip}
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
                    onTouchStart={(e) => showTooltip("This article is an opinion, review, or summary.", e)}
                    onTouchEnd={hideTooltip}
                 >
                   Review / Opinion
                 </span>
             ) : article.credibilityGrade ? (
                 <span
                    className="quality-grade-text"
                    title="This grade (A+ to F) is based on the article's Credibility and Reliability."
                    onTouchStart={(e) => showTooltip("This grade (A+ to F) is based on the article's Credibility and Reliability.", e)}
                    onTouchEnd={hideTooltip}
                 > {/* UPDATED TOOLTIP */}
                   Grade: {article.credibilityGrade}
                 </span>
             ) : (
                 <span
                    className="quality-grade-text"
                    title="Quality grade not available."
                    onTouchStart={(e) => showTooltip("Quality grade not available.", e)}
                    onTouchEnd={hideTooltip}
                 >
                   Grade: N/A
                 </span>
             )}

             <span
                className="sentiment-text"
                title="The article's overall sentiment towards its main subject."
                onTouchStart={(e) => showTooltip("The article's overall sentiment towards its main subject.", e)}
                onTouchEnd={hideTooltip}
             >
                Sentiment: {article.sentiment}
             </span>
         </div>
         {/* --- End Simplified Display --- */}


        {/* --- Actions (v2.10 Stacked Buttons) --- */}
        <div className="article-actions">
          {/* --- (FIX) Show stacked buttons if review OR non-political --- */}
          {(isReview || isNonPolitical) ? (
            // --- UI for SentimentOnly OR NonPolitical (STACKED BUTTONS) ---
            <>
              <button
                onClick={() => onShare(article)}
                onTouchStart={stopTouch} // NEW: Prevent scroll on tap
                className="btn-secondary btn-full-width"
                title="Share article link"
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
                onTouchStart={stopTouch} // NEW: Prevent scroll on tap
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
                  onTouchStart={stopTouch} // NEW: Prevent scroll on tap
                  className="btn-secondary"
                  title="View Detailed Analysis"
                >
                  Analysis
                </button>
                <button
                  onClick={() => onShare(article)}
                  onTouchStart={stopTouch} // NEW: Prevent scroll on tap
                  className="btn-secondary"
                  title="Share article link"
                >
                  Share
                </button>
              </div>
              <button
                onClick={() => onCompare(article.clusterId, article.headline)} // Pass headline too
                onTouchStart={stopTouch} // NEW: Prevent scroll on tap
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
                onTouchStart={(e) => showTooltip("Bias Score (0-100, lower is less biased)", e)}
                onTouchEnd={hideTooltip}
              >Bias: {article.biasScore ?? 'N/A'}</span>
              <span
                title="Overall Trust Score (0-100, higher is more trustworthy)"
                onTouchStart={(e) => showTooltip("Overall Trust Score (0-100, higher is more trustworthy)", e)}
                onTouchEnd={hideTooltip}
              >Trust: {article.trustScore ?? 'N/A'}</span>
              <span
                title="Credibility Grade (A+ to F)"
                onTouchStart={(e) => showTooltip("Credibility Grade (A+ to F)", e)}
                onTouchEnd={hideTooltip}
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
      tooltip = 'Reliability Score (0-1A 0-100). Measures the source\'s consistency, standards, and corrections policy over time.';
      break;
    default:
      tooltip = `${label} (0-100)`;
  }

  return (
    <div
      className="score-circle"
      title={tooltip}
      onTouchStart={(e) => showTooltip(tooltip, e)}
      onTouchEnd={hideTooltip}
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
      onTouchStart={(e) => showTooltip(finalTooltip, e)}
      onTouchEnd={hideTooltip}
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

