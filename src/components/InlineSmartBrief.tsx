// src/components/InlineSmartBrief.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Refresh as RefreshIcon, ErrorOutline as AlertIcon } from '@mui/icons-material';
import { LockIcon } from './ui/Icons'; // Using the minimal lock icon
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './modals/SmartBriefingModal.css'; // Re-use locked styles

interface InlineSmartBriefProps {
  articleId: string;
}

const InlineSmartBrief: React.FC<InlineSmartBriefProps> = ({ articleId }) => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  
  const { isGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchBrief = async () => {
    // We still fetch even if guest to ensure data readiness or to show "loading" state appropriately.
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/articles/smart-briefing?articleId=${articleId}`);
      
      if (!mounted.current) return;

      if (response.data && response.data.status === 'success') {
        setPoints(response.data.data.keyPoints || []);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err: any) {
      if (!mounted.current) return;
      console.error('Brief fetch error:', err);
      setError('Unable to load brief.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, [articleId]);

  if (loading) {
    return (
      <div className="inline-brief-loading">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline-brief-error">
        <span className="error-text">{error}</span>
        <button onClick={fetchBrief} className="inline-retry-btn">
          <RefreshIcon sx={{ fontSize: 14 }} /> Retry
        </button>
      </div>
    );
  }

  // LOCKED STATE (Rendered if Guest)
  // Added "inline-mode" class to fix sizing/centering issues
  const LockedTease = (
    <div className="briefing-locked-section inline-mode">
        <div className="briefing-lock-overlay">
            <button className="lock-message-btn" onClick={() => navigate('/login')}>
                <LockIcon size={12} /> {/* Slightly smaller icon for inline */}
                {/* FIXED: Updated Text */}
                <span>Login to view Smart Briefs</span>
            </button>
        </div>
        <div className="briefing-blur-content">
            {/* Fake Content for Blur Effect */}
            {/* FIXED: Removed default margins to ensure perfect vertical centering of the overlay */}
            <ul className="inline-brief-list" style={{ marginTop: 0, marginBottom: 0 }}>
                <li>Analysis of the primary economic factors...</li>
                <li>Key stakeholders disagreement on the timeline...</li>
                <li>Long-term impact projections based on data...</li>
            </ul>
        </div>
    </div>
  );

  if (points.length === 0 && !loading && !isGuest) {
    return <div className="inline-brief-empty">No briefing available.</div>;
  }

  return (
    <div className="inline-brief-container">
      <h4 className="inline-brief-title">Key Takeaways</h4>
      
      {!isGuest ? (
        <ul className="inline-brief-list">
            {points.map((point, index) => (
            <li key={index}>{point}</li>
            ))}
        </ul>
      ) : (
          // IF GUEST: HIDE REAL POINTS, SHOW COMPACT LOCK
          LockedTease
      )}
    </div>
  );
};

export default InlineSmartBrief;
