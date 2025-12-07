// In file: src/components/ui/CategoryPills.js
import React, { useRef } from 'react';
import '../../App.css'; 

function CategoryPills({ selectedCategory, onSelect }) {
  const scrollRef = useRef(null);

  // UPDATED: Matches the new Gatekeeper Service categories
  const categories = [
    'All Categories',
    'Politics',
    'Global Conflict',
    'Economy',
    'Justice',
    'Science',
    'Tech',
    'Health',
    'Education',
    'Business',
    'Sports',
    'Entertainment',
    'Lifestyle',
    'Human Interest',
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
