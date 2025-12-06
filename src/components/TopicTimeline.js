// src/components/TopicTimeline.js
import React from 'react';
import '../App.css'; 

function TopicTimeline({ clusterData }) {
  if (!clusterData) return null;

  // 1. Merge all articles into a single array
  const allArticles = [
    ...(clusterData.left || []),
    ...(clusterData.center || []),
    ...(clusterData.right || []),
    ...(clusterData.reviews || [])
  ];

  if (allArticles.length === 0) {
    return <p className="no-data-msg">No articles available for timeline.</p>;
  }

  // 2. Sort by Date (Newest first)
  const sortedArticles = allArticles.sort((a, b) => 
    new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  // 3. Format Date Helper
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="timeline-container">
      {sortedArticles.map((article, index) => (
        <div key={article._id || index} className="timeline-item">
          {/* Dot Color based on Lean */}
          <div className={`timeline-dot ${article.politicalLean || 'Neutral'}`}></div>
          
          <div className="timeline-content">
            <span className="timeline-date">{formatDate(article.publishedAt)}</span>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="timeline-headline">
              {article.headline}
            </a>
            <div className="timeline-meta">
              <span style={{ fontWeight: '600' }}>{article.source}</span>
              <span>•</span>
              <span className={article.politicalLean !== 'Not Applicable' ? 'accent-text' : ''}>
                {article.politicalLean}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TopicTimeline;
