// src/components/ui/CategoryPills.tsx
import React, { useRef, useEffect } from 'react';
import './CategoryPills.css'; // Ensure this file exists, or the styles below will handle it

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
      style={{
          // INLINE STYLE OVERRIDE FOR SPACING
          paddingTop: '4px',    /* Reduced from standard spacing */
          paddingBottom: '8px',
          paddingLeft: '12px',
          paddingRight: '12px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
          marginBottom: '0px'
      }}
    >
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`pill ${selectedCategory === category ? 'active' : ''}`}
          style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: selectedCategory === category ? 'var(--primary, #007bff)' : 'var(--surface-hover, #f0f0f0)',
              color: selectedCategory === category ? '#fff' : 'var(--text-secondary, #666)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease'
          }}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryPills;
