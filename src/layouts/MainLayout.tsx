// src/layouts/MainLayout.tsx
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

import '../App.css'; 
import '../DashboardPages.css';

import useIsMobile from '../hooks/useIsMobile';
import useArticleSave from '../hooks/useArticleSave';
import usePWAInstall from '../hooks/usePWAInstall'; // NEW: Import Install Hook
import * as api from '../services/api';

import Header from '../components/Header';
import NewsFeed from '../components/NewsFeed';
import GlobalPlayerBar from '../components/GlobalPlayerBar';
import BottomNav from '../components/ui/BottomNav';
import CustomTooltip from '../components/ui/CustomTooltip';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../context/AuthContext'; 
import { useToast } from '../context/ToastContext'; // NEW: Import Toast for the Pop-Up

import { IFilters, IArticle, IUserProfile, INarrative } from '../types';

// --- LAZY LOADED COMPONENTS ---
const MyDashboard = lazy(() => import('../MyDashboard'));
const SavedArticles = lazy(() => import('../SavedArticles'));
const AccountSettings = lazy(() => import('../AccountSettings'));
const SearchResults = lazy(() => import('../SearchResults'));
const EmergencyResources = lazy(() => import('../EmergencyResources'));
const MobileProfileMenu = lazy(() => import('../pages/MobileProfileMenu'));
const Legal = lazy(() => import('../pages/Legal'));

const CompareCoverageModal = lazy(() => import('../components/modals/CompareCoverageModal'));
const DetailedAnalysisModal = lazy(() => import('../components/modals/DetailedAnalysisModal'));
const FilterModal = lazy(() => import('../components/modals/FilterModal'));

// Protected Route Wrapper for inner routes
const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

interface MainLayoutProps {
  profile: IUserProfile | null; 
}

export default function MainLayout({ profile }: MainLayoutProps) {
  const isMobileView = useIsMobile();
  
  // --- NEW: PWA Logic ---
  const { isInstallable, triggerInstall } = usePWAInstall();
  const { addToast } = useToast();
  // State to ensure we only show the popup once per session
  const [installToastShown, setInstallToastShown] = useState(false);

  // --- THEME & FONT STATE ---
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');

  // --- FILTER STATE ---
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<IFilters>({
    category: 'All Categories',
    lean: 'All Leans',
    quality: 'All Quality Levels',
    sort: 'Latest First',
    region: 'Global',
    articleType: 'All Types'
  });

  // --- MODAL STATE ---
  const [compareModal, setCompareModal] = useState<{ open: boolean; clusterId: number | null; articleTitle: string; articleId: string | null }>({ open: false, clusterId: null, articleTitle: '', articleId: null });
  const [analysisModal, setAnalysisModal] = useState<{ open: boolean; article: IArticle | null }>({ open: false, article: null });
  
  // --- TOOLTIP STATE ---
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  // --- LOGIC HOOKS ---
  const { savedArticleIds, handleToggleSave } = useArticleSave(profile?.savedArticles || []);

  // --- EFFECTS ---

  // NEW: PWA Install Pop-Up Logic
  useEffect(() => {
    // Wait a moment after load to be polite
    const timer = setTimeout(() => {
      // Don't show if already shown, or if not mobile
      if (installToastShown || !isMobileView) return;

      // Check if app is already running in "Standalone" (App Mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone) return;

      // 1. ANDROID / DESKTOP (If browser says it's installable)
      if (isInstallable) {
        addToast('Install The Gamut for a better experience', 'info', {
          label: 'Install App',
          onClick: () => {
             triggerInstall();
             setInstallToastShown(true);
          }
        });
        setInstallToastShown(true);
      } 
      // 2. iOS (If on iPhone but not installed)
      else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
         addToast('To install: Tap Share button below → Add to Home Screen', 'info');
         setInstallToastShown(true);
      }

    }, 3000); // 3-second delay so it doesn't pop up instantly

    return () => clearTimeout(timer);
  }, [isInstallable, isMobileView, installToastShown, addToast, triggerInstall]);


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(userPrefersDark ? 'dark' : 'light');
    }

    const savedFont = localStorage.getItem('fontSize');
    if (savedFont) {
        setFontSize(savedFont);
    }
  }, []);

  useEffect(() => {
      document.body.className = `${theme}-mode font-${fontSize}`;
      localStorage.setItem('theme', theme);
      localStorage.setItem('fontSize', fontSize);
  }, [theme, fontSize]);

  // --- HANDLERS ---
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleFilterChange = (newFilters: IFilters) => {
      setFilters(newFilters);
  };

  const showTooltip = (text: string, e: React.MouseEvent) => {
    if (!isMobileView || !text) return; 
    e.stopPropagation();
    // @ts-ignore
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    // @ts-ignore
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    
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

  return (
    <div className="app">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        username={profile?.username || 'Guest'} 
        currentFilters={filters}
      />
      
      <CustomTooltip visible={tooltip.visible} text={tooltip.text} x={tooltip.x} y={tooltip.y} />

      <div className="main-container">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* PUBLIC ROUTES */}
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
            <Route path="/emergency-resources" element={<EmergencyResources />} />
            <Route path="/legal" element={<Legal />} />

            {/* PROTECTED ROUTES */}
            <Route path="/my-dashboard" element={<RequireAuth><MyDashboard /></RequireAuth>} />
            <Route path="/saved-articles" element={ 
                <RequireAuth>
                  <SavedArticles 
                    onToggleSave={handleToggleSave}
                    onCompare={handleCompareClick}
                    onAnalyze={handleAnalyzeClick}
                    onShare={() => {}} 
                    onRead={() => {}} 
                    showTooltip={showTooltip}
                  /> 
                </RequireAuth>
            } />
            <Route path="/account-settings" element={
              <RequireAuth>
                <AccountSettings 
                    currentFontSize={fontSize} 
                    onSetFontSize={setFontSize} 
                />
              </RequireAuth>
            } />
            <Route path="/profile-menu" element={<RequireAuth><MobileProfileMenu /></RequireAuth>} />
            
            <Route path="*" element={<PageNotFound />} /> 
          </Routes>
        </Suspense>
      </div>

      <Suspense fallback={null}>
        {compareModal.open && (
          <CompareCoverageModal 
            open={compareModal.open}
            articleId={compareModal.articleId}
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
        {showFilterModal && (
            <FilterModal 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                onClose={() => setShowFilterModal(false)} 
            />
        )}
      </Suspense>

      <BottomNav 
        currentFilters={filters} 
        onOpenFilters={() => setShowFilterModal(true)} 
      />
      
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
