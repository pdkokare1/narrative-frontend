// src/components/ui/CategoryPills.tsx
import React, { useRef, useEffect } from 'react';
import './CategoryPills.css';

interface CategoryPillsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected category
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedEl = scrollContainerRef.current.querySelector('.pill.active') as HTMLElement;
      if (selectedEl) {
        const container = scrollContainerRef.current;
        const scrollLeft = selectedEl.offsetLeft - container.offsetWidth / 2 + selectedEl.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedCategory]);

  return (
    <div 
      className="category-pills-container" 
      ref={scrollContainerRef}
    >
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`pill ${selectedCategory === category ? 'active' : ''}`}
          type="button"
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryPills;
