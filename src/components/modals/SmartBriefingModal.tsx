import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Close as CloseIcon, 
  AutoAwesome as SparklesIcon, 
  Refresh as RefreshIcon, 
  ErrorOutline as AlertIcon 
} from '@mui/icons-material';
import './SmartBriefingModal.css';
import api from '../../services/api';
import { IArticle } from '../../types';

interface BriefingData {
  title: string;
  content: string;
  keyPoints: string[];
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
    
    // Timeout to prevent hanging
    // UPDATED: Increased to 60 seconds (60000ms) to allow for AI generation and cold starts
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 60000)
    );

    try {
      // Determine endpoint based on whether we are analyzing a specific article or fetching the global brief
      const endpoint = article && article._id
        ? `/articles/smart-briefing?articleId=${article._id}` 
        : '/articles/smart-briefing';

      // Race between the API call and the timeout
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
      
      // DIAGNOSTIC ERROR HANDLING
      // We are unmasking the error to see exactly what is happening
      let errorMessage = 'Unable to generate your briefing.';
      
      if (err.message === 'Request timed out') {
        errorMessage = 'The briefing is taking longer than usual. The AI is still thinking, please try again.';
      } else if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Server Error (${err.response.status}): ${err.response.statusText || 'Unknown Error'}`;
        if (err.response.status === 404) {
             errorMessage = 'Feature not found on server (404). Please check backend routes.';
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
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

  // We use a Portal to render this component at the document.body level.
  // This breaks it out of any stacking contexts or overflow:hidden containers.
  return createPortal(
    <div className="smart-briefing-overlay" onClick={onClose}>
      <div 
        className="smart-briefing-modal" 
        onClick={(e) => e.stopPropagation()}
        // Inline styles to guarantee visibility against any global CSS conflicts
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
            <SparklesIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
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
              <AlertIcon sx={{ fontSize: 48, color: '#ef4444', marginBottom: '1rem' }} />
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
              
              <p className="briefing-summary">{data.content}</p>
              
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
    document.body // Target container
  );
};

export default SmartBriefingModal;
