// src/components/ui/CategoryPills.tsx
import React, { useRef } from 'react';
import { CATEGORIES } from '../../utils/constants'; 
import '../../App.css'; 

interface CategoryPillsProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const CategoryPills: React.FC<CategoryPillsProps> = ({ selectedCategory, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="category-pills-container" onWheel={handleWheel} ref={scrollRef}>
      {CATEGORIES.map((cat) => {
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
};

export default CategoryPills;
