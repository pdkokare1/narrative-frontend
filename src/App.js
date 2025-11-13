// In file: src/App.js
// --- *** HAMBURGER GLITCH FIX: Stop click propagation in toggleSidebar *** ---
// --- *** BUG FIX: Lock body scroll on mobile menu open *** ---
// --- *** APP CHECK FIX (v3) - Using Promise signal *** ---
// --- *** TYPO FIX in loadMoreArticles *** ---
// --- *** APP CHECK FIX (v2) - Solves race condition *** ---
// --- FINAL FIX: Separated initial fetch from loadMore to kill infinite loop ---
// --- BUG FIX: Removed 'profile' from profile-checking useEffect dependency array ---
// --- BUG FIX: Removed duplicate state/ref for user menu (now handled in Header.js) ---
import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import axios from 'axios';
import './App.css'; // Main CSS
import './DashboardPages.css'; // --- Import dashboard styles ---

// --- React Router imports ---
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// --- Firebase Auth Imports ---
import { onAuthStateChanged, signOut } from "firebase/auth";
// --- *** APP CHECK FIX (v3): Import appCheck AND appCheckReady *** ---
import { auth, appCheck, appCheckReady } from './firebaseConfig'; // Import our configured auth, appCheck, AND the new signal
import { getToken } from "firebase/app-check"; // Import getToken
// --- *** END FIX *** ---
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


// --- *** APP CHECK FIX (v2) *** ---
// We set up the Axios interceptor *outside* the component.
// This guarantees it runs ONCE when the app loads, before any requests are made.
axios.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      // 1. Get the User Auth token (proves *who* you are)
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      
      // 2. Get the App Check token (proves your *app* is real)
      if (appCheck) {
        try {
          const appCheckTokenResponse = await getToken(appCheck, /* forceRefresh= */ false);
          config.headers['X-Firebase-AppCheck'] = appCheckTokenResponse.token;
        } catch (err) {
          console.error('Failed to get App Check token for axios request:', err);
          // Don't attach header if it fails
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// --- *** END OF FIX *** ---


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

  // --- *** BUG FIX: Lock body scroll when mobile menu is open *** ---
  useEffect(() => {
    // This effect is for the *other* glitch (scrolling behind the menu)
    // We can keep it as it's a good feature to have.
    if (isMobileView && isSidebarOpen) {
      document.body.classList.add('sidebar-open-mobile');
    } else {
      document.body.classList.remove('sidebar-open-mobile');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('sidebar-open-mobile');
    };
  }, [isSidebarOpen, isMobileView]); // Run when open state or mobile view changes
  // --- *** END OF BUG FIX *** ---

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
      setIsProfileLoading(true); // Always set loading to true when we check
      
      const checkProfile = async () => {
        try {
          // --- *** APP CHECK FIX (v3) *** ---
          await appCheckReady;
          console.log("App Check is ready, proceeding to fetch profile.");
          // --- *** END FIX *** ---

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
  }, [authState.user, navigate, location.pathname]);
  // --- END OF FIX ---

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
  }, [filters, handleLogout]); 

  const loadMoreArticles = useCallback(async () => {
    if (loading || isRefreshing || displayedArticles.length >= totalArticlesCount) return; 
    setLoading(true); 
    
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
  }, [loading, isRefreshing, displayedArticles.length, totalArticlesCount, filters]); 
  // --- *** END OF ARTICLE FETCH FIX *** ---

  
  useEffect(() => {
    if (!authState.user || !profile) return; 
    const isFeedPage = location.pathname === '/'; 
    if (!isFeedPage) return; 

    fetchArticles(false); 
  }, [filters, authState.user, profile, location.pathname, fetchArticles]); 

  const handleAnalyzeClick = useCallback((article) => {
    setAnalysisModal({ open: true, article });
    axios.post(`${API_URL}/activity/log-view`, { articleId: article._id })
      .then(res => console.log('Activity logged', res.data))
      .catch(err => console.error('Failed to log activity', err));
  }, []);

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
              clusterCount: Number(article.clusterCount) || 1 
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


  // --- *** THIS IS THE FIX (from last time) *** ---
  // This code now *only* runs when 'filters' changes.
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    // --- *** THIS IS THE NEW FIX (for the build error) *** ---
    // This line tells Vercel's build server to ignore the "missing dependency" warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); // <-- We are *intentionally* not listing isSidebarOpen here
  // --- *** END OF FIX *** ---

  
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

  // --- *** THIS IS THE HAMBURGER GLITCH FIX *** ---
  // --- Combined Sidebar Toggle Logic ---
  const toggleSidebar = (e) => {
    // This stops the click from "bubbling" up to the overlay
    if (e) e.stopPropagation(); 
    
    if (isMobileView) { // (FIX) Use isMobileView state
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsDesktopSidebarVisible(!isDesktopSidebarVisible);
    }
  };
  // --- *** END OF FIX *** ---

  // --- Combined Sidebar Close Logic ---
  const closeSidebar = () => {
    if (isMobileView) { // (FIX) Use isLobileView state
      setIsSidebarOpen(false);
    }
  };

  const handleToggleSave = async (article) => {
    const articleId = article._id;
    if (!articleId) return;

    const newSavedArticleIds = new Set(savedArticleIds);
    if (newSavedArticleIds.has(articleId)) {
      newSavedArticleIds.delete(articleId);
    } else {
      newSavedArticleIds.add(articleId);
    }
    setSavedArticleIds(newSavedArticleIds);

    try {
      await axios.post(`${API_URL}/articles/${articleId}/save`);
    } catch (error) {
      console.error('Failed to toggle save state:', error);
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


  // --- Main App Render Logic ---

  if (authState.isLoading || (authState.user && isProfileLoading)) {
     return (
       <PageLoader />
     );
  }

  if (!authState.user) {
    return <Login />;
  }

  return (
    <div className="app">
      {profile && (
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          onToggleSidebar={toggleSidebar}
          username={profile.username}
        />
      )}

      {/* --- *** THIS IS THE TYPO FIX *** --- */}
      <Suspense fallback={<PageLoader />}>
      {/* --- *** END OF FIX *** --- */}
        <Routes>
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
      </Suspense> 
    </div>
  );
}

function App() {
  return <AppWrapper />;
}

export default App;
