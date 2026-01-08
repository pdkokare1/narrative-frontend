// src/components/InlineSmartBrief.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Refresh as RefreshIcon, ErrorOutline as AlertIcon } from '@mui/icons-material';
import api from '../services/api';

interface InlineSmartBriefProps {
  articleId: string;
}

const InlineSmartBrief: React.FC<InlineSmartBriefProps> = ({ articleId }) => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchBrief = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the same endpoint as the modal
      const response = await api.get(`/articles/smart-briefing?articleId=${articleId}`);
      
      if (!mounted.current) return;

      if (response.data && response.data.status === 'success') {
        // We only care about keyPoints as per requirements
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

  if (points.length === 0) {
    return <div className="inline-brief-empty">No key points available.</div>;
  }

  return (
    <div className="inline-brief-container">
      <h4 className="inline-brief-title">Key Takeaways</h4>
      <ul className="inline-brief-list">
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    </div>
  );
};

export default InlineSmartBrief;
