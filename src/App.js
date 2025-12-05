// In file: src/App.js
import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import './App.css'; 
import './DashboardPages.css'; 

// --- React Router (FIX: Added 'Link' to imports) ---
import { Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';

// --- Context Providers ---
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';

// --- API Service ---
import * as api from './services/api'; 

// --- Core Components ---
import PageLoader from './components/PageLoader';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ArticleCard from './components/ArticleCard';
import SkeletonCard from './components/ui/SkeletonCard'; 

// --- UI Components ---
import CustomTooltip from './components/ui/CustomTooltip';

// --- Modals ---
import CompareCoverageModal from './components/modals/CompareCoverageModal';
import DetailedAnalysisModal from './components/modals/DetailedAnalysisModal';

// --- Auth Component ---
import Login from './Login';
import CreateProfile from './CreateProfile';

// --- Lazy Pages ---
const MyDashboard = lazy(() => import('./MyDashboard'));
const SavedArticles = lazy(() => import('./SavedArticles'));
const AccountSettings = lazy(() => import('./AccountSettings'));

const isMobile = () => window.innerWidth <= 768;

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

// --- APP ROUTES ---
function AppRoutes() {
  const { user, profile, loading } = useAuth();
  
  // 1. Still loading Auth/Profile? Show Spinner
  if (loading) return <PageLoader />;

  // 2. Not logged in? Show Login Page
  if (!user) return <Login />;

  // 3. Logged in, but NO Profile? 
  // This means they are a new user OR the backend fetch failed.
  // Instead of spinning forever, show the Create Profile screen.
  if (!profile) {
     return <CreateProfile />;
  }

  // 4. Logged in AND has Profile? Show Main App
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* If they go to /create-profile but have one, redirect home */}
        <Route path="/create-profile" element={<Navigate to="/" replace />} />
        <Route path="/*" element={<MainLayout profile={profile} />} />
      </Routes>
    </Suspense>
  );
}

function MainLayout({ profile }) {
  const { logout } = useAuth();
  const { addToast } = useToast();
  
  const [displayedArticles, setDisplayedArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
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

  const contentRef = useRef(null);
  
  const location = useLocation();

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme + '-mode';
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileView(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = useCallback(() => { logout(); }, [logout]);

  const showTooltip = (text, e) => {
    if (!isMobileView || !text) return; 
    e.stopPropagation();
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    if (tooltip.visible && tooltip.text === text) {
      setTooltip({ visible: false, text: '', x: 0, y: 0 });
    } else {
      setTooltip({ visible: true, text, x, y });
    }
  };

  const toggleSidebar = (e) => {
    if (e) e.stopPropagation(); 
    isMobileView ? setIsSidebarOpen(!isSidebarOpen) : setIsDesktopSidebarVisible(!isDesktopSidebarVisible);
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
      if (isSidebarOpen) setIsSidebarOpen(false);
  };

  const handleAnalyzeClick = useCallback((article) => {
    setAnalysisModal({ open: true, article });
    api.logView(article._id).catch(err => console.error("Log View Error:", err));
  }, []);

  const handleCompareClick = (article) => {
    setCompareModal({ open: true, clusterId: article.clusterId, articleTitle: article.headline, articleId: article._id });
    api.logCompare(article._id).catch(err => console.error("Log Compare Error:", err));
  };
  
  const handleReadClick = (article) => {
    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };
  
  const shareArticle = (article) => {
    api.logShare(article._id).catch(err => console.error("Log Share Error:", err));
    const shareUrl = `${window.location.origin}?article=${article._id}`;
    if (navigator.share) {
      navigator.share({ title: article.headline, text: `Check this out: ${article.headline}`, url: shareUrl })
        .catch(() => navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success')));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success'));
    }
  };
  
  const handleToggleSave = useCallback(async (article) => {
    const articleId = article._id;
    const newSavedArticleIds = new Set(savedArticleIds);
    const isSaving = !newSavedArticleIds.has(articleId);
    
    if (isSaving) newSavedArticleIds.add(articleId);
    else newSavedArticleIds.delete(articleId);
    setSavedArticleIds(newSavedArticleIds);

    try {
      await api.saveArticle(articleId);
      addToast(isSaving ? 'Article saved' : 'Article removed', 'success');
    } catch (error) {
      console.error('Save failed:', error);
      addToast('Failed to save article', 'error');
      setSavedArticleIds(prev => {
        const reverted = new Set(prev);
        if (isSaving) reverted.delete(articleId);
        else reverted.add(articleId);
        return reverted;
      });
    }
  }, [savedArticleIds, addToast]);

  const fetchArticles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else { setLoadingArticles(true); setInitialLoad(true); }
    
    try {
      const { data } = await api.fetchArticles({ ...filters, limit: 12, offset: 0 });
      setTotalArticlesCount(data.pagination?.total || 0);
      setDisplayedArticles(data.articles || []);
    } catch (error) {
      console.error('Fetch error:', error);
      addToast('Failed to load articles. Check connection.', 'error');
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else { setLoadingArticles(false); setInitialLoad(false); }
    }
  }, [filters, addToast]); 

  const loadMoreArticles = useCallback(async () => {
    if (loadingArticles || isRefreshing || displayedArticles.length >= totalArticlesCount) return; 
    setLoadingArticles(true); 
    
    try {
      const { data } = await api.fetchArticles({ ...filters, limit: 12, offset: displayedArticles.length });
      setTotalArticlesCount(data.pagination?.total || 0);
      setDisplayedArticles(prev => [...prev, ...data.articles]);
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoadingArticles(false);
    }
  }, [loadingArticles, isRefreshing, displayedArticles.length, totalArticlesCount, filters]); 

  useEffect(() => {
    if (location.pathname === '/') fetchArticles(false); 
  }, [filters, location.pathname, fetchArticles]); 

  return (
    <div className="app">
      <Header theme={theme} toggleTheme={toggleTheme} onToggleSidebar={toggleSidebar} username={profile.username} />
      <CustomTooltip visible={tooltip.visible} text={tooltip.text} x={tooltip.x} y={tooltip.y} />

      <div className={`main-container ${!isDesktopSidebarVisible ? 'desktop-sidebar-hidden' : ''}`}>
        <div className={`sidebar-mobile-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

        <Sidebar filters={filters} onFilterChange={handleFilterChange} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} />

        <Routes>
          <Route path="/" element={
            <NewsFeed
              contentRef={contentRef}
              isRefreshing={isRefreshing}
              loading={loadingArticles}
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
          } />
          <Route path="/my-dashboard" element={<MyDashboard theme={theme} />} />
          <Route path="/saved-articles" element={ 
              <SavedArticles 
                onToggleSave={handleToggleSave}
                onCompare={handleCompareClick}
                onAnalyze={handleAnalyzeClick}
                onShare={shareArticle}
                onRead={handleReadClick}
                showTooltip={showTooltip}
              /> 
          } />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="*" element={<PageNotFound />} /> 
        </Routes>
      </div>

      {compareModal.open && <CompareCoverageModal clusterId={compareModal.clusterId} articleTitle={compareModal.articleTitle} onClose={() => setCompareModal({ ...compareModal, open: false })} onAnalyze={handleAnalyzeClick} showTooltip={showTooltip} />}
      {analysisModal.open && <DetailedAnalysisModal article={analysisModal.article} onClose={() => setAnalysisModal({ ...analysisModal, open: false })} showTooltip={showTooltip} />}
    </div>
  );
}

function NewsFeed({
  contentRef, isRefreshing, loading, initialLoad, displayedArticles, 
  totalArticlesCount, loadMoreArticles, handleCompareClick, handleAnalyzeClick,
  shareArticle, handleReadClick, showTooltip, savedArticleIds, handleToggleSave
}) {
  return (
    <main className="content" ref={contentRef}>
      <div className="pull-to-refresh-container" style={{ display: isRefreshing ? 'flex' : 'none' }}>
        <div className="spinner-small"></div><p>Refreshing...</p>
      </div>

      {(loading && initialLoad) ? (
        <div className="articles-grid">
           {[...Array(6)].map((_, i) => (
             <div className="article-card-wrapper" key={i}>
                <SkeletonCard />
             </div>
           ))}
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
              <div className="loading-container" style={{ minHeight: '100px' }}>
                <div className="spinner-small"></div>
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
    </main>
  );
}

function PageNotFound() {
  return (
    <main className="content" style={{ justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <h2>404 - Page Not Found</h2>
        {/* Link is used here, so it must be imported at the top */}
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>Back to Articles</Link>
      </div>
    </main>
  );
}

export default App;
