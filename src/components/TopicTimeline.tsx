// src/components/TopicTimeline.tsx
import React from 'react';
import { format } from 'date-fns';
import './TopicTimeline.css'; 
import { IArticle } from '../types';

interface ClusterData {
  left: IArticle[];
  center: IArticle[];
  right: IArticle[];
  reviews: IArticle[];
  others?: IArticle[]; 
}

interface TopicTimelineProps {
  clusterData: ClusterData | null;
}

const TopicTimeline: React.FC<TopicTimelineProps> = ({ clusterData }) => {
  if (!clusterData) return null;

  // 1. Merge all articles to ensure no data loss
  const allArticles = [
    ...(clusterData.left || []),
    ...(clusterData.center || []),
    ...(clusterData.right || []),
    ...(clusterData.reviews || []),
    ...(clusterData.others || [])
  ];

  if (allArticles.length === 0) {
    return <div className="no-data-msg">No articles available for timeline.</div>;
  }

  // 2. Sort by Date (Newest first)
  const sortedArticles = allArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  /**
   * Helper to determine alignment based on political stance.
   * Returns: 'left-aligned' | 'right-aligned' | 'center-aligned'
   */
  const getAlignmentClass = (lean?: string) => {
    if (!lean) return 'center-aligned'; // Fallback
    const lowerLean = lean.toLowerCase();
    
    if (lowerLean.includes('left')) return 'left-aligned';
    if (lowerLean.includes('right')) return 'right-aligned';
    // Center, Neutral, Mixed, etc. go to center
    return 'center-aligned';
  };

  /**
   * Helper for standardized bias color naming
   */
  const getBiasClass = (lean?: string) => {
    if (!lean) return 'Neutral';
    const lowerLean = lean.toLowerCase();
    if (lowerLean.includes('left')) return 'Left';
    if (lowerLean.includes('right')) return 'Right';
    if (lowerLean.includes('center')) return 'Center';
    return 'Neutral';
  };

  return (
    <div className="timeline-container">
      {/* The Central Spine (Hidden on Mobile via CSS) */}
      <div className="timeline-spine" />

      {sortedArticles.map((article, index) => {
        const lean = article.politicalLean || 'Neutral';
        const alignClass = getAlignmentClass(lean);
        const biasClass = getBiasClass(lean);
        
        const formattedDate = article.publishedAt 
          ? format(new Date(article.publishedAt), 'MMM d • h:mm a') 
          : '';

        return (
          <div key={article._id || index} className={`timeline-row ${alignClass}`}>
            
            {/* The Dot (Visual Node) - Only shows for Left/Right in CSS */}
            <div className={`timeline-node ${biasClass}`} />
            
            {/* The Content Card */}
            <div className="timeline-card">
              
              {/* Header: Source & Date */}
              <div className="card-header">
                <span className="source-name">{article.source}</span>
                <span>{formattedDate}</span>
              </div>

              {/* Headline */}
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="timeline-headline"
              >
                {article.headline}
              </a>

              {/* Footer: Bias Tag */}
              <div className="card-footer">
                <span className={`bias-tag ${biasClass}`}>
                  {lean}
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
