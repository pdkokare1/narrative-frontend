// src/components/modals/SmartBriefingModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Close as CloseIcon, 
  AutoAwesome as SparklesIcon, 
  Refresh as RefreshIcon, 
  ErrorOutline as AlertIcon 
} from '@mui/icons-material';
import { LockIcon } from '../ui/Icons';
import './SmartBriefingModal.css';
import api from '../../services/api';
import { IArticle } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface BriefingData {
  title: string;
  content: string; // The Summary (Always Visible)
  keyPoints?: string[];
  // New Locked Fields
  agreedUpon?: string[];
  conflict?: string[];
  timeline?: string[];
}

interface SmartBriefingModalProps {
  onClose: () => void;
  article?: IArticle;
  onCompare?: (article: IArticle) => void;
  showTooltip?: (text: string, e: React.MouseEvent) => void;
}

const SmartBriefingModal: React.FC<SmartBriefingModalProps> = ({ 
  onClose,
  article 
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BriefingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  
  const { isGuest } = useAuth();
  const navigate = useNavigate();

  // cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 60000)
    );

    try {
      const endpoint = article && article._id
        ? `/articles/smart-briefing?articleId=${article._id}` 
        : '/articles/smart-briefing';

      const response: any = await Promise.race([
        api.get(endpoint),
        timeoutPromise
      ]);
      
      if (!mounted.current) return;

      const duration = (Date.now() - startTime) / 1000;
      console.log(`Briefing API Response (took ${duration}s):`, response);

      if (response.data && response.data.status === 'success') {
        setData(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      if (!mounted.current) return;
      console.error('Failed to load smart briefing:', err);
      
      let errorMessage = 'Unable to generate your briefing.';
      
      if (err.message === 'Request timed out') {
        errorMessage = 'The briefing is taking longer than usual. The AI is still thinking, please try again.';
      } else if (err.response) {
        errorMessage = `Server Error (${err.response.status}): ${err.response.statusText || 'Unknown Error'}`;
        if (err.response.status === 404) {
             errorMessage = 'Feature not found on server (404). Please check backend routes.';
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = `Request Error: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const handleLoginRedirect = () => {
    onClose();
    navigate('/login');
  };

  // --- MOCK DATA FOR GUESTS TO SEE BLURRED ---
  // If no deep data is returned from API yet, we can show placeholders to indicate what they are missing
  const lockedContentPlaceholder = (
    <div className="briefing-points">
      <h4>Agreed Upon Facts</h4>
      <ul>
        <li>Both sides acknowledge the economic impact of the recent policy changes.</li>
        <li>International observers have confirmed the initial timeline of events.</li>
      </ul>
      <br />
      <h4>Points of Conflict</h4>
      <ul>
        <li>Disagreement persists regarding the long-term viability of the proposed solution.</li>
        <li>Opposition leaders argue the data used for the decision was incomplete.</li>
      </ul>
    </div>
  );

  return createPortal(
    <div className="smart-briefing-overlay" onClick={onClose}>
      <div 
        className="smart-briefing-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          opacity: 1, 
          visibility: 'visible', 
          display: 'flex',
          transform: 'none' 
        }}
      >
        
        {/* Header - Always visible */}
        <div className="smart-briefing-header">
          <div className="header-title">
            <SparklesIcon sx={{ color: 'var(--accent-primary)', fontSize: 24 }} />
            <h2>{article ? 'Smart Analysis' : 'Smart Briefing'}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <CloseIcon sx={{ fontSize: 24 }} />
          </button>
        </div>

        {/* Content Body */}
        <div className="smart-briefing-content">
          {loading ? (
            <div className="briefing-loading">
              <p className="loading-text">Analyzing current events...</p>
              <div className="skeleton-title"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          ) : error ? (
            <div className="briefing-error">
              <AlertIcon sx={{ fontSize: 48, color: 'var(--color-error)', marginBottom: '1rem' }} />
              <p style={{ maxWidth: '80%', lineHeight: '1.4' }}>{error}</p>
              <button className="retry-button" onClick={fetchBriefing}>
                <RefreshIcon sx={{ fontSize: 16, marginRight: '8px' }} /> Retry
              </button>
            </div>
          ) : data ? (
            <div className="briefing-body">
              <h3 className="briefing-headline">
                {article ? `Context: ${article.headline}` : data.title}
              </h3>
              
              {/* SUMMARY IS ALWAYS VISIBLE */}
              <p className="briefing-summary">{data.content}</p>
              
              {/* KEY POINTS (Always Visible if available) */}
              {data.keyPoints && data.keyPoints.length > 0 && (
                <div className="briefing-points">
                  <h4>Key Takeaways</h4>
                  <ul>
                    {data.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* LOCKED SECTIONS: Agreed Upon, Conflict, Timeline */}
              {isGuest ? (
                 <div className="briefing-locked-section">
                    <div className="briefing-lock-overlay">
                        <button className="lock-message-btn" onClick={handleLoginRedirect}>
                            <LockIcon size={16} />
                            <span>Login to Unlock Full Analysis</span>
                        </button>
                    </div>
                    {/* Blurred Background Content */}
                    <div className="briefing-blur-content">
                        {lockedContentPlaceholder}
                    </div>
                 </div>
              ) : (
                 // LOGGED IN VIEW
                 <>
                    {data.agreedUpon && data.agreedUpon.length > 0 && (
                        <div className="briefing-points" style={{ marginTop: '20px' }}>
                            <h4>Agreed Upon</h4>
                            <ul>{data.agreedUpon.map((p, i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                    )}
                    {data.conflict && data.conflict.length > 0 && (
                        <div className="briefing-points">
                            <h4>Points of Conflict</h4>
                            <ul>{data.conflict.map((p, i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                    )}
                    {data.timeline && data.timeline.length > 0 && (
                        <div className="briefing-points">
                            <h4>Timeline</h4>
                            <ul>{data.timeline.map((p, i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                    )}
                 </>
              )}
              
              <div className="briefing-footer">
                <p>Generated by Narrative AI based on live reporting.</p>
              </div>
            </div>
          ) : (
             <div className="briefing-error">
                <p>No briefing data available.</p>
                <button className="retry-button" onClick={fetchBriefing}>
                  <RefreshIcon sx={{ fontSize: 16, marginRight: '8px' }} /> Retry
                </button>
             </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SmartBriefingModal;
