// src/components/NarrativeCard.tsx
import React, { memo } from 'react';
import './NarrativeCard.css';
import { INarrative } from '../types';

interface NarrativeCardProps {
  data: INarrative;
  onClick: () => void;
}

const NarrativeCard: React.FC<NarrativeCardProps> = memo(({ data, onClick }) => {
  // Safety: Ensure we have strings/arrays to work with to prevent crashes
  const summaryText = data.executiveSummary || "No summary available.";
  const sourceList = data.sources || [];

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
           <span className="source-count">{data.sourceCount || 0} Sources Analyzed</span>
        </div>

        {/* Headline */}
        <h3 className="narrative-headline">{data.masterHeadline || "Untitled Narrative"}</h3>
        
        {/* Preview Text - Fixed Substring Crash */}
        <div className="narrative-preview">
           <p>{summaryText.substring(0, 140)}{summaryText.length > 140 ? '...' : ''}</p>
        </div>

        {/* Footer: Sources & CTA */}
        <div className="narrative-footer">
           <div className="source-pills-row">
              {sourceList.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="source-pill">{s}</span>
              ))}
              {sourceList.length > 3 && (
                  <span className="source-pill more">+{sourceList.length - 3}</span>
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
