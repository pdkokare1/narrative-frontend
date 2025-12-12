// In file: src/App.js
import React, { useState, useEffect, Suspense, lazy, useCallback, useRef } from 'react'; // Added useRef
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

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
import BottomNav from './components/ui/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';

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

// --- Initialize Query Client ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      gcTime: 1000 * 60 * 30,   
      retry: 1,                 
      refetchOnWindowFocus: false, 
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RadioProvider> 
            <ErrorBoundary>
               <AppRoutes />
            </ErrorBoundary>
          </RadioProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// --- Routing Logic ---
function AppRoutes() {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!user) return <Login />;
  
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

// --- Main Layout ---
function MainLayout({ profile }) {
  const { logout } = useAuth();
  const { addToast } = useToast();
  const isMobileView = useIsMobile();

  // --- Global State ---
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium'); 

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
  
  // Tracks saved articles locally
  const [savedArticleIds, setSavedArticleIds] = useState(new Set(profile.savedArticles || []));
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  // --- NEW: Pending Deletes Ref (Stores timeouts) ---
  const pendingDeletesRef = useRef(new Map());

  // --- Theme & Font Management ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.className = `${savedTheme}-mode font-${fontSize}`;
    } else {
      const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = userPrefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.body.className = `${initialTheme}-mode font-${fontSize}`;
    }

    const savedFont = localStorage.getItem('fontSize');
    if (savedFont) {
        setFontSize(savedFont);
        document.body.classList.remove('font-medium', 'font-large', 'font-xl');
        document.body.classList.add(`font-${savedFont}`);
    }
  }, []);

  useEffect(() => {
      document.body.classList.remove('font-medium', 'font-large', 'font-xl');
      document.body.classList.add(`font-${fontSize}`);
      localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = `${newTheme}-mode font-${fontSize}`;
    localStorage.setItem('theme', newTheme);
  };

  // --- Handlers ---
  const handleLogout = useCallback(() => { logout(); }, [logout]);

  const toggleSidebar = (e) => {
    if (e) e.stopPropagation(); 
    isMobileView ? setIsSidebarOpen(!isSidebarOpen) : setIsDesktopSidebarVisible(!isDesktopSidebarVisible);
  };

  const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
      if (isSidebarOpen) setIsSidebarOpen(false);
  };

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
  
  // --- UPDATED: Save Handler with Undo Logic ---
  const handleToggleSave = useCallback(async (article) => {
    const articleId = article._id;
    const isCurrentlySaved = savedArticleIds.has(articleId);

    if (isCurrentlySaved) {
        // --- UNSAVE ACTION (With Delay) ---
        
        // 1. Optimistic UI: Remove immediately
        setSavedArticleIds(prev => {
            const next = new Set(prev);
            next.delete(articleId);
            return next;
        });

        // 2. Set Delayed Server Call
        const timeoutId = setTimeout(async () => {
            try {
                await api.saveArticle(articleId);
                pendingDeletesRef.current.delete(articleId);
            } catch (error) {
                console.error('Unsave failed:', error);
                // Revert UI on error
                setSavedArticleIds(prev => new Set(prev).add(articleId));
            }
        }, 3500); // 3.5 seconds delay

        pendingDeletesRef.current.set(articleId, timeoutId);

        // 3. Show Undo Toast
        addToast('Article removed', 'info', {
            label: 'UNDO',
            onClick: () => {
                // User clicked UNDO
                clearTimeout(timeoutId);
                pendingDeletesRef.current.delete(articleId);
                
                // Add back to UI immediately
                setSavedArticleIds(prev => new Set(prev).add(articleId));
            }
        });

    } else {
        // --- SAVE ACTION (Immediate) ---
        
        // Check if there was a pending delete for this item and cancel it
        if (pendingDeletesRef.current.has(articleId)) {
            clearTimeout(pendingDeletesRef.current.get(articleId));
            pendingDeletesRef.current.delete(articleId);
        }

        setSavedArticleIds(prev => new Set(prev).add(articleId));

        try {
            await api.saveArticle(articleId);
            addToast('Article saved', 'success');
        } catch (error) {
            console.error('Save failed:', error);
            setSavedArticleIds(prev => {
                const next = new Set(prev);
                next.delete(articleId);
                return next;
            });
            addToast('Failed to save article', 'error');
        }
    }
  }, [savedArticleIds, addToast]);

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
          
          <Route path="/account-settings" element={
            <AccountSettings 
                currentFontSize={fontSize} 
                onSetFontSize={setFontSize} 
            />
          } />
          
          <Route path="*" element={<PageNotFound />} /> 
        </Routes>
      </div>

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

      <BottomNav />
      <GlobalPlayerBar />
    </div>
  );
}

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
