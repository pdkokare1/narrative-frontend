// In file: src/App.js
// --- FINAL FIX: Separated initial fetch from loadMore to kill infinite loop ---
// --- BUG FIX: Removed 'profile' from profile-checking useEffect dependency array ---
import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
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
  const [isProfileLoading, setIsProfileLoading] = useState(true); // Start as true

  // --- Router hooks ---
  const navigate = useNavigate();
  const location = useLocation(); // To check which page we are on

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

  // --- Refs for Pull-to-Refresh ---
  const contentRef = useRef(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const pullThreshold = 120;

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

  const hideTooltip = useCallback(() => {
    setTooltip((prevTooltip) => {
      if (prevTooltip.visible) {
        return { ...prevTooltip, visible: false };
      }
      return prevTooltip;
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltip.visible && !e.target.closest('.tooltip-custom')) {
        hideTooltip();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [tooltip.visible, hideTooltip]);
  // --- End Tooltip Handlers ---


  // --- Firebase Auth Listener Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState({ isLoading: false, user: user });
      } else {
        setAuthState({ isLoading: false, user: null });
        setProfile(null);
        setIsProfileLoading(false); // No user, so profile isn't loading
      }
    });
    return () => unsubscribe();
  }, []);

  // --- *** PROFILE CHECK LOOP FIX *** ---
  useEffect(() => {
    if (authState.user) {
      // --- REMOVED this block, as it was part of the loop problem ---
      // if (!profile) {
      //   setIsProfileLoading(true);
      // }
      // --- END REMOVAL ---
      setIsProfileLoading(true); // Always set loading to true when we check
      
      const checkProfile = async () => {
        try {
          const response = await axios.get(`${API_URL}/profile/me`);
          setProfile(response.data);
          setSavedArticleIds(new Set(response.data.savedArticles || []));
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
    // --- THIS IS THE FIX ---
    // Removed 'profile' from this array to stop the infinite loop
  }, [authState.user, navigate, location.pathname]);
  // --- END OF FIX ---


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


  const handleLogout = useCallback(() => {
    signOut(auth).catch((error) => {
      console.error('Logout Error:', error);
    });
  }, []);

  // --- *** ARTICLE FETCH LOOP FIX *** ---
  // This function is for *initial load* or *filter change* ONLY
  const fetchArticles = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setInitialLoad(true);
    }
    
    const limit = 12;
    const offset = 0; // Always 0 for a new fetch
    const queryParams = { ...filters, limit, offset };

    try {
      const response = await axios.get(`${API_URL}/articles`, { params: queryParams });
      const articlesData = response.data.articles || [];
      const paginationData = response.data.pagination || { total: 0 };
      setTotalArticlesCount(paginationData.total || 0);

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
            clusterCount: Number(article.clusterCount) || 1
        }));
      
      setDisplayedArticles(uniqueNewArticles); // Overwrite list
    } catch (error) {
      console.error('❌ Error fetching articles:', error.response ? error.response.data : error.message);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
         console.error("Auth token invalid, logging out.");
         handleLogout();
      }
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  }, [filters, handleLogout]); // This function is STABLE and only depends on filters

  // This function is for *loading more* ONLY
  const loadMoreArticles = useCallback(async () => {
    // Read length at the *moment of the call*
    if (loading || isRefreshing || displayedArticles.length >= totalArticlesCount) return; 
    setLoading(true); // Show bottom loader
    
    const limit = 12;
    const offset = displayedArticles.length; // Use current length
    const queryParams = { ...filters, limit, offset };

    try {
      const response = await axios.get(`${API_URL}/articles`, { params: queryParams });
      const articlesData = response.data.articles || [];
      const paginationData = response.data.pagination || { total: 0 };
      setTotalArticlesCount(paginationData.total || 0);

      const uniqueNewArticles = articlesData
        .filter(article => article && article.url)
        .map(article => ({
            // ... (data cleaning as before) ...
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
            clusterCount: Number(article.clusterCount) || 1
        }));
      
      // Use the functional update to append articles
      setDisplayedArticles(prevDisplayedArticles => {
        const currentUrls = new Set(prevDisplayedArticles.map(a => a.url));
        const trulyNewArticles = uniqueNewArticles.filter(a => !currentUrls.has(a.url));
        return [...prevDisplayedArticles, ...trulyNewArticles];
      });
    } catch (error) {
      console.error('❌ Error loading more articles:', error.response ? error.response.data : error.message);
    } finally {
      setLoading(false);
    }
  }, [loading, isRefreshing, displayedArticles.length, totalArticlesCount, filters]); // This is stable
  // --- *** END OF ARTICLE FETCH FIX *** ---

  
  // This hook fetches articles when filters, profile, or path changes.
  useEffect(() => {
    if (!authState.user || !profile) return; // Don't fetch if no profile

    const isFeedPage = location.pathname === '/'; // Only fetch for the main feed
    if (!isFeedPage) return; // Don't fetch if not on the main feed page

    fetchArticles(false); // Call the initial load function
  }, [filters, authState.user, profile, location.pathname, fetchArticles]); 

  const handleAnalyzeClick = useCallback((article) => {
    setAnalysisModal({ open: true, article });
    axios.post(`${API_URL}/activity/log-view`, { articleId: article._id })
      .then(res => console.log('Activity logged', res.data))
      .catch(err => console.error('Failed to log activity', err));
  }, []);

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
  }, [authState.user, profile, handleAnalyzeClick]);


  // Close sidebar on filter change (for mobile)
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [filters, isSidebarOpen]);

  
  // Pull-to-refresh
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl || !isMobileView) return;

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
        fetchArticles(true); // Call fetchArticles with "isRefresh = true"
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
  }, [isRefreshing, pullDistance, contentRef, pullThreshold, isMobileView, fetchArticles]); 


  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
  };

  // Infinite scroll listener
  useEffect(() => {
    let timeoutId;
    const scrollableElement = isMobileView ? contentRef.current : window;
    if (!scrollableElement) return;

    const handleScroll = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const isWindow = scrollableElement === window;
            const scrollHeight = isWindow ? document.body.offsetHeight : scrollableElement.scrollHeight;
            const scrollTop = isWindow ? window.scrollY : scrollableElement.scrollTop;
            const clientHeight = isWindow ? window.innerHeight : scrollableElement.clientHeight;

            if (clientHeight + scrollTop >= scrollHeight - 800) {
                // This logic is now safe because loadMoreArticles is stable
                if (!loading && displayedArticles.length < totalArticlesCount) {
                    loadMoreArticles(); // Call the stable loadMore function
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
  }, [loading, displayedArticles.length, totalArticlesCount, contentRef, isMobileView, loadMoreArticles]); 


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
    if (isMobileView) { // (FIX) Use isLobileView state
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


  // --- Activity Logging ---
  // handleAnalyzeClick is defined above for the share link effect
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
  // The `isProfileLoading` is now false, so PageLoader is hidden.
  // The Router will show the <CreateProfile> page.

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
                      className="pull-to-refresh-container" // Spinner
                      style={{
                        display: isRefreshing ? 'flex' : 'none'
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
                                <div className="article-card-wrapper" key={article._id || article.url}>
                                  <ArticleCard
                                    article={article}
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
               // This renders if user is logged in but profile is null
               // (e.g., after a 429 error)
               <div className="loading-container" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingTop: '60px' }}>
                 <p style={{color: 'var(--text-tertiary)', maxWidth: '300px', textAlign: 'center'}}>
                   Could not load your profile. You may be rate-limited.
                   Please wait 15 minutes and refresh the page.
                 </p>
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
