// src/components/NarrativeCard.tsx
import React, { memo } from 'react';
import './NarrativeCard.css';
import { INarrative } from '../types';

interface NarrativeCardProps {
  data: INarrative;
  onClick: () => void;
}

const NarrativeCard: React.FC<NarrativeCardProps> = memo(({ data, onClick }) => {
  return (
    <div className="narrative-wrapper" onClick={onClick}>
      
      {/* Visual Stack Effect */}
      <div className="narrative-stack-layer layer-2"></div>
      <div className="narrative-stack-layer layer-1"></div>

      {/* Main Card */}
      <div className="narrative-card">
        
        {/* Header Badge */}
        <div className="narrative-header">
           <div className="narrative-badge">
              <span className="pulse-dot"></span>
              AI Narrative
           </div>
           <span className="source-count">{data.sourceCount} Sources Analyzed</span>
        </div>

        {/* Headline */}
        <h3 className="narrative-headline">{data.masterHeadline}</h3>
        
        {/* Preview Text */}
        <div className="narrative-preview">
           <p>{data.executiveSummary.substring(0, 140)}...</p>
        </div>

        {/* Footer: Sources & CTA */}
        <div className="narrative-footer">
           <div className="source-pills-row">
              {data.sources.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="source-pill">{s}</span>
              ))}
              {data.sources.length > 3 && (
                  <span className="source-pill more">+{data.sources.length - 3}</span>
              )}
           </div>
           <div className="open-btn">
              Open Briefing →
           </div>
        </div>
      </div>
    </div>
  );
});

export default NarrativeCard;
