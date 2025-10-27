// App.js (UPDATED v2.12 - Minor Auth Fix)
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; 

// --- NEW: Firebase Auth Imports ---
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebaseConfig'; 
import Login from './Login'; 

// Use environment variable for API URL, fallback to localhost for local dev
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// --- Tooltip Helper ---
const getBreakdownTooltip = (label) => {
  const tooltips = {
    // ... (tooltips remain the same) ...
    "Sentiment Polarity": "Measures the overall positive, negative, or neutral leaning of the language used.",
    "Emotional Language": "Detects the prevalence of words intended to evoke strong emotional responses.",
    "Loaded Terms": "Identifies words or phrases with strong connotations beyond their literal meaning.",
    "Complexity Bias": "Assesses if overly complex or simplistic language is used to obscure or mislead.",
    "Source Diversity": "Evaluates the variety of sources cited (e.g., political, expert, eyewitness).",
    "Expert Balance": "Checks if experts from different perspectives are represented fairly.",
    "Attribution Transparency": "Assesses how clearly sources are identified and attributed.",
    "Gender Balance": "Measures the representation of different genders in sources and examples.",
    "Racial Balance": "Measures the representation of different racial or ethnic groups.",
    "Age Representation": "Checks for biases related to age groups in reporting.",
    "Headline Framing": "Analyzes if the headline presents a neutral or skewed perspective of the story.",
    "Story Selection": "Considers if the choice of this story over others indicates a potential bias.",
    "Omission Bias": "Evaluates if significant facts or contexts are left out, creating a misleading picture.",
    "Source Credibility": "Assesses the reputation and track record of the news source itself.",
    "Fact Verification": "Evaluates the rigor of the fact-checking processes evident in the article.",
    "Professionalism": "Measures adherence to journalistic standards like objectivity and transparency.",
    "Evidence Quality": "Assesses the strength and reliability of the data and evidence presented.",
    "Transparency": "Evaluates openness about sources, funding, and potential conflicts of interest.",
    "Audience Trust": "Considers public perception and trust metrics associated with the source (if available).",
    "Consistency": "Measures the source's consistency in accuracy and quality over time.",
    "Temporal Stability": "Evaluates the source's track record and how long it has been operating reliably.",
    "Quality Control": "Assesses the internal editorial review and error correction processes.",
    "Publication Standards": "Evaluates adherence to established journalistic codes and ethics.",
    "Corrections Policy": "Assesses the clarity, visibility, and timeliness of corrections for errors.",
    "Update Maintenance": "Measures how well the source updates developing stories with new information.",
  };
  return tooltips[label] || label;
};


function App() {
  // --- NEW: Auth State ---
  const [authState, setAuthState] = useState({
    isLoading: true,
    user: null,
  });

  // --- Existing States ---
  const [displayedArticles, setDisplayedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [filters, setFilters] = useState({
    category: 'All Categories',
    lean: 'All Leans',
    quality: 'All Quality Levels',
    sort: 'Latest First'
  });
  const [compareModal, setCompareModal] = useState({ open: false, clusterId: null, articleTitle: '' });
  const [analysisModal, setAnalysisModal] = useState({ open: false, article: null });
  const [totalArticlesCount, setTotalArticlesCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(true);

  // --- (FIX) UPDATED: Custom Tooltip/Popup State ---
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
  const [pullDistance, setPullDistance] = useState(0);
  const pullThreshold = 120;

  // --- (FIX) UPDATED: Custom Tooltip/Popup Handlers (for Mobile Tap) ---
  const showTooltip = (text, e) => {
    if (!isMobile() || !text) return;
    e.stopPropagation(); 

    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    if (!x || !y) return;

    if (tooltip.visible && tooltip.text === text) {
      setTooltip({ visible: false, text: '', x: 0, y: 0 }); 
    } else {
      setTooltip({ visible: true, text, x: x, y: y });
    }
  };

  const hideTooltip = () => {
    if (tooltip.visible) {
      setTooltip({ ...tooltip, visible: false });
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltip.visible && !e.target.closest('.tooltip-custom')) {
        hideTooltip();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [tooltip.visible]);
  // --- End Tooltip Handlers ---


  // --- NEW: Firebase Auth Listener Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState({ isLoading: false, user: user });
      } else {
        setAuthState({ isLoading: false, user: null });
      }
    });
    return () => unsubscribe();
  }, []);

  // --- NEW: Axios Token Interceptor Effect ---
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      async (config) => {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // --- NEW: Add Response Interceptor for Auth Error Handling (CRITICAL) ---
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response, // Pass successful responses through
      (error) => {
        // If the error response status is 401 or 403, log out the user
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.error("Auth token invalid, logging out.");
          handleLogout(); 
        }
        return Promise.reject(error);
      }
    );
    // ------------------------------------------------------------------------

    // Cleanup function to remove the interceptors
    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor); // Cleanup response interceptor
    };
  }, []); // Empty dependency array, run once


  // Effect to set initial theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme + '-mode';
  }, []);

  // --- (FIX) NEW: Effect to check for shared article on load ---
  useEffect(() => {
    const fetchAndShowArticle = async (id) => {
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
         console.error('Invalid article ID format from URL');
         return;
      }
      try {
        console.log(`Fetching shared article: ${id}`);
        
        // The request uses the interceptor which handles the token
        const response = await axios.get(`${API_URL}/articles/${id}`);
        if (response.data) {
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
        // The interceptor handles the 403/401, so we just log if the article is not found
        if (error.response && error.response.status !== 401 && error.response.status !== 403) {
            console.error('Failed to fetch shared article:', error.response ? error.response.data : error.message);
        }
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    if (articleId) {
       if(authState.user) {
         fetchAndShowArticle(articleId);
       }
    }
  }, [authState.user]);

  // Effect to fetch articles when filters change or on initial load
  useEffect(() => {
    if (!authState.user) return;
    
    fetchArticles();
  }, [filters, authState.user]);

  // Close sidebar on filter change (for mobile)
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [filters]);

  // --- (FIX) Pull-to-Refresh Effects (No change, remains correct) ---
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || !isMobile()) return;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      touchEndY.current = e.touches[0].clientY;
      const currentPullDistance = touchEndY.current - touchStartY.current;
      
      if (contentEl.scrollTop === 0 && currentPullDistance > 0 && !isRefreshing) {
        setPullDistance(currentPullDistance);
        e.preventDefault(); 
      } else if (contentEl.scrollTop !== 0 || currentPullDistance <= 0) {
        setPullDistance(0); 
      }
    };

    const handleTouchEnd = () => {
      if (contentEl.scrollTop === 0 && pullDistance > pullThreshold && !isRefreshing) {
        setIsRefreshing(true);
        fetchArticles().finally(() => setIsRefreshing(false));
      }
      setPullDistance(0); 
    };

    contentEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    contentEl.addEventListener('touchmove', handleTouchMove, { passive: false }); 
    contentEl.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      contentEl.removeEventListener('touchstart', handleTouchStart);
      contentEl.removeEventListener('touchmove', handleTouchMove);
      contentEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, contentRef, pullThreshold]); 


  // --- NEW: Logout Function ---
  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error('Logout Error:', error);
    });
  };


  const fetchArticles = async (loadMore = false) => {
    try {
      setLoading(true);
      if (!loadMore) {
        setInitialLoad(true);
      }
      const limit = 12;
      const offset = loadMore ? displayedArticles.length : 0;

      const queryParams = { ...filters, limit, offset };
      if (filters.quality === 'Review / Opinion') {
        queryParams.quality = null;
        queryParams.analysisType = 'SentimentOnly';
      } else {
        queryParams.analysisType = null;
      }

      const response = await axios.get(`${API_URL}/articles`, {
        params: queryParams
      });

      const articlesData = response.data.articles || [];
      const paginationData = response.data.pagination || { total: 0 };
      setTotalArticlesCount(paginationData.total || 0);

      // --- Data Cleaning and Defaulting (No major changes here) ---
      const uniqueNewArticles = articlesData
        .filter(article => article && article.url)
        .map(article => ({
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
        }));
      // --- End Data Cleaning ---


      if (loadMore) {
         const currentUrls = new Set(displayedArticles.map(a => a.url));
         const trulyNewArticles = uniqueNewArticles.filter(a => !currentUrls.has(a.url));
         setDisplayedArticles(prev => [...prev, ...trulyNewArticles]);
      } else {
         setDisplayedArticles(uniqueNewArticles);
      }

      setLoading(false);
      setInitialLoad(false);
      setIsRefreshing(false);

    } catch (error) {
      console.error('❌ Error fetching articles:', error.response ? error.response.data : error.message);
      
      // Removed manual 401/403 handling as it is now in the response interceptor
      
      setLoading(false);
      setInitialLoad(false);
      setIsRefreshing(false);
    }
  };

  const loadMoreArticles = () => {
    if (loading || displayedArticles.length >= totalArticlesCount) return;
    fetchArticles(true);
  };


  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
  };

  // Debounced scroll handler (no change, remains correct)
  useEffect(() => {
    let timeoutId;
    const scrollableElement = window.innerWidth <= 768 ? contentRef.current : window;

    if (!scrollableElement) return;

    const handleScroll = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const isWindow = scrollableElement === window;
            const scrollHeight = isWindow ? document.body.offsetHeight : scrollableElement.scrollHeight;
            const scrollTop = isWindow ? window.scrollY : scrollableElement.scrollTop;
            const clientHeight = isWindow ? window.innerHeight : scrollableElement.clientHeight;

            if (clientHeight + scrollTop >= scrollHeight - 800) {
                if (!loading && displayedArticles.length < totalArticlesCount) {
                    loadMoreArticles();
                }
            }
        }, 150);
    };

    scrollableElement.addEventListener('scroll', handleScroll);
    return () => {
        clearTimeout(timeoutId);
        scrollableElement.removeEventListener('scroll', handleScroll);
    };
}, [loading, displayedArticles, totalArticlesCount, contentRef]);


  const shareArticle = (article) => {
    const appUrl = window.location.origin;
    const shareUrl = `${appUrl}?article=${article._id}`;
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
        navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!'));
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!'));
    }
  };

  const toggleSidebar = () => {
    if (isMobile()) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsDesktopSidebarVisible(!isDesktopSidebarVisible);
    }
  };

  const closeSidebar = () => {
    if (isMobile()) {
      setIsSidebarOpen(false);
    } else {
      setIsDesktopSidebarVisible(false);
    }
  };


  return (
    <div className="app">
      {/* --- NEW: Auth Gate --- */}
      {authState.isLoading ? (
        <div className="loading-container" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>Authenticating...</p>
        </div>
      ) : !authState.user ? (
        <Login />
      ) : (
        <>
          <CustomTooltip
            visible={tooltip.visible}
            text={tooltip.text}
            x={tooltip.x}
            y={tooltip.y}
          />

          <Header
            theme={theme}
            toggleTheme={toggleTheme}
            onToggleSidebar={toggleSidebar}
            user={authState.user}
            onLogout={handleLogout}
          />

          <div className={`main-container ${!isDesktopSidebarVisible ? 'desktop-sidebar-hidden' : ''}`}>
            <div
              className={`sidebar-mobile-overlay ${isSidebarOpen ? 'open' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            ></div>

            <Sidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              articleCount={totalArticlesCount}
              isOpen={isSidebarOpen}
              onClose={closeSidebar}
            />

            <main className="content" ref={contentRef}> 
              
              <div 
                className="pull-indicator" 
                style={{ 
                  opacity: Math.min(pullDistance / pullThreshold, 1), 
                }}
              >
                <span 
                  className="pull-indicator-arrow" 
                  style={{ 
                    transform: `rotate(${pullDistance > pullThreshold ? '180deg' : '0deg'})` 
                  }}
                >
                  ↓
                </span>
                <span>{pullDistance > pullThreshold ? 'Release to refresh' : 'Pull to refresh'}</span>
              </div>

              <div 
                className="pull-to-refresh-container"
                style={{ 
                  display: isRefreshing ? 'flex' : 'none'
                }}
              >
                <div className="spinner-small"></div>
                <p>Refreshing...</p>
              </div>

              <div 
                className="content-scroll-wrapper"
              >
                {(loading && initialLoad) ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading articles...</p>
                  </div>
                ) : (
                  <> 
                    {displayedArticles.length > 0 ? (
                      <div className="articles-grid"> 
                        {displayedArticles.map((article) => (
                          <div className="article-card-wrapper" key={article._id || article.url}>
                            <ArticleCard
                              article={article}
                              onCompare={(clusterId, title) => setCompareModal({ open: true, clusterId, articleTitle: title })}
                              onAnalyze={(article) => setAnalysisModal({ open: true, article })}
                              onShare={shareArticle}
                              showTooltip={showTooltip}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                          <p>No articles found matching your current filters.</p>
                      </div>
                    )}

                    {(loading && !initialLoad) && (
                      <div className="article-card-wrapper load-more-wrapper"> 
                        <div className="loading-container" style={{ minHeight: '200px' }}>
                          <div className="spinner"></div>
                          <p>Loading more articles...</p>
                        </div>
                      </div>
                    )}

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
              </div>
            </main>
          </div>

          {compareModal.open && (
            <CompareCoverageModal
              clusterId={compareModal.clusterId}
              articleTitle={compareModal.articleTitle}
              onClose={() => setCompareModal({ open: false, clusterId: null, articleTitle: '' })}
              onAnalyze={(article) => {
                setCompareModal({ open: false, clusterId: null, articleTitle: '' });
                setAnalysisModal({ open: true, article });
              }}
              showTooltip={showTooltip}
            />
          )}

          {analysisModal.open && (
            <DetailedAnalysisModal
              article={analysisModal.article}
              onClose={() => setAnalysisModal({ open: false, article: null })}
              showTooltip={showTooltip}
            />
          )}
        </>
      )}
    </div>
  );
}

// === Sub-Components (All remain the same below) ===

function CustomTooltip({ visible, text, x, y }) {
  if (!visible) return null;

  const style = {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -100%)',
    marginTop: '-10px',
  };

  return (
    <div
      className="tooltip-custom"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {text}
    </div>
  );
}


function Header({ theme, toggleTheme, onToggleSidebar, user, onLogout }) {
  return (
    <header className="header">
      <div className="header-left">
         <button className="hamburger-btn" onClick={onToggleSidebar} title="Open Filters">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
         </button>

        <div className="logo-container">
          <h1 className="logo-text">The Gamut</h1>
          <p className="tagline">Analyse The Full Spectrum</p>
        </div>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-info">
            <span className="user-email" title={user.email}>{user.email}</span>
            <button onClick={onLogout} className="logout-btn" title="Sign Out">
              Sign Out
            </button>
          </div>
        )}

        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

function CustomSelect({ name, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find(option => (option.value || option) === value);
  const displayLabel = selectedOption?.label || selectedOption || value;

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
    onChange({ target: { name, value: optionValue } });
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

function Sidebar({ filters, onFilterChange, articleCount, isOpen, onClose }) {
  const categories = ['All Categories', 'Politics', 'Economy', 'Technology', 'Health', 'Environment', 'Justice', 'Education', 'Entertainment', 'Sports', 'Other'];
  const leans = ['All Leans', 'Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right', 'Not Applicable'];

  const qualityLevels = [
    { value: 'All Quality Levels', label: 'All Quality Levels' },
    { value: 'A+ Excellent (90-100)', label: 'A+ : Excellent' },
    { value: 'A High (80-89)', label: 'A : High' },
    { value: 'B Professional (70-79)', label: 'B : Professional' },
    { value: 'C Acceptable (60-69)', label: 'C : Acceptable' },
    { value: 'D-F Poor (0-59)', label: 'D-F : Poor' },
    { value: 'Review / Opinion', label: 'Review / Opinion' },
  ];

  const sortOptions = ['Latest First', 'Highest Quality', 'Most Covered', 'Lowest Bias'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div>
        <div className="sidebar-header-mobile">
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
            options={qualityLevels}
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

      {articleCount > 0 && (
        <div className="filter-results">
          <p>{articleCount} articles analyzed</p>
        </div>
      )}
    </aside>
  );
}

function ArticleCard({ article, onCompare, onAnalyze, onShare, showTooltip }) {

  const isMobile = () => window.innerWidth <= 768;

  const isReview = article.analysisType === 'SentimentOnly';
  const isNonPolitical = article.politicalLean === 'Not Applicable';
  const showReadArticleStack = isReview || isNonPolitical;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'flex';
    }
  };

  const stopMobileClick = (e) => {
    if (isMobile()) {
      e.stopPropagation();
    }
  };

  const getSentimentClass = (sentiment) => {
    if (sentiment === 'Positive') return 'sentiment-positive';
    if (sentiment === 'Negative') return 'sentiment-negative';
    return 'sentiment-neutral';
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
        <div className="article-content-top">
          <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="article-headline-link"
              onClick={stopMobileClick}
          >
              <h3 className="article-headline">{article.headline}</h3>
          </a>

          <p className="article-summary">{article.summary}</p>
        </div>
        
        <div className="article-content-bottom">
          <div className="article-meta-v2">
            <span className="source" title={article.source}>{article.source}</span>
            {!isReview && (
              <>
                <span className="meta-divider">|</span>
                <span
                  className="bias-score-card"
                  title="Bias Score (0-100). Less is better."
                  onClick={(e) => showTooltip("Bias Score (0-100). Less is better.", e)}
                >
                  Bias: <span className="accent-text">{article.biasScore}</span>
                </span>
                <span className="meta-divider">|</span>
                <span
                  className="political-lean-card"
                  title="Detected political leaning."
                  onClick={(e) => showTooltip("Detected political leaning.", e)}
                >
                  <span className={article.politicalLean !== 'Not Applicable' ? 'accent-text' : ''}>
                      {article.politicalLean}
                  </span>
                </span>
              </>
            )}
          </div>


          <div className="quality-display-v2">
              {isReview ? (
                  <span
                      className="quality-grade-text"
                      title="This article is an opinion, review, or summary."
                      onClick={(e) => showTooltip("This article is an opinion, review, or summary.", e)}
                  >
                    Review / Opinion
                  </span>
              ) : (
                  <span
                      className="quality-grade-text"
                      title="This grade (A+ to F) is based on the article's Credibility and Reliability."
                      onClick={(e) => showTooltip("This grade (A+ to F) is based on the article's Credibility and Reliability.", e)}
                  >
                    Grade: {article.credibilityGrade ? <span className="accent-text">{article.credibilityGrade}</span> : 'N/A'}
                  </span>
              )}

              <span
                  className="sentiment-text"
                  title="The article's overall sentiment towards its main subject."
                  onClick={(e) => showTooltip("The article's overall sentiment towards its main subject.", e)}
              >
                  Sentiment:
                  <span className={getSentimentClass(article.sentiment)}>
                    {' '}{article.sentiment}
                  </span>
              </span>
          </div>


          <div className="article-actions">
            {showReadArticleStack ? (
              <>
                <button
                  onClick={(e) => { stopMobileClick(e); onShare(article); }}
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
                  onClick={stopMobileClick}
                >
                  Read Article
                </a>
              </>
            ) : (
              <>
                <div className="article-actions-top">
                  <button
                    onClick={(e) => { stopMobileClick(e); onAnalyze(article); }}
                    className="btn-secondary"
                    title="View Detailed Analysis"
                  >
                    Analysis
                  </button>
                  <button
                    onClick={(e) => { stopMobileClick(e); onShare(article); }}
                    className="btn-secondary"
                    title="Share article link"
                  >
                    Share
                  </button>
                </div>
                <button
                  onClick={(e) => { stopMobileClick(e); onCompare(article.clusterId, article.headline); }}
                  className="btn-primary btn-full-width"
                  title="Compare Coverage Across Perspectives"
                >
                  Compare Coverage
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareCoverageModal({ clusterId, articleTitle, onClose, onAnalyze, showTooltip }) {
  const [clusterData, setClusterData] = useState({ left: [], center: [], right: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    const fetchCluster = async () => {
      if (!clusterId) {
          console.log("No clusterId provided, showing empty compare.");
          setLoading(false);
          setClusterData({ left: [], center: [], right: [], stats: {} });
          setActiveTab('left');
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

        if (data.left.length > 0) setActiveTab('left');
        else if (data.center.length > 0) setActiveTab('center');
        else if (data.right.length > 0) setActiveTab('right');
        else setActiveTab('left');

        setLoading(false);
      } catch (error) {
        console.error(`❌ Error fetching cluster ${clusterId}:`, error.response ? error.response.data : error.message);
        // Auth error handled by interceptor
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
              {activeTab === 'left' && renderArticleGroup(clusterData.left, 'Left', onAnalyze, showTooltip)}
              {activeTab === 'center' && renderArticleGroup(clusterData.center, 'Center', onAnalyze, showTooltip)}
              {activeTab === 'right' && renderArticleGroup(clusterData.right, 'Right', onAnalyze, showTooltip)}

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

function renderArticleGroup(articleList, perspective, onAnalyze, showTooltip) {
  if (!articleList || articleList.length === 0) return null;
  
  const isMobile = () => window.innerWidth <= 768;

  const stopMobileClick = (e) => {
    if (isMobile()) {
      e.stopPropagation();
    }
  };


  return (
    <div className="perspective-section">
      <h3 className={`perspective-title ${perspective.toLowerCase()}`}>{perspective} Perspective</h3>
      {articleList.map(article => (
        <div key={article._id || article.url} className="coverage-article">
          <div className="coverage-content">
            <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={stopMobileClick}>
              <h4>{article.headline || 'No Headline'}</h4>
            </a>
            <p>
              {(article.summary || '').substring(0, 150)}{article.summary && article.summary.length > 150 ? '...' : ''}
            </p>

            <div className="article-scores">
              <span
                title="Bias Score (0-100, lower is less biased)"
                onClick={(e) => showTooltip("Bias Score (0-100, lower is less biased)", e)}
              >
                Bias: {article.biasScore != null ? <span className="accent-text">{article.biasScore}</span> : 'N/A'}
              </span>
              <span
                title="Overall Trust Score (0-100, higher is more trustworthy)"
                onClick={(e) => showTooltip("Overall Trust Score (0-100, higher is more trustworthy)", e)}
              >
                Trust: {article.trustScore != null ? <span className="accent-text">{article.trustScore}</span> : 'N/A'}
              </span>
              <span
                title="Credibility Grade (A+ to F)"
                onClick={(e) => showTooltip("Credibility Grade (A+ to F)", e)}
              >
                Grade: {article.credibilityGrade ? <span className="accent-text">{article.credibilityGrade}</span> : 'N/A'}
              </span>
            </div>
            <div className="coverage-actions">
              <a href={article.url} target="_blank" rel="noopener noreferrer" style={{flex: 1}} onClick={stopMobileClick}>
                  <button style={{width: '100%'}} onClick={stopMobileClick}>Read Article</button>
              </a>
              <button onClick={(e) => { stopMobileClick(e); onAnalyze(article); }}>View Analysis</button>
            </div>
          </div>

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

function DetailedAnalysisModal({ article, onClose, showTooltip }) {
  const [activeTab, setActiveTab] = useState('overview');

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
          <h2>{article.headline.substring(0, 60)}{article.headline.length > 60 ? '...' : ''}</h2>
          <button className="close-btn" onClick={onClose} title="Close analysis">×</button>
        </div>

        <div className="modal-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={activeTab === 'breakdown' ? 'active' : ''} onClick={() => setActiveTab('breakdown')}>
            Overview Breakdown
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && <OverviewTab article={article} showTooltip={showTooltip} />}
          {activeTab === 'breakdown' && <OverviewBreakdownTab article={article} showTooltip={showTooltip} />}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close Analysis</button>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ article, showTooltip }) {
  return (
    <div className="tab-content">
      <div className="overview-grid">
        <ScoreBox label="Trust Score" value={article.trustScore} showTooltip={showTooltip} />
        <ScoreBox label="Bias Score" value={article.biasScore} showTooltip={showTooltip} />
        <ScoreBox label="Credibility" value={article.credibilityScore} showTooltip={showTooltip} />
        <ScoreBox label="Reliability" value={article.reliabilityScore} showTooltip={showTooltip} />
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

function OverviewBreakdownTab({ article, showTooltip }) {
  const [showZeroScores, setShowZeroScores] = useState(false);

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
  ].map(c => ({ ...c, value: Number(c.value) || 0 }));

  const credComps = article.credibilityComponents || {};
  const allCredibilityComponents = [
    { label: "Source Credibility", value: credComps.sourceCredibility },
    { label: "Fact Verification", value: credComps.factVerification },
    { label: "Professionalism", value: credComps.professionalism },
    { label: "Evidence Quality", value: credComps.evidenceQuality },
    { label: "Transparency", value: credComps.transparency },
    { label: "Audience Trust", value: credComps.audienceTrust },
  ].map(c => ({ ...c, value: Number(c.value) || 0 }));

  const relComps = article.reliabilityComponents || {};
  const allReliabilityComponents = [
    { label: "Consistency", value: relComps.consistency },
    { label: "Temporal Stability", value: relComps.temporalStability },
    { label: "Quality Control", value: relComps.qualityControl },
    { label: "Publication Standards", value: relComps.publicationStandards },
    { label: "Corrections Policy", value: relComps.correctionsPolicy },
    { label: "Update Maintenance", value: relComps.updateMaintenance },
  ].map(c => ({ ...c, value: Number(c.value) || 0 }));

  const visibleBias = allBiasComponents.filter(c => c.value > 0 || showZeroScores);
  const visibleCredibility = allCredibilityComponents.filter(c => c.value > 0 || showZeroScores);
  const visibleReliability = allReliabilityComponents.filter(c => c.value > 0 || showZeroScores);

  return (
    <div className="tab-content">

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
        <div className="divider" />
        <div className="component-grid-v2 section-spacing">
            {visibleBias.length > 0 ? (
                visibleBias.map(comp => (
                  <CircularProgressBar
                    key={comp.label}
                    label={comp.label}
                    value={comp.value}
                    tooltip={getBreakdownTooltip(comp.label)}
                    showTooltip={showTooltip}
                  />
                ))
            ) : (
              <p className="zero-score-note">All bias components scored 0. Enable the toggle above to see them.</p>
            )}
        </div>
      </div>

      <div className="component-section">
        <div className="component-section-header">
            <h4>Credibility Details ({article.credibilityScore ?? 'N/V'}/100)</h4>
        </div>
         <div className="divider" />
        <div className="component-grid-v2 section-spacing">
            {visibleCredibility.length > 0 ? (
                visibleCredibility.map(comp => (
                  <CircularProgressBar
                    key={comp.label}
                    label={comp.label}
                    value={comp.value}
                    tooltip={getBreakdownTooltip(comp.label)}
                    showTooltip={showTooltip}
                   />
                ))
            ) : (
              <p className="zero-score-note">All credibility components scored 0. Enable the toggle above to see them.</p>
            )}
        </div>
      </div>

      <div className="component-section">
         <div className="component-section-header">
            <h4>Reliability Details ({article.reliabilityScore ?? 'N/V'}/100)</h4>
         </div>
         <div className="divider" />
        <div className="component-grid-v2 section-spacing">
            {visibleReliability.length > 0 ? (
                visibleReliability.map(comp => (
                  <CircularProgressBar
                    key={comp.label}
                    label={comp.label}
                    value={comp.value}
                    tooltip={getBreakdownTooltip(comp.label)}
                    showTooltip={showTooltip}
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

function ScoreBox({ label, value, showTooltip }) {
  let tooltip = '';
  switch(label) {
    case 'Trust Score':
      tooltip = 'Overall Trust Score (0-100). A combined measure of Credibility and Reliability. Higher is better.';
      break;
    case 'Bias Score':
      tooltip = 'Overall Bias Score (0-100). Less is better. 0 indicates minimal bias, 100 indicates significant bias.';
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
      onClick={(e) => showTooltip(tooltip, e)}
    >
      <div className="score-value">{value ?? 'N/A'}</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

function CircularProgressBar({ label, value, tooltip, showTooltip }) {
  const numericValue = Math.max(0, Math.min(100, Number(value) || 0));
  const strokeWidth = 8;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (numericValue / 100) * circumference;

  const strokeColor = 'var(--accent-primary)';
  const finalTooltip = tooltip || `${label}: ${numericValue}/100`;

  return (
    <div
      className="circle-progress-container"
      title={finalTooltip}
      onClick={(e) => showTooltip(finalTooltip, e)}
    >
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
            transform="rotate(-90 50 50)"
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
