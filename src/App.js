// In file: src/App.js
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';

// --- Styles ---
import './App.css'; 
import './DashboardPages.css'; 

// --- Context Providers ---
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { RadioProvider } from './context/RadioContext'; 

// --- Custom Hooks ---
import useIsMobile from './hooks/useIsMobile';

// --- API Service ---
import * as api from './services/api'; 

// --- Core Components ---
import PageLoader from './components/PageLoader';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NewsFeed from './components/NewsFeed'; 
import GlobalPlayerBar from './components/GlobalPlayerBar'; 
// REMOVED: InstallPrompt import

// --- UI Components ---
import CustomTooltip from './components/ui/CustomTooltip';

// --- Modals ---
import CompareCoverageModal from './components/modals/CompareCoverageModal';
import DetailedAnalysisModal from './components/modals/DetailedAnalysisModal';

// --- Auth Components ---
import Login from './Login';
import CreateProfile from './CreateProfile';

// --- Lazy Loaded Pages (Performance) ---
const MyDashboard = lazy(() => import('./MyDashboard'));
const SavedArticles = lazy(() => import('./SavedArticles'));
const AccountSettings = lazy(() => import('./AccountSettings'));
const SearchResults = lazy(() => import('./SearchResults')); 
const EmergencyResources = lazy(() => import('./EmergencyResources'));

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RadioProvider> 
           <AppRoutes />
        </RadioProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

// --- Routing Logic ---
function AppRoutes() {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!user) return <Login />;
  
  // Force profile creation if authenticated but no profile exists
  if (!profile) {
     return <CreateProfile />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/create-profile" element={<Navigate to="/" replace />} />
        <Route path="/*" element={<MainLayout profile={profile} />} />
      </Routes>
    </Suspense>
  );
}

// --- Main Layout (Header + Sidebar + Content) ---
function MainLayout({ profile }) {
  const { logout } = useAuth();
  const { addToast } = useToast();
  
  // Responsive Hook
  const isMobileView = useIsMobile();

  // --- Global State ---
  const [theme, setTheme] = useState('dark');
  const [filters, setFilters] = useState({
    category: 'All Categories',
    lean: 'All Leans',
    quality: 'All Quality Levels',
    sort: 'Latest First',
    region: 'Global',
    articleType: 'All Types'
  });
  
  // --- UI State ---
  const [compareModal, setCompareModal] = useState({ open: false, clusterId: null, articleTitle: '', articleId: null });
  const [analysisModal, setAnalysisModal] = useState({ open: false, article: null });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(true);
  
  // Tracks saved articles locally for instant UI updates
  const [savedArticleIds, setSavedArticleIds] = useState(new Set(profile.savedArticles || []));
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  // --- Theme Management (System Detection) ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.className = savedTheme + '-mode';
    } else {
      // Auto-detect system preference
      const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = userPrefersDark ? 'dark' : 'light';
      
      setTheme(initialTheme);
      document.body.className = initialTheme + '-mode';
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };

  // --- Layout Handlers ---
  const handleLogout = useCallback(() => { logout(); }, [logout]);

  const toggleSidebar = (e) => {
    if (e) e.stopPropagation(); 
    isMobileView ? setIsSidebarOpen(!isSidebarOpen) : setIsDesktopSidebarVisible(!isDesktopSidebarVisible);
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
      if (isSidebarOpen) setIsSidebarOpen(false);
  };

  // --- Tooltip Handler (Mobile) ---
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

  // --- Action Handlers ---
  const handleAnalyzeClick = useCallback((article) => {
    setAnalysisModal({ open: true, article });
    api.logView(article._id).catch(err => console.error("Log View Error:", err));
  }, []);

  const handleCompareClick = useCallback((article) => {
    setCompareModal({ 
      open: true, 
      clusterId: article.clusterId, 
      articleTitle: article.headline, 
      articleId: article._id 
    });
    api.logCompare(article._id).catch(err => console.error("Log Compare Error:", err));
  }, []);
  
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
      // Revert on failure
      setSavedArticleIds(prev => {
        const reverted = new Set(prev);
        if (isSaving) reverted.delete(articleId);
        else reverted.add(articleId);
        return reverted;
      });
    }
  }, [savedArticleIds, addToast]);

  // --- Render ---
  return (
    <div className="app">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onToggleSidebar={toggleSidebar} 
        username={profile.username} 
      />
      
      <CustomTooltip visible={tooltip.visible} text={tooltip.text} x={tooltip.x} y={tooltip.y} />

      <div className={`main-container ${!isDesktopSidebarVisible ? 'desktop-sidebar-hidden' : ''}`}>
        {/* Mobile Overlay */}
        <div 
          className={`sidebar-mobile-overlay ${isSidebarOpen ? 'open' : ''}`} 
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <Sidebar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onLogout={handleLogout} 
        />

        <Routes>
          <Route path="/" element={
            <NewsFeed
              filters={filters}
              onFilterChange={handleFilterChange} 
              onAnalyze={handleAnalyzeClick}
              onCompare={handleCompareClick}
              savedArticleIds={savedArticleIds}
              onToggleSave={handleToggleSave}
              showTooltip={showTooltip}
            />
          } />
          
          <Route path="/search" element={ 
            <SearchResults 
              onAnalyze={handleAnalyzeClick}
              onCompare={handleCompareClick}
              savedArticleIds={savedArticleIds}
              onToggleSave={handleToggleSave}
              showTooltip={showTooltip}
            /> 
          } />

          <Route path="/my-dashboard" element={<MyDashboard theme={theme} />} />
          
          <Route path="/saved-articles" element={ 
              <SavedArticles 
                onToggleSave={handleToggleSave}
                onCompare={handleCompareClick}
                onAnalyze={handleAnalyzeClick}
                onShare={() => {}} 
                onRead={() => {}} 
                showTooltip={showTooltip}
              /> 
          } />

          <Route path="/emergency-resources" element={<EmergencyResources />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="*" element={<PageNotFound />} /> 
        </Routes>
      </div>

      {/* Global Modals */}
      {compareModal.open && (
        <CompareCoverageModal 
          clusterId={compareModal.clusterId} 
          articleTitle={compareModal.articleTitle} 
          onClose={() => setCompareModal({ ...compareModal, open: false })} 
          onAnalyze={handleAnalyzeClick} 
          showTooltip={showTooltip} 
        />
      )}
      
      {analysisModal.open && (
        <DetailedAnalysisModal 
          article={analysisModal.article} 
          onClose={() => setAnalysisModal({ ...analysisModal, open: false })} 
          showTooltip={showTooltip} 
        />
      )}

      {/* REMOVED: InstallPrompt */}
      <GlobalPlayerBar />
    </div>
  );
}

// --- 404 Page ---
function PageNotFound() {
  return (
    <main className="content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <h2>404 - Page Not Found</h2>
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', marginTop: '20px' }}>Back to Articles</Link>
      </div>
    </main>
  );
}

export default App;
