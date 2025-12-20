// src/components/modals/NarrativeModal.tsx
import React, { useState } from 'react';
import './NarrativeModal.css';
import { INarrative } from '../../types';

interface NarrativeModalProps {
  data: INarrative | null;
  onClose: () => void;
}

type Tab = 'consensus' | 'divergence' | 'sources';

const NarrativeModal: React.FC<NarrativeModalProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('consensus');

  if (!data) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="narrative-modal-overlay" onClick={handleOverlayClick}>
      <div className="narrative-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER --- */}
        <div className="nm-header">
           <div className="nm-header-top">
               <span className="nm-badge">Narrative Synthesis</span>
               <button className="nm-close-btn" onClick={onClose}>×</button>
           </div>
           <h2 className="nm-headline">{data.masterHeadline}</h2>
           <div className="nm-meta">
              Analyzed {data.sourceCount} Sources • Updated {new Date(data.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </div>
        </div>

        {/* --- TABS --- */}
        <div className="nm-tabs">
            <button 
                className={`nm-tab ${activeTab === 'consensus' ? 'active' : ''}`}
                onClick={() => setActiveTab('consensus')}
            >
                The Consensus
            </button>
            <button 
                className={`nm-tab ${activeTab === 'divergence' ? 'active' : ''}`}
                onClick={() => setActiveTab('divergence')}
            >
                The Conflict
            </button>
            <button 
                className={`nm-tab ${activeTab === 'sources' ? 'active' : ''}`}
                onClick={() => setActiveTab('sources')}
            >
                Sources
            </button>
        </div>

        {/* --- BODY --- */}
        <div className="nm-body">
            
            {/* TAB: CONSENSUS */}
            {activeTab === 'consensus' && (
                <div className="nm-tab-content fade-in">
                    <div className="nm-summary-box">
                        <h3>Executive Summary</h3>
                        <p>{data.executiveSummary}</p>
                    </div>
                    
                    <div className="nm-points-list">
                        <h3>Agreed Facts</h3>
                        <ul>
                            {data.consensusPoints.map((point, i) => (
                                <li key={i}>
                                    <span className="nm-check-icon">✓</span>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* TAB: DIVERGENCE */}
            {activeTab === 'divergence' && (
                <div className="nm-tab-content fade-in">
                    <p className="nm-intro-text">Where the reporting differs or conflicts:</p>
                    
                    {data.divergencePoints.map((item, i) => (
                        <div key={i} className="nm-divergence-card">
                            <div className="nm-divergence-header">
                                <span className="nm-index">0{i+1}</span>
                                <h4>{item.point}</h4>
                            </div>
                            <div className="nm-perspectives">
                                {item.perspectives.map((p, j) => (
                                    <div key={j} className="nm-perspective-row">
                                        <span className="nm-p-source">{p.source}:</span>
                                        <span className="nm-p-stance">"{p.stance}"</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: SOURCES */}
            {activeTab === 'sources' && (
                <div className="nm-tab-content fade-in">
                    <p className="nm-intro-text">Sources analyzed for this narrative:</p>
                    <div className="nm-sources-grid">
                        {data.sources.map((s, i) => (
                            <div key={i} className="nm-source-chip">
                                {s}
                            </div>
                        ))}
                    </div>
                    <div className="nm-note">
                        * Individual articles for this story are bundled here to reduce feed noise.
                    </div>
                </div>
            )}

        </div>

      </div>
    </div>
  );
};

export default NarrativeModal;
