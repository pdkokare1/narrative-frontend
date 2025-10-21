import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [articles, setArticles] = useState([]);
  const [displayedArticles, setDisplayedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [filters, setFilters] = useState({
    category: 'All Categories',
    lean: 'All Leans',
    quality: 'All Quality Levels',
    sort: 'Latest First'
  });
  const [compareModal, setCompareModal] = useState({ open: false, clusterId: null });
  const [analysisModal, setAnalysisModal] = useState({ open: false, article: null });

  useEffect(() => {
    fetchArticles();
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme + '-mode';
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/articles`, {
        params: { ...filters, limit: 100 }
      });
      
      const articlesData = response.data.articles || response.data;
      
      // Remove duplicates by URL
      const uniqueArticles = articlesData.filter((article, index, self) =>
        index === self.findIndex((a) => a.url === article.url)
      );
      
      setArticles(uniqueArticles);
      setDisplayedArticles(uniqueArticles.slice(0, 12));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setLoading(false);
    }
  };

  const loadMoreArticles = () => {
    const currentLength = displayedArticles.length;
    const moreArticles = articles.slice(currentLength, currentLength + 12);
    setDisplayedArticles([...displayedArticles, ...moreArticles]);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
  };

  const applyFilters = () => {
    fetchArticles();
  };

  const shareArticle = (article) => {
    if (navigator.share) {
      navigator.share({
        title: article.headline,
        text: article.summary,
        url: article.url
      }).catch(() => {
        // Fallback if share fails
        navigator.clipboard.writeText(article.url);
        alert('Link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(article.url);
      alert('Link copied to clipboard!');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        if (displayedArticles.length < articles.length && !loading) {
          loadMoreArticles();
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedArticles, articles, loading]);

  return (
    <div className="app">
      <Header theme={theme} toggleTheme={toggleTheme} />
      
      <div className="main-container">
        <Sidebar 
          filters={filters}
          onFilterChange={setFilters}
          onApply={applyFilters}
          articleCount={articles.length}
        />
        
        <main className="content">
          <div className="content-header">
            <h2>Latest News Analysis</h2>
            <p className="subtitle">{articles.length} articles analyzed with AI</p>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : (
            <>
              <div className="articles-grid">
                {displayedArticles.map((article, index) => (
                  <ArticleCard
                    key={article._id || index}
                    article={article}
                    onCompare={(clusterId) => setCompareModal({ open: true, clusterId })}
                    onAnalyze={(article) => setAnalysisModal({ open: true, article })}
                    onShare={shareArticle}
                  />
                ))}
              </div>
              
              {displayedArticles.length < articles.length && (
                <div className="load-more">
                  <button onClick={loadMoreArticles} className="load-more-btn">
                    Load More Articles ({articles.length - displayedArticles.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      
      {compareModal.open && (
        <CompareCoverageModal
          clusterId={compareModal.clusterId}
          onClose={() => setCompareModal({ open: false, clusterId: null })}
          onAnalyze={(article) => {
            setCompareModal({ open: false, clusterId: null });
            setAnalysisModal({ open: true, article });
          }}
        />
      )}
      
      {analysisModal.open && (
        <DetailedAnalysisModal
          article={analysisModal.article}
          onClose={() => setAnalysisModal({ open: false, article: null })}
        />
      )}
    </div>
  );
}

// Header Component
function Header({ theme, toggleTheme }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1>The Narrative</h1>
        <p>Multi-Perspective News Analysis</p>
      </div>
      
      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}

// Sidebar Component
function Sidebar({ filters, onFilterChange, onApply, articleCount }) {
  const categories = ['All Categories', 'Politics', 'Economy', 'Technology', 'Health', 'Environment', 'Justice', 'Education', 'Entertainment', 'Sports'];
  const leans = ['All Leans', 'Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right'];
  const qualityLevels = ['All Quality Levels', 'A+ Premium (90-100)', 'A High (80-89)', 'B Professional (70-79)', 'C Acceptable (60-69)', 'D-F Poor (0-59)'];
  const sortOptions = ['Latest First', 'Highest Quality', 'Most Covered', 'Lowest Bias'];

  return (
    <aside className="sidebar">
      <div className="filter-section">
        <h3>Categories</h3>
        <select value={filters.category} onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      
      <div className="filter-section">
        <h3>Political Leaning</h3>
        <select value={filters.lean} onChange={(e) => onFilterChange({ ...filters, lean: e.target.value })}>
          {leans.map(lean => <option key={lean} value={lean}>{lean}</option>)}
        </select>
      </div>
      
      <div className="filter-section">
        <h3>Quality Level</h3>
        <select value={filters.quality} onChange={(e) => onFilterChange({ ...filters, quality: e.target.value })}>
          {qualityLevels.map(level => <option key={level} value={level}>{level}</option>)}
        </select>
      </div>
      
      <div className="filter-section">
        <h3>Sort By</h3>
        <select value={filters.sort} onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}>
          {sortOptions.map(sort => <option key={sort} value={sort}>{sort}</option>)}
        </select>
      </div>
      
      <button className="apply-filters-btn" onClick={onApply}>Apply Filters</button>
      
      {articleCount > 0 && (
        <div className="filter-results">
          <p>Showing {articleCount} articles</p>
        </div>
      )}
    </aside>
  );
}

// Article Card Component
function ArticleCard({ article, onCompare, onAnalyze, onShare }) {
  // Ensure we have all the data
  const biasScore = article.biasScore || 0;
  const trustScore = article.trustScore || 0;
  const credibilityGrade = article.credibilityGrade || 'N/A';
  const headline = article.headline || article.title || 'No headline';
  const summary = article.summary || article.description || 'No summary available';
  
  return (
    <div className="article-card">
      <div className="article-image">
        {article.imageUrl ? (
          <img 
            src={article.imageUrl} 
            alt={headline} 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }} 
          />
        ) : null}
        <div className="image-placeholder" style={{display: article.imageUrl ? 'none' : 'flex'}}>
          📰
        </div>
      </div>
      
      <div className="article-content">
        <h3 className="article-headline">{headline}</h3>
        <p className="article-summary">{summary}</p>
        
        <div className="article-meta">
          <span className="source">{article.source || 'Unknown Source'}</span>
          <span className={`lean-badge lean-${(article.politicalLean || 'center').toLowerCase().replace(' ', '-')}`}>
            {article.politicalLean || 'Center'}
          </span>
        </div>
        
        <div className="quality-display">
          <div className="quality-item">
            <span className="label">Bias</span>
            <span className={`value bias-${getBiasClass(biasScore)}`}>{biasScore}</span>
          </div>
          <div className="quality-item">
            <span className="label">Trust</span>
            <span className={`value trust-${getTrustClass(trustScore)}`}>{trustScore}</span>
          </div>
          <div className="quality-item">
            <span className="label">Grade</span>
            <span className={`grade grade-${credibilityGrade.replace('+', 'plus').replace('-', 'minus')}`}>
              {credibilityGrade}
            </span>
          </div>
        </div>
        
        <div className="article-actions">
          <button onClick={() => onAnalyze(article)} className="btn-secondary" title="View detailed analysis">
            📊 Analysis
          </button>
          <button onClick={() => onCompare(article.clusterId || 1)} className="btn-secondary" title="Compare coverage">
            🔍 Compare
          </button>
          <button onClick={() => onShare(article)} className="btn-secondary" title="Share article">
            📤 Share
          </button>
          <button onClick={() => window.open(article.url, '_blank')} className="btn-primary" title="Read full article">
            Read Article
          </button>
        </div>
      </div>
    </div>
  );
}

function getBiasClass(score) {
  if (score < 30) return 'low';
  if (score < 60) return 'moderate';
  if (score < 80) return 'high';
  return 'extreme';
}

function getTrustClass(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'high';
  if (score >= 70) return 'good';
  if (score >= 60) return 'acceptable';
  return 'poor';
}

// Compare Coverage Modal Component  
function CompareCoverageModal({ clusterId, onClose, onAnalyze }) {
  const [articles, setArticles] = useState({ left: [], center: [], right: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchCluster();
  }, [clusterId]);

  const fetchCluster = async () => {
    try {
      const response = await axios.get(`${API_URL}/cluster/${clusterId}`);
      setArticles(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cluster:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const totalArticles = articles.left.length + articles.center.length + articles.right.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Compare Coverage - Cluster {clusterId}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-tabs">
          <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
            All ({totalArticles})
          </button>
          <button className={activeTab === 'left' ? 'active' : ''} onClick={() => setActiveTab('left')}>
            🔴 Left ({articles.left.length})
          </button>
          <button className={activeTab === 'center' ? 'active' : ''} onClick={() => setActiveTab('center')}>
            ⚪ Center ({articles.center.length})
          </button>
          <button className={activeTab === 'right' ? 'active' : ''} onClick={() => setActiveTab('right')}>
            🔵 Right ({articles.right.length})
          </button>
        </div>
        
        <div className="modal-body">
          {(activeTab === 'all' || activeTab === 'left') && renderArticleGroup(articles.left, 'Left', onAnalyze)}
          {(activeTab === 'all' || activeTab === 'center') && renderArticleGroup(articles.center, 'Center', onAnalyze)}
          {(activeTab === 'all' || activeTab === 'right') && renderArticleGroup(articles.right, 'Right', onAnalyze)}
          
          {totalArticles === 0 && (
            <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)'}}>
              No articles found for this cluster.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderArticleGroup(articleList, perspective, onAnalyze) {
  if (articleList.length === 0) return null;
  
  return (
    <div className="perspective-section">
      <h3 className={`perspective-title ${perspective.toLowerCase()}`}>{perspective} Perspective</h3>
      {articleList.map(article => (
        <div key={article._id} className="coverage-article">
          <h4>{article.headline || article.title}</h4>
          <p style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4}}>
            {(article.summary || '').substring(0, 150)}...
          </p>
          <div className="article-scores">
            <span>Bias: {article.biasScore}</span>
            <span>Trust: {article.trustScore}</span>
            <span className={`grade grade-${(article.credibilityGrade || 'N/A').replace('+','plus').replace('-','minus')}`}>
              {article.credibilityGrade || 'N/A'}
            </span>
          </div>
          <div className="coverage-actions">
            <button onClick={() => window.open(article.url, '_blank')}>Read Article</button>
            <button onClick={() => onAnalyze(article)}>View Analysis</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Detailed Analysis Modal Component
function DetailedAnalysisModal({ article, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detailed Analysis</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={activeTab === 'bias' ? 'active' : ''} onClick={() => setActiveTab('bias')}>
            Bias Details
          </button>
          <button className={activeTab === 'credibility' ? 'active' : ''} onClick={() => setActiveTab('credibility')}>
            Credibility
          </button>
          <button className={activeTab === 'reliability' ? 'active' : ''} onClick={() => setActiveTab('reliability')}>
            Reliability
          </button>
        </div>
        
        <div className="modal-content">
          {activeTab === 'overview' && <OverviewTab article={article} />}
          {activeTab === 'bias' && <BiasTab article={article} />}
          {activeTab === 'credibility' && <CredibilityTab article={article} />}
          {activeTab === 'reliability' && <ReliabilityTab article={article} />}
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} style={{padding: '8px 20px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ article }) {
  return (
    <div className="tab-content">
      <div className="overview-grid">
        <ScoreBox label="Trust Score" value={article.trustScore || 0} />
        <ScoreBox label="Bias Score" value={article.biasScore || 0} />
        <ScoreBox label="Credibility" value={article.credibilityScore || 0} />
        <ScoreBox label="Reliability" value={article.reliabilityScore || 0} />
      </div>
      
      {article.keyFindings && article.keyFindings.length > 0 && (
        <div className="recommendations">
          <h4>Key Findings</h4>
          <ul>
            {article.keyFindings.map((finding, i) => <li key={i}>{finding}</li>)}
          </ul>
        </div>
      )}
      
      {article.recommendations && article.recommendations.length > 0 && (
        <div className="recommendations" style={{marginTop: '12px'}}>
          <h4>Recommendations</h4>
          <ul>
            {article.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function BiasTab({ article }) {
  const components = article.biasComponents || {};
  return (
    <div className="tab-content">
      <h3 style={{fontSize: '16px', marginBottom: '16px'}}>
        Bias Analysis: {article.biasScore || 0}/100 ({article.biasLabel || 'N/A'})
      </h3>
      {Object.keys(components).length > 0 ? (
        Object.entries(components).map(([category, values]) => (
          <div key={category} className="component-section">
            <h4>{category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}</h4>
            {Object.entries(values || {}).map(([key, val]) => (
              <ProgressBar key={key} label={key.replace(/([A-Z])/g, ' $1')} value={val || 0} />
            ))}
          </div>
        ))
      ) : (
        <p style={{color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px'}}>
          Detailed bias components not available for this article.
        </p>
      )}
    </div>
  );
}

function CredibilityTab({ article }) {
  const components = article.credibilityComponents || {};
  return (
    <div className="tab-content">
      <h3 style={{fontSize: '16px', marginBottom: '16px'}}>
        Credibility: {article.credibilityScore || 0}/100 (Grade: {article.credibilityGrade || 'N/A'})
      </h3>
      {Object.keys(components).length > 0 ? (
        Object.entries(components).map(([key, val]) => (
          <ProgressBar key={key} label={key.replace(/([A-Z])/g, ' $1')} value={val || 0} />
        ))
      ) : (
        <p style={{color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px'}}>
          Detailed credibility data not available for this article.
        </p>
      )}
    </div>
  );
}

function ReliabilityTab({ article }) {
  const components = article.reliabilityComponents || {};
  return (
    <div className="tab-content">
      <h3 style={{fontSize: '16px', marginBottom: '16px'}}>
        Reliability: {article.reliabilityScore || 0}/100 (Grade: {article.reliabilityGrade || 'N/A'})
      </h3>
      {Object.keys(components).length > 0 ? (
        Object.entries(components).map(([key, val]) => (
          <ProgressBar key={key} label={key.replace(/([A-Z])/g, ' $1')} value={val || 0} />
        ))
      ) : (
        <p style={{color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px'}}>
          Detailed reliability data not available for this article.
        </p>
      )}
    </div>
  );
}

function ScoreBox({ label, value }) {
  return (
    <div className="score-circle">
      <div className="score-value">{value}</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div className="progress-bar-container">
      <span className="progress-label">{label}</span>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value}%` }}></div>
      </div>
      <span className="progress-value">{value}</span>
    </div>
  );
}

export default App;
