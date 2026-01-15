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

  // MOCKED LOCKED CONTENT FOR GUEST TEASE
  const LockedTease = (
    <div className="briefing-locked-section" style={{ marginTop: '15px' }}>
        <div className="briefing-lock-overlay">
            <button className="lock-message-btn" onClick={() => navigate('/login')}>
                <LockIcon size={14} />
                <span>Login to Unlock Analysis</span>
            </button>
        </div>
        <div className="briefing-blur-content">
            <h4>Points of Conflict</h4>
            <ul>
                <li>Disagreement regarding the economic impact...</li>
                <li>Multiple sources cite different timelines...</li>
            </ul>
        </div>
    </div>
  );

  if (points.length === 0 && !loading) {
    return <div className="inline-brief-empty">No briefing available.</div>;
  }

  return (
    <div className="inline-brief-container">
      <h4 className="inline-brief-title">Key Takeaways</h4>
      <ul className="inline-brief-list">
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>

      {/* Render Locked Section for Guests */}
      {isGuest && LockedTease}
    </div>
  );
};

export default InlineSmartBrief;
