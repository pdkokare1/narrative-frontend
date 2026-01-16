// src/components/InFocusBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as api from '../services/api';
import './InFocusBar.css';

interface Topic {
  topic: string;
  count?: number;
  score?: number;
}

interface InFocusBarProps {
  onTopicClick?: (topic: string) => void;
  activeTopic?: string | null; // NEW: Visual state
}

const InFocusBar: React.FC<InFocusBarProps> = ({ onTopicClick, activeTopic }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await api.getTrendingTopics();
        setTopics(data?.data || []);
      } catch (error) {
        console.error("Failed to load In Focus topics", error);
        setTopics([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

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
           [80, 100, 70, 90, 60].map((width, i) => (
             <div key={i} className="infocus-pill skeleton" style={{ width: `${width}px` }}></div>
           ))
        ) : (
          topics.map((item, index) => (
            <button 
              key={index} 
              // Apply 'active' class if topic matches selected
              className={`infocus-pill ${item.topic === activeTopic ? 'active' : ''}`}
              style={item.topic === activeTopic ? { 
                  background: 'var(--accent-primary)', 
                  color: 'white',
                  borderColor: 'var(--accent-primary)' 
              } : {}}
              onClick={() => onTopicClick?.(item.topic)}
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
