// src/components/feeds/ForYouFeed.js
import React, { useState, useEffect } from 'react';
import * as api from '../../services/api'; 
import ArticleCard from '../ArticleCard';
import SkeletonCard from '../ui/SkeletonCard';
import { useToast } from '../../context/ToastContext';
import { useRadio } from '../../context/RadioContext';

function ForYouFeed({ 
  onAnalyze, 
  onCompare, 
  savedArticleIds, 
  onToggleSave, 
  showTooltip 
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forYouMeta, setForYouMeta] = useState(null);
  
  const { addToast } = useToast();
  const { startRadio, playSingle, stop, currentArticle, isPlaying } = useRadio();

  useEffect(() => {
    const loadForYou = async () => {
      setLoading(true);
      try {
        const { data } = await api.fetchForYouArticles();
        setArticles(data.articles || []);
        setForYouMeta(data.meta);
      } catch (error) {
        console.error('For You Fetch Error:', error);
        addToast('Failed to load your personalized feed.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadForYou();
  }, [addToast]);

  // --- Handlers ---
  const handleReadClick = (article) => {
    api.logRead(article._id).catch(err => console.error("Log Read Error:", err));
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = (article) => {
    api.logShare(article._id).catch(err => console.error("Log Share Error:", err));
    const shareUrl = `${window.location.origin}?article=${article._id}`;
    if (navigator.share) {
      navigator.share({ title: article.headline, text: `Check this out: ${article.headline}`, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success'));
    }
  };

  return (
    <>
      {/* Meta Header */}
      {forYouMeta && !loading && (
        <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <p>
            Based on your interest in <strong>{forYouMeta.basedOnCategory}</strong>. 
            Showing a mix of {forYouMeta.usualLean} sources and opposing views.
          </p>
        </div>
      )}

      {/* Start Radio Button */}
      {!isPlaying && articles.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
            <button 
                onClick={() => startRadio(articles, 0)} // Start from beginning for curated feed
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <span>▶</span> Start Curated Radio
            </button>
        </div>
      )}

      {/* Articles Grid */}
      <div className="articles-grid">
        {loading ? (
           [...Array(6)].map((_, i) => ( <div className="article-card-wrapper" key={i}><SkeletonCard /></div> ))
        ) : (
           articles.map((article) => (
            <div className="article-card-wrapper" key={article._id || article.url}>
              <ArticleCard
                article={article}
                onCompare={() => onCompare(article)}
                onAnalyze={onAnalyze}
                onShare={() => handleShare(article)}
                onRead={() => handleReadClick(article)}
                showTooltip={showTooltip}
                isSaved={savedArticleIds.has(article._id)}
                onToggleSave={() => onToggleSave(article)}
                isPlaying={currentArticle && currentArticle._id === article._id}
                onPlay={() => playSingle(article)}
                onStop={stop}
              />
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-tertiary)' }}>
            <p>Read more articles to unlock your personalized feed!</p>
        </div>
      )}
    </>
  );
}

export default ForYouFeed;
