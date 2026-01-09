// src/components/TopicTimeline.tsx
import React from 'react';
import { format } from 'date-fns';
import './TopicTimeline.css'; // Import the new specific styles
import { IArticle } from '../types';

interface ClusterData {
  left: IArticle[];
  center: IArticle[];
  right: IArticle[];
  reviews: IArticle[];
  others?: IArticle[]; // Added to catch unclassified/neutral articles
}

interface TopicTimelineProps {
  clusterData: ClusterData | null;
}

const TopicTimeline: React.FC<TopicTimelineProps> = ({ clusterData }) => {
  if (!clusterData) return null;

  // 1. Merge all articles into a single array
  // Included 'others' to ensure no data is hidden from the user
  const allArticles = [
    ...(clusterData.left || []),
    ...(clusterData.center || []),
    ...(clusterData.right || []),
    ...(clusterData.reviews || []),
    ...(clusterData.others || [])
  ];

  if (allArticles.length === 0) {
    return <p className="no-data-msg">No articles available for timeline.</p>;
  }

  // 2. Sort by Date (Newest first)
  const sortedArticles = allArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="timeline-container">
      {/* The Visual Spine of the timeline */}
      <div className="timeline-line" />

      {sortedArticles.map((article, index) => {
        // Fallback for bias if missing
        const leanClass = article.politicalLean || 'Neutral';
        const formattedDate = article.publishedAt 
          ? format(new Date(article.publishedAt), 'MMM d • h:mm a') 
          : 'Unknown Date';

        return (
          <div key={article._id || index} className="timeline-item">
            {/* Color-coded Dot */}
            <div className={`timeline-dot ${leanClass}`} title={`Bias: ${leanClass}`}></div>
            
            {/* Glassmorphism Card */}
            <div className="timeline-card">
              
              {/* Header: Source Name & Time */}
              <div className="card-header">
                <span className="source-name">{article.source}</span>
                <span className="date-display">{formattedDate}</span>
              </div>

              {/* Content: Clickable Headline */}
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="timeline-headline"
              >
                {article.headline}
              </a>

              {/* Footer: Visual Bias Tag */}
              <div className="card-footer">
                <span className={`bias-tag ${leanClass}`}>
                  {leanClass}
                </span>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopicTimeline;
