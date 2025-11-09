// In file: src/App.js
// --- UPDATED: Removed all custom pull-to-refresh logic (refs, state, effects) ---
// --- UPDATED: Removed all "article-card-wrapper" divs from JSX ---
// --- UPDATED: Fixed "load more" scroll handler to always use `window` ---
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react'; // <-- ADDED useCallback
import axios from 'axios';
import './App.css'; // Main CSS
import './DashboardPages.css'; // --- Import dashboard styles ---

// --- React Router imports ---
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// --- Firebase Auth Imports ---
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebaseConfig'; // Import our configured auth
import Login from './Login'; // Import the Login component

// --- Import the CreateProfile page ---
import CreateProfile from './CreateProfile';

// --- Import Core Components ---
import PageLoader from './components/PageLoader';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ArticleCard from './components/ArticleCard';

// --- Import UI Components ---
import CustomTooltip from './components/ui/CustomTooltip';

// --- Import Modal Components ---
import CompareCoverageModal from './components/modals/CompareCoverageModal';
import DetailedAnalysisModal from './components/modals/DetailedAnalysisModal';

// --- Import Lazy-Loaded Pages ---
const MyDashboard = lazy(() => import('./MyDashboard'));
const SavedArticles = lazy(() => import('./SavedArticles'));
const AccountSettings = lazy(() => import('./AccountSettings'));


// Use environment variable for API URL, fallback to localhost for local dev
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// (FIX) Moved isMobile helper function here so it can be re-used
const isMobile = () => window.innerWidth <= 768;

// --- AppWrapper ---
function AppWrapper() {
  // --- Auth State ---
  const [authState, setAuthState] = useState({
    isLoading: true,
    user: null,
  });

  // --- Profile State ---
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // --- Router hooks ---
  const navigate = useNavigate();
  const location = useLocation(); // To check which page we are on

  // --- Existing States ---
  const [displayedArticles, setDisplayedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // Kept for spinner logic
  const [theme, setTheme] = useState('dark');
  const [filters, setFilters] = useState({
    category: 'All Categories',
    lean: 'All Leans',
    quality: 'All Quality Levels',
    sort: 'Latest First',
    region: 'Global',
    articleType: 'All Types'
  });
  const [compareModal, setCompareModal] = useState({ open: false, clusterId: null, articleTitle: '', articleId: null });
  const [analysisModal, setAnalysisModal] = useState({ open: false, article: null });
  const [totalArticlesCount, setTotalArticlesCount] = useState(0); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(true);

  // (FIX) State to track mobile view for resize bug
  const [isMobileView, setIsMobileView] = useState(isMobile());

  // --- *** NEW: State for Saved Articles *** ---
  const [savedArticleIds, setSavedArticleIds] = useState(new Set());
  // --- *** END NEW *** ---

  // --- Custom Tooltip/Popup State ---
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });

  // (FIX) useEffect to update isMobileView on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); 

  // --- Custom Tooltip/Popup Handlers (for Mobile Tap) ---
  const showTooltip = (text, e) => {
    if (!isMobileView || !text) return; 
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

  // --- FIX: Wrapped in useCallback ---
  const hideTooltip = useCallback(() => {
    if (tooltip.visible) {
      setTooltip({ ...tooltip, visible: false });
    }
  }, [tooltip]);

  // Effect to hide tooltip on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltip.visible && !e.target.closest('.tooltip-custom')) {
        hideTooltip();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [tooltip.visible, hideTooltip]); // <-- FIX: hideTooltip is now a stable dependency
  // --- End Tooltip Handlers ---


  // --- Firebase Auth Listener Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState({ isLoading: false, user: user });
      } else {
        setAuthState({ isLoading: false, user: null });
        setProfile(null);
        setIsProfileLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Profile Checking Effect ---
  useEffect(() => {
    if (authState.user && !profile) {
      setIsProfileLoading(true);
      const checkProfile = async () => {
        try {
          const response = await axios.get(`${API_URL}/profile/me`);
          setProfile(response.data);
          // --- *** NEW: Populate saved articles state *** ---
          setSavedArticleIds(new Set(response.data.savedArticles || []));
          // --- *** END NEW *** ---

          if (location.pathname === '/create-profile') {
            navigate('/');
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log('Profile not found, redirecting to create-profile');
            navigate('/create-profile');
          } else {
            console.error('Failed to fetch profile', error);
          }
        }
        setIsProfileLoading(false);
      };
      checkProfile();
    }
  }, [authState.user, profile, navigate, location.pathname]);


  // --- Axios Token Interceptor Effect ---
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
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);


  // Effect to set initial theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme + '-mode';
  }, []);

  // --- Logout Function ---
  const handleLogout = useCallback(() => {
    signOut(auth).catch((error) => {
      console.error('Logout Error:', error);
    });
  }, []);

  // --- FIX: Wrapped fetchArticles in useCallback ---
  const fetchArticles = useCallback(async (loadMore = false) => {
    try {
      setLoading(true);
      if (!loadMore) {
        setInitialLoad(true);
      }
      const limit = 12; // Articles per page/load
      const offset = loadMore ? displayedArticles.length : 0;

      const queryParams = { ...filters, limit, offset };

      const response = await axios.get(`${API_URL}/articles`, {
        params: queryParams
      });

      const articlesData = response.data.articles || [];
      const paginationData = response.data.pagination || { total: 0 };
      setTotalArticlesCount(paginationData.total || 0);

      // --- Data Cleaning and Defaulting ---
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
            clusterId: article.clusterId || null,
            clusterCount: Number(article.clusterCount) || 1 // Ensure clusterCount is added
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

      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
         console.error("Auth token invalid, logging out.");
         handleLogout();
      }

      setLoading(false);
      setInitialLoad(false);
      setIsRefreshing(false);
    }
  }, [filters, displayedArticles, handleLogout]);

  // --- FIX: Wrapped loadMoreArticles in useCallback ---
  const loadMoreArticles = useCallback(() => {
    if (loading || displayedArticles.length >= totalArticlesCount) return;
    fetchArticles(true);
  }, [loading, displayedArticles, totalArticlesCount, fetchArticles]);

  // --- Activity Logging (wrapped handleAnalyzeClick in useCallback) ---
  const handleAnalyzeClick = useCallback((article) => {
    setAnalysisModal({ open: true, article });
    axios.post(`${API_URL}/activity/log-view`, { articleId: article._id })
      .then(res => console.log('Activity logged', res.data))
      .catch(err => console.error('Failed to log activity', err));
  }, []); // This function has no dependencies

  // Effect to check for shared article on load
  useEffect(() => {
    const fetchAndShowArticle = async (id) => {
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
         console.error('Invalid article ID format from URL');
         return;
      }
      try {
        console.log(`Fetching shared article: ${id}`);
        const response = await axios.get(`${API_URL}/articles/${id}`);
        if (response.data) {
           const article = response.data;
           // Ensure clusterCount is included during cleaning
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
              clusterId: article.clusterId || null,
              clusterCount: Number(article.clusterCount) || 1 // Fetch or default clusterCount
           };
           handleAnalyzeClick(cleanedArticle);
        }
      } catch (error) {
        console.error('Failed to fetch shared article:', error.response ? error.response.data : error.message);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');

    if (articleId && authState.user && profile) {
       fetchAndShowArticle(articleId);
    }
  }, [authState.user, profile, handleAnalyzeClick]); // <-- FIX: handleAnalyzeClick is now stable

  // Effect to fetch articles when filters change or on initial load
  useEffect(() => {
    if (!authState.user || !profile) return;

    // --- NEW: Check if current path is NOT a dashboard page ---
    const isFeedPage = location.pathname === '/'; // Only fetch for the main feed

    if (!isFeedPage) return; // Don't fetch if not on the main feed page

    // --- We still set isRefreshing to true to show the spinner on native pull-to-refresh ---
    setIsRefreshing(true); 
    fetchArticles().finally(() => setIsRefreshing(false));

  }, [filters, authState.user, profile, location.pathname, fetchArticles]); // <-- FIX: Added fetchArticles

  // Close sidebar on filter change (for mobile)
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [filters, isSidebarOpen]); 

  // --- DELETED: Pull-to-Refresh Effects ---

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
  };

  // Debounced scroll handler
  useEffect(() => {
    let timeoutId;
    // --- (FIX) Always use `window` for scrolling ---
    const scrollableElement = window; 

    if (!scrollableElement) return;

    const handleScroll = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            // --- (FIX) Simplified scroll logic for `window` ---
            const { scrollHeight, scrollTop, clientHeight } = document.documentElement;

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
        if (scrollableElement) {
          scrollableElement.removeEventListener('scroll', handleScroll);
        }
    };
  }, [loading, displayedArticles, totalArticlesCount, loadMoreArticles]); // <-- FIX: Added loadMoreArticles


  const shareArticle = (article) => {
    axios.post(`${API_URL}/activity/log-share`, { articleId: article._id })
      .then(res => console.log('Share activity logged', res.data))
      .catch(err => console.error('Failed to log share activity', err));

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

  // --- Combined Sidebar Toggle Logic ---
  const toggleSidebar = () => {
    if (isMobileView) { // (FIX) Use isMobileView state
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsDesktopSidebarVisible(!isDesktopSidebarVisible);
    }
  };

  // --- Combined Sidebar Close Logic ---
  const closeSidebar = () => {
    if (isMobileView) { // (FIX) Use isMobileView state
      setIsSidebarOpen(false);
    }
  };

  // --- *** NEW: Save/Unsave Handler *** ---
  const handleToggleSave = async (article) => {
    const articleId = article._id;
    if (!articleId) return;

    // Optimistic UI Update: Update the state immediately
    const newSavedArticleIds = new Set(savedArticleIds);
    if (newSavedArticleIds.has(articleId)) {
      newSavedArticleIds.delete(articleId);
    } else {
      newSavedArticleIds.add(articleId);
    }
    setSavedArticleIds(newSavedArticleIds);

    // Call the backend to sync the change
    try {
      await axios.post(`${API_URL}/articles/${articleId}/save`);
      // Optional: We could re-sync state from response, but optimistic is usually fine
      // const response = await axios.post(`${API_URL}/articles/${articleId}/save`);
      // setSavedArticleIds(new Set(response.data.savedArticles));
    } catch (error) {
      console.error('Failed to toggle save state:', error);
      // Revert UI on error
      const revertedSavedArticleIds = new Set(savedArticleIds);
      if (revertedSavedArticleIds.has(articleId)) {
        revertedSavedArticleIds.delete(articleId);
      } else {
        revertedSavedArticleIds.add(articleId);
      }
      setSavedArticleIds(revertedSavedArticleIds);
      alert('Error saving article. Please try again.');
    }
  };
  // --- *** END NEW *** ---

  // --- Other Activity Logging ---
  const handleCompareClick = (article) => {
    setCompareModal({ open: true, clusterId: article.clusterId, articleTitle: article.headline, articleId: article._id });
    axios.post(`${API_URL}/activity/log-compare`, { articleId: article._id })
      .then(res => console.log('Compare activity logged', res.data))
      .catch(err => console.error('Failed to log compare activity', err));
  };

  const handleReadClick = (article) => {
    axios.post(`${API_URL}/activity/log-read`, { articleId: article._id })
      .then(res => console.log('Read activity logged', res.data))
      .catch(err => console.error('Failed to log read activity', err));

    window.open(article.url, '_blank', 'noopener,noreferrer');
  };
  // --- *** END ACTIVITY LOGGING *** ---


  // --- Main App Render Logic ---

  // 1. Show main loader while checking auth OR profile
  if (authState.isLoading || (authState.user && isProfileLoading)) {
     return (
       <PageLoader />
     );
  }

  // 2. No user? Show Login page
  if (!authState.user) {
    return <Login />;
  }

  // 3. User exists, but no profile?
  // The <CreateProfile> page will be shown by the Router.

  // 4. User and Profile exist! Show the app.
  return (
    <div className="app">
      {/* This Header is now shared by all routes */}
      {profile && (
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          onToggleSidebar={toggleSidebar}
          username={profile.username}
        />
      )}

      {/* --- WRAP ROUTES IN SUSPENSE --- */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* --- Main App Page (Homepage) --- */}
          <Route path="/" element={
            profile ? (
              <>
                <CustomTooltip
                  visible={tooltip.visible}
                  text={tooltip.text}
                  x={tooltip.x}
                  y={tooltip.y}
                />

                <div className={`main-container ${!isDesktopSidebarVisible ? 'desktop-sidebar-hidden' : ''}`}>
                  <div
                    className={`sidebar-mobile-overlay ${isSidebarOpen ? 'open' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  ></div>

                  <Sidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    isOpen={isSidebarOpen}
                    onClose={closeSidebar} 
                    onLogout={handleLogout} 
                  />


                  <main className="content">
                    {/* --- DELETED: Pull to refresh custom UI --- */}

                    {/* --- This spinner is now only for native refresh --- */}
                    <div
                      className="pull-to-refresh-container" // Spinner
                      style={{
                        display: isRefreshing ? 'flex' : 'none',
                        position: 'relative', // No longer absolute
                        marginTop: '-10px', // Pull it up a bit
                        marginBottom: '15px'
                      }}
                    >
                      <div className="spinner-small"></div>
                      <p>Refreshing...</p>
                    </div>

                    <div className="content-scroll-wrapper">
                      {(loading && initialLoad) ? ( // Initial load spinner
                        <div className="loading-container">
                          <div className="spinner"></div>
                          <p>Loading articles...</p>
                        </div>
                      ) : (
                        <>
                          {displayedArticles.length > 0 ? (
                            <div className="articles-grid">
                              {displayedArticles.map((article) => (
                                // --- DELETED: article-card-wrapper ---
                                  <ArticleCard
                                    article={article}
                                    key={article._id || article.url} // Key moved to card
                                    onCompare={() => handleCompareClick(article)}
                                    onAnalyze={handleAnalyzeClick}
                                    onShare={shareArticle}
                                    onRead={handleReadClick}
                                    showTooltip={showTooltip}
                                    // --- *** NEW PROPS *** ---
                                    isSaved={savedArticleIds.has(article._id)}
                                    onToggleSave={() => handleToggleSave(article)}
                                    // --- *** END NEW *** ---
                                  />
                                // --- DELETED: article-card-wrapper ---
                              ))}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
                                <p>No articles found matching your current filters.</p>
                            </div>
                          )}

                          {(loading && !initialLoad) && (
                            // --- DELETED: article-card-wrapper ---
                            <div className="loading-container" style={{ minHeight: '200px', marginTop: '20px' }}>
                              <div className="spinner"></div>
                              <p>Loading more articles...</p>
                            </div>
                          )}

                          {!loading && displayedArticles.length < totalArticlesCount && (
                            // --- DELETED: article-card-wrapper ---
                            <div className="load-more">
                              <button onClick={loadMoreArticles} className="load-more-btn">
                                Load More ({totalArticlesCount - displayedArticles.length} remaining)
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div> {/* --- End content-scroll-wrapper --- */}
                  </main>
                </div>

                {compareModal.open && (
                  <CompareCoverageModal
                    clusterId={compareModal.clusterId}
                    articleTitle={compareModal.articleTitle}
                    onClose={() => setCompareModal({ open: false, clusterId: null, articleTitle: '', articleId: null })}
                    onAnalyze={(article) => {
                      setCompareModal({ open: false, clusterId: null, articleTitle: '', articleId: null });
                      handleAnalyzeClick(article);
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
            ) : (
               <div className="loading-container" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
                 <div className="spinner"></div>
               </div>
            )
          } />

          {/* --- ROUTE FOR PROFILE CREATION --- */}
          <Route path="/create-profile" element={<CreateProfile />} />

          {/* --- DASHBOARD ROUTES --- */}
          <Route path="/my-dashboard" element={ profile ? <MyDashboard theme={theme} /> : null } />
          <Route 
            path="/saved-articles" 
            element={ 
              profile ? (
                <SavedArticles 
                  savedArticleIds={savedArticleIds}
                  onToggleSave={handleToggleSave}
                  onCompare={handleCompareClick}
                  onAnalyze={handleAnalyzeClick}
                  onShare={shareArticle}
                  onRead={handleReadClick}
                  showTooltip={showTooltip}
                /> 
              ) : null 
            } 
          />
          <Route path="/account-settings" element={ profile ? <AccountSettings /> : null } />

        </Routes>
      </Suspense> {/* --- END SUSPENSE WRAPPER --- */}
    </div>
  );
}

// --- Main App component just renders the wrapper ---
function App() {
  return <AppWrapper />;
}

export default App;
