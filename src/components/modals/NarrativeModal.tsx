// src/components/modals/NarrativeModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NarrativeModal.css';
import { INarrative } from '../../types';
import { getClusterById } from '../../services/articleService';
import TopicTimeline from '../TopicTimeline';
import { useAuth } from '../../context/AuthContext';
import { LockIcon } from '../ui/Icons';
import { useActivityTracker } from '../../hooks/useActivityTracker'; // NEW
import { useSmartResume } from '../../hooks/useSmartResume'; // NEW
import { useToast } from '../../context/ToastContext'; // NEW

interface NarrativeModalProps {
  data: INarrative | null;
  onClose: () => void;
}

type Tab = 'consensus' | 'divergence' | 'timeline';

const NarrativeModal: React.FC<NarrativeModalProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('consensus');
  
  const [clusterData, setClusterData] = useState<any>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Scroll Container Ref for Smart Resume
  const modalContentRef = useRef<HTMLDivElement>(null);

  const { isGuest } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // 1. TRACKING: Start monitoring time spent and engagement on this Narrative
  useActivityTracker(data?._id, 'narrative');

  // 2. SMART RESUME: Check if user has read this before
  const { resumePosition, handleResume } = useSmartResume({
      articleId: data?._id,
      minScrollThreshold: 300,
      scrollRef: modalContentRef // Pass the ref so we scroll the DIV, not the window
  });

  // 3. TOAST: Trigger popup if resume position is found
  useEffect(() => {
      if (resumePosition) {
          addToast('Resume where you left off?', 'info', {
              label: 'Resume',
              onClick: handleResume
          });
      }
  }, [resumePosition, addToast, handleResume]);

  useEffect(() => {
    if (activeTab === 'timeline' && !clusterData && data?.clusterId && !isGuest) {
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
  }, [activeTab, data, clusterData, isGuest]);

  if (!data) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleLoginClick = () => {
    onClose();
    navigate('/login');
  };

  // Reusable Lock Overlay Component
  const LockOverlay = ({ label = "Unlock Full Analysis" }) => (
      <div className="nm-lock-overlay">
          <button className="nm-lock-btn" onClick={handleLoginClick}>
              <LockIcon size={16} />
              <span>{label}</span>
          </button>
      </div>
  );

  return (
    <div className="narrative-modal-overlay" onClick={handleOverlayClick}>
      {/* 4. Ref attached here to control scrolling */}
      <div 
        className="narrative-modal-content" 
        onClick={(e) => e.stopPropagation()}
        ref={modalContentRef}
      >
        
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
                    {/* Executive Summary is ALWAYS VISIBLE */}
                    <div className="nm-summary-box">
                        <h3>Executive Summary</h3>
                        <p>{data.executiveSummary}</p>
                    </div>
                    
                    {/* Agreed Facts - LOCKED FOR GUESTS */}
                    <div className="nm-points-list">
                        <h3>Agreed Facts</h3>
                        {isGuest ? (
                            <div className="nm-locked-section">
                                <LockOverlay label="Login to view agreed facts" />
                                <div className="nm-blur-content">
                                    <ul>
                                        {[1, 2, 3].map((_, i) => (
                                            <li key={i}>
                                                <span className="nm-check-icon">✓</span>
                                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <ul>
                                {data.consensusPoints.map((point, i) => (
                                    <li key={i}>
                                        <span className="nm-check-icon">✓</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: DIVERGENCE (Locked for Guests) */}
            {activeTab === 'divergence' && (
                <div className="nm-tab-content fade-in">
                    <p className="nm-intro-text">Where the reporting differs or conflicts:</p>
                    
                    {isGuest ? (
                        <div className="nm-locked-section">
                            <LockOverlay label="Login to see conflicting perspectives" />
                            <div className="nm-blur-content">
                                {[1, 2].map((i) => (
                                    <div key={i} className="nm-divergence-card">
                                        <div className="nm-divergence-header">
                                            <span className="nm-index">0{i}</span>
                                            <h4>Sample conflict point blurred out...</h4>
                                        </div>
                                        <div className="nm-perspectives">
                                            <div className="nm-perspective-row">
                                                <span className="nm-p-source">Source A:</span>
                                                <span className="nm-p-stance">"Sample stance text..."</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            )}

            {/* TAB: TIMELINE (Locked for Guests) */}
            {activeTab === 'timeline' && (
                <div className="nm-tab-content fade-in">
                    <p className="nm-intro-text">Timeline of coverage for this story:</p>
                    
                    {isGuest ? (
                        <div className="nm-locked-section">
                            <LockOverlay label="Login to view timeline" />
                            <div className="nm-blur-content">
                                <div style={{ height: '200px', background: 'var(--bg-secondary)', borderRadius: '12px' }}></div>
                            </div>
                        </div>
                    ) : loadingTimeline ? (
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
