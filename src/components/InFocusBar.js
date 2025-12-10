// src/components/InFocusBar.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import './InFocusBar.css';

function InFocusBar() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data } = await api.getTrendingTopics();
        setTopics(data.topics || []);
      } catch (error) {
        console.error("Failed to load In Focus topics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const handleTopicClick = (topic) => {
    navigate(`/search?q=${encodeURIComponent(topic)}`);
  };

  // Enable mouse wheel scrolling for desktop
  const handleWheel = (e) => {
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
           // Simple skeleton loader for pills
           [...Array(4)].map((_, i) => <div key={i} className="infocus-pill skeleton"></div>)
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
}

export default InFocusBar;
