// src/components/NarrativeCard.tsx
import React, { memo } from 'react';
import './ArticleCard.css'; // Reusing ArticleCard styles for 1:1 consistency
import { INarrative } from '../types';
import { getFallbackImage } from '../utils/constants';
import Button from './ui/Button';

interface NarrativeCardProps {
  data: INarrative;
  onClick: () => void;
}

const NarrativeCard: React.FC<NarrativeCardProps> = memo(({ data, onClick }) => {
  // 1. Safety & Data Prep
  const summaryText = data.executiveSummary || "No summary available.";
  const fallbackImg = getFallbackImage(data.category);
  const displayDate = data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : '';

  // 2. Interaction Helper
  const preventBubble = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article 
        className="article-card narrative-card-variant" 
        onClick={onClick}
        style={{ cursor: 'pointer' }}
    >
        
        {/* --- BADGES --- */}
        <div className="card-badges">
          {/* FIXED: Changed to Adaptive Theme Color and Renamed Label */}
          {/* Updated Label from "Narrative In Focus" to "Developing Narratives" */}
          <span className="badge challenge" style={{ background: 'var(--accent-primary)', color: 'white' }}>
            Developing Narratives
          </span>
        </div>
        
        {/* --- IMAGE --- */}
        {/* Uses fallback image to maintain same height/layout as ArticleCard */}
        <div className="article-image">
          <img 
            src={fallbackImg}
            alt={data.category}
            loading="lazy" 
          />
        </div>
        
        {/* --- CONTENT --- */}
        <div className="article-content">
          <div className="article-meta-top">
             <span className="source-name">{data.sourceCount} Sources Analyzed</span>
             {displayDate && <time className="date">{displayDate}</time>}
          </div>

          {/* Headline - Styled as button for consistency, but triggers main click */}
          <button 
            className="article-headline-btn"
            onClick={(e) => { 
                preventBubble(e); 
                onClick(); 
            }}
          >
            {data.masterHeadline || "Untitled Narrative"}
          </button>

          <p className="article-summary">
             {summaryText.length > 140 ? `${summaryText.substring(0, 140)}...` : summaryText}
          </p>
          
          {/* --- FOOTER --- */}
          <div className="article-footer">
            
            {/* Empty stats/left-actions to push button to right */}
            <div className="action-bar">
                <div className="action-left"></div>

                <Button 
                    variant="text"
                    onClick={(e) => { 
                        preventBubble(e); 
                        onClick(); 
                    }}
                >
                    Open Briefing →
                </Button>
            </div>
          </div>
        </div>
    </article>
  );
});

export default NarrativeCard;
