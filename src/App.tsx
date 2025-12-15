// src/App.tsx
import React, { useState, useEffect, Suspense, lazy, useCallback, useRef } from 'react'; 
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

import './App.css'; 
import './DashboardPages.css'; 

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { RadioProvider } from './context/RadioContext'; 

import useIsMobile from './hooks/useIsMobile';
import * as api from './services/api'; 

import PageLoader from './components/PageLoader';
import Header from './components/Header';
// REMOVED SIDEBAR IMPORT
import NewsFeed from './components/NewsFeed'; 
import GlobalPlayerBar from './components/GlobalPlayerBar'; 
import BottomNav from './components/ui/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import CustomTooltip from './components/ui/CustomTooltip';

import Login from './Login';
import CreateProfile from './CreateProfile';
import { IFilters, IArticle, IUserProfile } from './types';

// --- LAZY LOADED COMPONENTS ---
const MyDashboard = lazy(() => import('./MyDashboard'));
const SavedArticles = lazy(() => import('./SavedArticles'));
const AccountSettings = lazy(() => import('./AccountSettings'));
const SearchResults = lazy(() => import('./SearchResults')); 
const EmergencyResources = lazy(() => import('./EmergencyResources'));
const MobileProfileMenu = lazy(() => import('./MobileProfileMenu')); // Ensure this exists

const CompareCoverageModal = lazy(() => import('./components/modals/CompareCoverageModal'));
const DetailedAnalysisModal = lazy(() => import('./components/modals/DetailedAnalysisModal'));

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

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Login />;
  if (!profile) return <CreateProfile />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/create-profile" element={<Navigate to="/" replace />} />
        <Route path="/*" element={<MainLayout profile={profile} />} />
      </Routes>
    </Suspense>
  );
}

interface MainLayoutProps {
  profile: IUserProfile;
}

function MainLayout({ profile }: MainLayoutProps) {
  const { addToast } = useToast();
  const isMobileView = useIsMobile();

  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium'); 

  const [filters, setFilters] = useState<IFilters>({
    category: 'All Categories',
    lean: 'All Leans',
    quality: 'All Quality Levels',
    sort: 'Latest First',
    region: 'Global',
    articleType: 'All Types'
  });
  
  const [compareModal, setCompareModal] = useState<{ open: boolean; clusterId: number | null; articleTitle: string; articleId: string | null }>({ open: false, clusterId: null, articleTitle: '', articleId: null });
  const [analysisModal, setAnalysisModal] = useState<{ open: boolean; article: IArticle | null }>({ open: false, article: null });
  
  // REMOVED SIDEBAR STATE
  
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set(profile.savedArticles || []));
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  const pendingDeletesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
  }, [fontSize]);

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

  const handleFilterChange = (newFilters: IFilters) => {
      setFilters(newFilters);
  };

  const showTooltip = (text: string, e: React.MouseEvent) => {
    if (!isMobileView || !text) return; 
    e.stopPropagation();
    const x = e.clientX || (e as any).touches?.[0]?.clientX;
    const y = e.clientY || (e as any).touches?.[0]?.clientY;
    
    if (tooltip.visible && tooltip.text === text) {
      setTooltip({ visible: false, text: '', x: 0, y: 0 });
    } else {
      setTooltip({ visible: true, text, x, y });
    }
  };

  const handleAnalyzeClick = useCallback((article: IArticle) => {
    setAnalysisModal({ open: true, article });
    api.logView(article._id).catch(err => console.error("Log View Error:", err));
  }, []);

  const handleCompareClick = useCallback((article: IArticle) => {
    setCompareModal({ 
      open: true, 
      clusterId: article.clusterId || null, 
      articleTitle: article.headline, 
      articleId: article._id 
    });
    api.logCompare(article._id).catch(err => console.error("Log Compare Error:", err));
  }, []);
  
  const handleToggleSave = useCallback(async (article: IArticle) => {
    const articleId = article._id;
    const isCurrentlySaved = savedArticleIds.has(articleId);

    if (isCurrentlySaved) {
        setSavedArticleIds(prev => {
            const next = new Set(prev);
            next.delete(articleId);
            return next;
        });

        const timeoutId = setTimeout(async () => {
            try {
                await api.saveArticle(articleId);
                pendingDeletesRef.current.delete(articleId);
            } catch (error) {
                console.error('Unsave failed:', error);
                setSavedArticleIds(prev => new Set(prev).add(articleId));
            }
        }, 3500);

        pendingDeletesRef.current.set(articleId, timeoutId);

        addToast('Article removed', 'info', {
            label: 'UNDO',
            onClick: () => {
                clearTimeout(timeoutId);
                pendingDeletesRef.current.delete(articleId);
                setSavedArticleIds(prev => new Set(prev).add(articleId));
            }
        });

    } else {
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
        username={profile.username} 
      />
      
      <CustomTooltip visible={tooltip.visible} text={tooltip.text} x={tooltip.x} y={tooltip.y} />

      {/* Main container logic simplified: No sidebar means no conditional class */}
      <div className="main-container">
        
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

          <Route path="/profile-menu" element={<MobileProfileMenu />} />
          
          <Route path="*" element={<PageNotFound />} /> 
        </Routes>
      </div>

      <Suspense fallback={null}>
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
      </Suspense>

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
