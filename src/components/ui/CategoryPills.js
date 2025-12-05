// In file: src/components/ui/CategoryPills.js
import React, { useRef } from 'react';
import '../../App.css'; // We will add the specific styles in the next step

function CategoryPills({ selectedCategory, onSelect }) {
  const scrollRef = useRef(null);

  const categories = [
    'All Categories',
    'Politics',
    'Economy',
    'Technology',
    'Health',
    'Environment',
    'Justice',
    'Education',
    'Entertainment',
    'Sports',
    'Other'
  ];

  const handleWheel = (e) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="category-pills-container" onWheel={handleWheel} ref={scrollRef}>
      {categories.map((cat) => {
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
