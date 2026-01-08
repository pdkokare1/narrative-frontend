// src/components/modals/NarrativeModal.tsx
import React, { useState, useEffect } from 'react';
import './NarrativeModal.css';
import { INarrative } from '../../types';
import { getClusterById } from '../../services/articleService';
import TopicTimeline from '../TopicTimeline';

interface NarrativeModalProps {
  data: INarrative | null;
  onClose: () => void;
}

// CHANGED: Renamed 'sources' to 'timeline'
type Tab = 'consensus' | 'divergence' | 'timeline';

const NarrativeModal: React.FC<NarrativeModalProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('consensus');
  
  // NEW: State for Timeline Data
  const [clusterData, setClusterData] = useState<any>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // NEW: Fetch timeline data when tab is active
  useEffect(() => {
    if (activeTab === 'timeline' && !clusterData && data?.clusterId) {
        setLoadingTimeline(true);
        getClusterById(data.clusterId)
            .then(res => {
                setClusterData(res.data);
            })
            .catch(err => {
                console.error("Failed to load timeline", err);
            })
            .finally(() => {
                setLoadingTimeline(false);
            });
    }
  }, [activeTab, data, clusterData]);

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
            {/* CHANGED: Label to Timeline */}
            <button 
                className={`nm-tab ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
            >
                Timeline
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

            {/* TAB: TIMELINE (Replaces Sources) */}
            {activeTab === 'timeline' && (
                <div className="nm-tab-content fade-in">
                    <p className="nm-intro-text">Timeline of coverage for this story:</p>
                    
                    {loadingTimeline ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            Loading timeline data...
                        </div>
                    ) : (
                        <TopicTimeline clusterData={clusterData} />
                    )}

                    <div className="nm-note" style={{ marginTop: '15px' }}>
                        * Articles are sorted by publication time to show how the story developed.
                    </div>
                </div>
            )}

        </div>

      </div>
    </div>
  );
};

export default NarrativeModal;
