// src/components/modals/DataTransparencyModal.tsx
import React, { useEffect, useState } from 'react';
import './SmartBriefingModal.css'; // Re-use modal styles
import { X, Shield, Eye, EyeOff, BrainCircuit, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import Button from '../ui/Button';

interface Props {
  onClose: () => void;
}

interface UserStats {
  topicInterest: Record<string, number>;
  negativeInterest: Record<string, number>;
  topicImpressions?: Record<string, number>;
  leanExposure: { Left: number; Center: number; Right: number };
}

const DataTransparencyModal: React.FC<Props> = ({ onClose }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggledTopics, setToggledTopics] = useState<Set<string>>(new Set());

  const fetchStats = () => {
    api.get('/analytics/user-stats')
      .then(res => setStats(res.data)) 
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTuneFeed = (topic: string, action: 'unmute_topic' | 'remove_interest') => {
      // Optimistic UI Update
      setToggledTopics(prev => new Set(prev).add(topic));

      api.post('/analytics/tune-feed', { action, topic })
         .then(() => {
             // Slight delay to allow server sync before refresh, 
             // but UI is already hidden via local state
             setTimeout(fetchStats, 500);
         })
         .catch(err => {
             console.error('Tune failed', err);
             // Revert optimistic update
             setToggledTopics(prev => {
                 const next = new Set(prev);
                 next.delete(topic);
                 return next;
             });
         });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2><Shield className="inline-icon"/> Data Transparency</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        <div className="modal-body scrollable">
          <p className="transparency-intro">
            We believe in radical transparency. This is the exact data our AI uses to personalize your feed.
            <br/><span style={{fontSize: '0.9em', opacity: 0.8}}>Click on any item to remove it from your profile.</span>
          </p>

          {loading ? (
             <div className="loading-spinner">Loading Profile...</div>
          ) : stats ? (
             <div className="transparency-grid">
                
                {/* 1. What You Like */}
                <div className="t-section">
                   <h3><Eye className="inline-icon" size={16}/> Active Interests</h3>
                   <p className="t-desc">Topics you spend time reading. Click to remove.</p>
                   <div className="pill-cloud">
                      {Object.entries(stats.topicInterest || {}).length > 0 ? (
                        Object.entries(stats.topicInterest)
                          .sort(([,a], [,b]) => b - a)
                          .filter(([topic]) => !toggledTopics.has(topic))
                          .map(([topic, score]) => (
                            <span 
                                key={topic} 
                                className="t-pill positive clickable" 
                                style={{ opacity: Math.min(score/60, 1) + 0.3 }}
                                onClick={() => handleTuneFeed(topic, 'remove_interest')}
                                title="Click to remove interest"
                            >
                                {topic}
                                <span className="hover-icon"><X size={10}/></span>
                            </span>
                          ))
                      ) : (
                        <span className="empty-text">No active interests recorded.</span>
                      )}
                   </div>
                </div>

                {/* 2. What You Ignore */}
                <div className="t-section">
                   <h3><EyeOff className="inline-icon" size={16}/> Negative Filters (Survivorship Bias)</h3>
                   <p className="t-desc">Topics we hide because you see them but rarely click. Click to Unmute.</p>
                   <div className="pill-cloud">
                      {Object.entries(stats.negativeInterest || {}).length > 0 ? (
                        Object.entries(stats.negativeInterest)
                          .sort(([,a], [,b]) => b - a)
                          .filter(([topic]) => !toggledTopics.has(topic))
                          .map(([topic, score]) => {
                             // Contextual Data
                             const seen = stats.topicImpressions ? (stats.topicImpressions[topic] || 0) : 0;
                             return (
                                <div key={topic} className="t-pill-wrapper" title={`Seen ${seen} times, rarely clicked. Click to Unmute.`}>
                                    <span 
                                        className="t-pill negative clickable"
                                        onClick={() => handleTuneFeed(topic, 'unmute_topic')}
                                    >
                                        {topic} <span className="pill-detail">({seen}x)</span>
                                        <span className="hover-icon"><RotateCcw size={10}/></span>
                                    </span>
                                </div>
                             );
                          })
                      ) : (
                        <span className="empty-text">No negative filters established.</span>
                      )}
                   </div>
                </div>

                {/* 3. Your Political Diet */}
                <div className="t-section">
                   <h3><BrainCircuit className="inline-icon" size={16}/> Political Exposure</h3>
                   <div className="lean-bar-container">
                      <div className="lean-bar left" style={{ flex: stats.leanExposure?.Left || 1 }}>Left</div>
                      <div className="lean-bar center" style={{ flex: stats.leanExposure?.Center || 1 }}>Center</div>
                      <div className="lean-bar right" style={{ flex: stats.leanExposure?.Right || 1 }}>Right</div>
                   </div>
                   <p className="t-desc" style={{marginTop: '0.5rem'}}>Read more diverse sources to balance this bar.</p>
                </div>

             </div>
          ) : (
             <p>Unable to load stats.</p>
          )}

          <div className="modal-footer">
             <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTransparencyModal;
