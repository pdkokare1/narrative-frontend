// In file: src/components/ui/CategoryPills.js
import React, { useRef } from 'react';
import { CATEGORIES } from '../../utils/constants'; // <--- NEW IMPORT
import '../../App.css'; 

function CategoryPills({ selectedCategory, onSelect }) {
  const scrollRef = useRef(null);

  const handleWheel = (e) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="category-pills-container" onWheel={handleWheel} ref={scrollRef}>
      {CATEGORIES.map((cat) => {
        // Handle "All Categories" logic
        const isActive = selectedCategory === cat || (cat === 'All Categories' && !selectedCategory);
        
        return (
          <button
            key={cat}
            className={`category-pill ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(cat)}
          >
            {cat === 'All Categories' ? 'All' : cat}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryPills;
