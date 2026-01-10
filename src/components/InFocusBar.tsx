// src/components/InFocusBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import './InFocusBar.css';

interface Topic {
  topic: string;
  count?: number;
  score?: number;
}

const InFocusBar: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await api.getTrendingTopics();
        // FIXED: Backend returns { status: 'success', data: [...] }, not data.topics
        setTopics(data.data || []);
      } catch (error) {
        console.error("Failed to load In Focus topics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const handleTopicClick = (topic: string) => {
    navigate(`/search?q=${encodeURIComponent(topic)}`);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!loading && topics.length === 0) return null;

  return (
    <div className="infocus-container">
      <div className="infocus-label">
        <span className="pulse-dot"></span>
        IN FOCUS
      </div>
      
      <div className="infocus-scroll-area" ref={scrollRef} onWheel={handleWheel}>
        {loading ? (
           // Smart Skeleton: 5 random-width pills
           [80, 100, 70, 90, 60].map((width, i) => (
             <div key={i} className="infocus-pill skeleton" style={{ width: `${width}px` }}></div>
           ))
        ) : (
          topics.map((item, index) => (
            <button 
              key={index} 
              className="infocus-pill" 
              onClick={() => handleTopicClick(item.topic)}
            >
              #{item.topic}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default InFocusBar;
