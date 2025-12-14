// src/components/NewsFeed.tsx
import React, { useState } from 'react';
import UnifiedFeed from './feeds/UnifiedFeed';
import InFocusBar from './InFocusBar';
import { IArticle, IFilters } from '../types';
import './NewsFeed.css';

interface NewsFeedProps {
  filters: IFilters;
  onFilterChange: (f: IFilters) => void;
  onAnalyze: (article: IArticle) => void;
  onCompare: (article: IArticle) => void;
  savedArticleIds: Set<string>;
  onToggleSave: (article: IArticle) => void;
  showTooltip: (text: string, e: React.MouseEvent) => void;
}

const NewsFeed: React.FC<NewsFeedProps> = (props) => {
  const [feedMode, setFeedMode] = useState<'latest' | 'foryou' | 'personalized'>('latest');

  return (
    <div className="news-feed-container">
      {/* 1. Trending Topics Bar */}
      <InFocusBar />

      {/* 2. Feed Toggles (Tabs) */}
      <div className="feed-header-row">
        <h1 className="feed-main-title">Headlines</h1>
        <div className="feed-toggle-container">
          <button 
            className={`feed-toggle-btn ${feedMode === 'latest' ? 'active' : ''}`}
            onClick={() => setFeedMode('latest')}
          >
            Latest
          </button>
          <button 
            className={`feed-toggle-btn ${feedMode === 'foryou' ? 'active' : ''}`}
            onClick={() => setFeedMode('foryou')}
          >
            Balanced
          </button>
          <button 
            className={`feed-toggle-btn ${feedMode === 'personalized' ? 'active' : ''}`}
            onClick={() => setFeedMode('personalized')}
          >
            My Mix
          </button>
        </div>
      </div>

      {/* 3. The Unified Feed (Handles Infinite Scroll & Content) */}
      <div className="feed-content-wrapper">
        <UnifiedFeed 
          mode={feedMode}
          {...props}
        />
      </div>
    </div>
  );
};

export default NewsFeed;
