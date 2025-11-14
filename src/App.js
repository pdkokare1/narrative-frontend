// In file: src/App.js
// --- REWRITE: Created a new <MainLayout> component to wrap all pages ---
// --- FIX: This ensures Header/Sidebar/Modals are on *all* pages ---
// --- FIX: This makes snap-scrolling work on /saved-articles ---
// --- FIX: Removed 'content-router-outlet' logic ---
// --- BUILD FIX (v2): Corrected 'newTheme' typo in theme useEffect ---
import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import axios from 'axios';
import './App.css'; // Main CSS
import './DashboardPages.css'; // --- Import dashboard styles ---

// --- React Router imports ---
import { Routes, Route, useNavigate, useLocation, Outlet, Link } from 'react-router-dom'; // <-- 'Link' is imported

// --- Firebase Auth Imports ---
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, appCheck, appCheckReady } from './firebaseConfig'; 
import { getToken } from "firebase/app-check"; 
import Login from './Login'; // Import the Login component
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

const isMobile = () => window.innerWidth <= 768;


// --- Axios Interceptor (Runs once) ---
axios.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      
      if (appCheck) {
        try {
          const appCheckTokenResponse = await getToken(appCheck, /* forceRefresh= */ false);
          config.headers['X-Firebase-AppCheck'] = appCheckTokenResponse.token;
        } catch (err) {
          console.error('Failed to get App Check token for axios request:', err);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// --- *** END OF INTERCEPTOR *** ---


// --- AppWrapper (Manages Auth) ---
function AppWrapper() {
  const [authState, setAuthState] = useState({
    isLoading: true,
    user: null,
  });
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // --- Auth Listener ---
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

  // --- Profile Checker ---
  useEffect(() => {
    if (authState.user) {
      setIsProfileLoading(true); 
      
      const checkProfile = async () => {
        try {
          await appCheckReady;
          console.log("App Check is ready, proceeding to fetch profile.");

          const response = await axios.get(`${API_URL}/profile/me`);
          setProfile(response.data);
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
        } finally {
          setIsProfileLoading(false);
        }
      };
      checkProfile();
    }
  }, [authState.user, navigate, location.pathname]);

  // --- Loading / Login Screens ---
  if (authState.isLoading || (authState.user && isProfileLoading)) {
     return <PageLoader />;
  }
  if (!authState.user) {
    return <Login />;
  }
  if (!profile) {
     // We are logged in, but profile fetch failed or is redirecting
     // (CreateProfile route is handled below)
     const isCreateProfilePage = location.pathname === '/create-profile';
     if (isCreateProfilePage) {
       return <CreateProfile />; // Show create profile page
     }
     // Show a loader or error while we wait for profile redirect
     return <PageLoader />;
  }

  // --- User is logged in AND has a profile, show the main app ---
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/create-profile" element={<CreateProfile />} />
        
        {/* --- *** THIS IS THE FIX *** --- */}
        {/* All other routes render inside the MainLayout */}
        <Route 
          path="/*" 
          element={<MainLayout profile={profile} />} 
        />
        {/* --- *** END OF FIX *** --- */}
      </Routes>
    </Suspense>
  );
}
// --- *** END OF AppWrapper *** ---


// --- *** NEW: MainLayout Component *** ---
// This component contains the Header, Sidebar, Modals, and the <Outlet />
// The <Outlet /> is where React Router will render the specific page
// (e.g., NewsFeed, MyDashboard, SavedArticles)
function MainLayout({ profile }) {
  // --- States moved from AppWrapper ---
  const [displayedArticles, setDisplayedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const [isMobileView, setIsMobileView] = useState(isMobile());
  const [savedArticleIds, setSavedArticleIds] = useState(new Set(profile.savedArticles || []));
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  // --- Refs for Pull-to-Refresh ---
  const contentRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const pullThreshold = 120;
  
  const location = useLocation();

  // --- Handlers (moved from AppWrapper) ---
  const handleLogout = useCallback(() => {
    signOut(auth).catch((error) => {
      console.error('Logout Error:', error);
    });
  }, []);

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

  const hideTooltip = useCallback(() => {
    setTooltip((prevTooltip) => {
      if (prevTooltip.visible) {
        return { ...prevTooltip, visible: false };
      }
      return prevTooltip;
    });
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
  };
  
  const toggleSidebar = (e) => {
    if (e) e.stopPropagation(); 
    if (isMobileView) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsDesktopSidebarVisible(!isDesktopSidebarVisible);
    }
  };

  const closeSidebar = () => {
    if (isMobileView) {
      setIsSidebarOpen(false);
    }
  };

  const handleAnalyzeClick = useCallback((article) => {
    setAnalysisModal({ open: true, article });
    axios.post(`${API_URL}/activity/log-view`, { articleId: article._id })
      .then(res => console.log('Activity logged', res.data))
      .catch(err => console.error('Failed to log activity', err));
  }, []);

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
  
  const shareArticle = (article) => {
    axios.post(`${API_URL}/activity/log-share`, { articleId: article._id })
      .then(res => console.log('Share activity logged', res.data))
      .catch(err => console.error('Failed to log share activity', err));
    const appUrl = window.location.origin;
    const shareUrl = `${appUrl}?article=${article._id}`;
    const shareTitle = article.headline;
    const shareText = `Check out this analysis on The Gamut: ${article.headline}`;
    if (navigator.share) {
      navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
        .catch((error) => navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!')));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!'));
    }
  };
  
  const handleToggleSave = useCallback(async (article) => {
    const articleId = article._id;
    if (!articleId) return;
    const newSavedArticleIds = new Set(savedArticleIds);
    let isSaving = false;
    if (newSavedArticleIds.has(articleId)) {
      newSavedArticleIds.delete(articleId);
    } else {
      newSavedArticleIds.add(articleId);
      isSaving = true;
    }
    setSavedArticleIds(newSavedArticleIds);
    try {
      await axios.post(`${API_URL}/articles/${articleId}/save`);
    } catch (error) {
      console.error('Failed to toggle save state:', error);
      const revertedSavedArticleIds = new Set(savedArticleIds);
      if (isSaving) {
        revertedSavedArticleIds.delete(articleId);
      } else {
        revertedSavedArticleIds.add(articleId);
      }
      setSavedArticleIds(revertedSavedArticleIds);
      alert('Error saving article. Please try again.');
    }
  }, [savedArticleIds]);


  // --- Article Fetching Logic ---
  const fetchArticles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else { setLoading(true); setInitialLoad(true); }
    
    const queryParams = { ...filters, limit: 12, offset: 0 };
    try {
      const response = await axios.get(`${API_URL}/articles`, { params: queryParams });
      setTotalArticlesCount(response.data.pagination?.total || 0);
      const processedArticles = (response.data.articles || []).map(article => ({
        ...article,
        _id: article._id || article.url,
        headline: article.headline || 'No Headline',
        summary: article.summary || 'No summary.',
      }));
      setDisplayedArticles(processedArticles);
    } catch (error) {
      console.error('❌ Error fetching articles:', error);
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else { setLoading(false); setInitialLoad(false); }
    }
  }, [filters]); 

  const loadMoreArticles = useCallback(async () => {
    if (loading || isRefreshing || displayedArticles.length >= totalArticlesCount) return; 
    setLoading(true); 
    
    const queryParams = { ...filters, limit: 12, offset: displayedArticles.length };
    try {
      const response = await axios.get(`${API_URL}/articles`, { params: queryParams });
      setTotalArticlesCount(response.data.pagination?.total || 0);
      const newArticles = (response.data.articles || []).map(article => ({
        ...article,
        _id: article._id || article.url,
        headline: article.headline || 'No Headline',
        summary: article.summary || 'No summary.',
      }));
      
      setDisplayedArticles(prev => {
        const currentUrls = new Set(prev.map(a => a.url));
        const trulyNew = newArticles.filter(a => !currentUrls.has(a.url));
        return [...prev, ...trulyNew];
      });
    } catch (error) {
      console.error('❌ Error loading more articles:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, isRefreshing, displayedArticles.length, totalArticlesCount, filters]); 

  // --- Effects (moved from AppWrapper) ---
  useEffect(() => { // Set theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    // --- *** THIS IS THE FIX *** ---
    setTheme(savedTheme);
    document.body.className = savedTheme + '-mode';
    // --- *** END OF FIX *** ---
  }, []);

  useEffect(() => { // Handle window resize
    const handleResize = () => setIsMobileView(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); 

  useEffect(() => { // Body scroll lock
    if (isMobileView && isSidebarOpen) {
      document.body.classList.add('sidebar-open-mobile');
    } else {
      document.body.classList.remove('sidebar-open-mobile');
    }
    return () => document.body.classList.remove('sidebar-open-mobile');
  }, [isSidebarOpen, isMobileView]);
  
  useEffect(() => { // Tooltip click-outside
    const handleClickOutside = (e) => {
      if (tooltip.visible && !e.target.closest('.tooltip-custom')) {
        hideTooltip();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [tooltip.visible, hideTooltip]);

  useEffect(() => { // Close sidebar on filter change
    if (isSidebarOpen) closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  
  useEffect(() => { // Initial article fetch (only on main feed)
    if (location.pathname === '/') {
      fetchArticles(false); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, location.pathname, fetchArticles]); 

  useEffect(() => { // Handle shared article URL
    const fetchAndShowArticle = async (id) => {
      if (!id || !/^[a-f\d]{24}$/i.test(id)) return;
      try {
        const response = await axios.get(`${API_URL}/articles/${id}`);
        if (response.data) handleAnalyzeClick(response.data);
      } catch (error) {
        console.error('Failed to fetch shared article:', error);
      }
    };
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    if (articleId) fetchAndShowArticle(articleId);
  }, [handleAnalyzeClick]);
  
  // --- Pull to Refresh handlers ---
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || !isMobileView || location.pathname !== '/') return; // Only on feed
    const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; touchEndY.current = e.touches[0].clientY; };
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
        fetchArticles(true); 
      }
      setPullDistance(0);
    };
    contentEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    contentEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    contentEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      if (contentEl) {
         contentEl.removeEventListener('touchstart', handleTouchStart);
         contentEl.removeEventListener('touchmove', handleTouchMove);
         contentEl.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isRefreshing, pullDistance, contentRef, pullThreshold, isMobileView, fetchArticles, location.pathname]); 

  // --- Infinite Scroll handler ---
  useEffect(() => {
    let timeoutId;
    const scrollableElement = isMobileView ? contentRef.current : window;
    if (!scrollableElement || location.pathname !== '/') return; // Only on feed
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
        if (scrollableElement) scrollableElement.removeEventListener('scroll', handleScroll);
    };
  }, [loading, displayedArticles.length, totalArticlesCount, contentRef, isMobileView, loadMoreArticles, location.pathname]); 

  // --- Main Layout Render ---
  return (
    <div className="app">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onToggleSidebar={toggleSidebar}
        username={profile.username}
      />
      
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

        {/* --- *** THIS IS THE FIX *** --- */}
        {/* The <Outlet> renders the matched child route */}
        {/* We pass all handlers and state down to the children */}
        <Routes>
          <Route 
            path="/" 
            element={
              <NewsFeed
                contentRef={contentRef}
                pullDistance={pullDistance}
                pullThreshold={pullThreshold}
                isRefreshing={isRefreshing}
                loading={loading}
                initialLoad={initialLoad}
                displayedArticles={displayedArticles}
                totalArticlesCount={totalArticlesCount}
                loadMoreArticles={loadMoreArticles}
                handleCompareClick={handleCompareClick}
                handleAnalyzeClick={handleAnalyzeClick}
                shareArticle={shareArticle}
                handleReadClick={handleReadClick}
                showTooltip={showTooltip}
                savedArticleIds={savedArticleIds}
                handleToggleSave={handleToggleSave}
              />
            } 
          />
          <Route path="/my-dashboard" element={<MyDashboard theme={theme} />} />
          <Route 
            path="/saved-articles" 
            element={ 
              <SavedArticles 
                onToggleSave={handleToggleSave}
                onCompare={handleCompareClick}
                onAnalyze={handleAnalyzeClick}
                onShare={shareArticle}
                onRead={handleReadClick}
                showTooltip={showTooltip}
              /> 
            } 
          />
          <Route path="/account-settings" element={<AccountSettings />} />
          
          {/* Fallback for any other route inside the layout */}
          <Route path="*" element={<PageNotFound />} /> 
        </Routes>
        {/* --- *** END OF FIX *** --- */}
        
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
    </div>
  );
}
// --- *** END OF MainLayout *** ---


// --- *** NEW: NewsFeed Component *** ---
// This contains the JSX for the main article feed, 
// which was previously in AppWrapper
function NewsFeed({
  contentRef, pullDistance, pullThreshold, isRefreshing,
  loading, initialLoad, displayedArticles, totalArticlesCount,
  loadMoreArticles, handleCompareClick, handleAnalyzeClick,
  shareArticle, handleReadClick, showTooltip,
  savedArticleIds, handleToggleSave
}) {
  return (
    <main className="content" ref={contentRef}>
      <div
        className="pull-indicator"
        style={{ opacity: Math.min(pullDistance / pullThreshold, 1) }}
      >
        <span
          className="pull-indicator-arrow"
          style={{ transform: `rotate(${pullDistance > pullThreshold ? '180deg' : '0deg'})`}}
        >↓</span>
        <span>{pullDistance > pullThreshold ? 'Release to refresh' : 'Pull to refresh'}</span>
      </div>

      <div
        className="pull-to-refresh-container"
        style={{ display: isRefreshing ? 'flex' : 'none' }}
      >
        <div className="spinner-small"></div>
        <p>Refreshing...</p>
      </div>

      {/* --- *** THIS IS THE FIX *** --- */}
      {/* Removed the 'content-scroll-wrapper' div. */}
      {/* The article grid is now a direct child of 'main.content' */}
      
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
                    onCompare={() => handleCompareClick(article)}
                    onAnalyze={handleAnalyzeClick}
                    onShare={shareArticle}
                    onRead={handleReadClick}
                    showTooltip={showTooltip}
                    isSaved={savedArticleIds.has(article._id)}
                    onToggleSave={() => handleToggleSave(article)}
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
      {/* --- *** END OF FIX *** --- */}
    </main>
  );
}
// --- *** END of NewsFeed *** ---

// --- *** NEW: PageNotFound Component *** ---
function PageNotFound() {
  return (
    <main className="content" style={{ justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>
          Back to Articles
        </Link>
      </div>
    </main>
  );
}

// --- Renamed App to AppContainer ---
function AppContainer() {
  return <AppWrapper />;
}

export default AppContainer;
