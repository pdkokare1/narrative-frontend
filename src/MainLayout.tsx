import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import '../App.css'; // Global styles often needed for layout
import '../DashboardPages.css';

import useIsMobile from '../hooks/useIsMobile';
import useArticleSave from '../hooks/useArticleSave';
import * as api from '../services/api';

import Header from '../components/Header';
import NewsFeed from '../components/NewsFeed';
import GlobalPlayerBar from '../components/GlobalPlayerBar';
import BottomNav from '../components/ui/BottomNav';
import CustomTooltip from '../components/ui/CustomTooltip';
import PageLoader from '../components/PageLoader';

import { IFilters, IArticle, IUserProfile, INarrative } from '../types';

// --- LAZY LOADED COMPONENTS ---
const MyDashboard = lazy(() => import('../MyDashboard'));
const SavedArticles = lazy(() => import('../SavedArticles'));
const AccountSettings = lazy(() => import('../AccountSettings'));
const SearchResults = lazy(() => import('../SearchResults'));
const EmergencyResources = lazy(() => import('../EmergencyResources'));
const MobileProfileMenu = lazy(() => import('../pages/MobileProfileMenu'));

const CompareCoverageModal = lazy(() => import('../components/modals/CompareCoverageModal'));
const DetailedAnalysisModal = lazy(() => import('../components/modals/DetailedAnalysisModal'));
const FilterModal = lazy(() => import('../components/modals/FilterModal'));

interface MainLayoutProps {
  profile: IUserProfile;
}

export default function MainLayout({ profile }: MainLayoutProps) {
  const isMobileView = useIsMobile();
  
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
  const { savedArticleIds, handleToggleSave } = useArticleSave(profile.savedArticles || []);

  // --- EFFECTS ---
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

  // --- HANDLERS ---
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

  // Dummy placeholder for Narrative click if needed, or you can expand this logic
  const handleOpenNarrative = (narrative: INarrative) => {
      console.log("Open Narrative:", narrative);
  };

  return (
    <div className="app">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        username={profile.username} 
        currentFilters={filters}
      />
      
      <CustomTooltip visible={tooltip.visible} text={tooltip.text} x={tooltip.x} y={tooltip.y} />

      <div className="main-container">
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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
