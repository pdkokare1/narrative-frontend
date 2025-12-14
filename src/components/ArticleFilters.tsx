// src/components/ArticleFilters.tsx
import React, { useState, useRef, useEffect } from 'react';
import { IFilters } from '../types';
import './ArticleFilters.css';

interface ArticleFiltersProps {
  filters: IFilters;
  onChange: (newFilters: IFilters) => void;
}

const ArticleFilters: React.FC<ArticleFiltersProps> = ({ filters, onChange }) => {
  return (
    <div className="filters-container">
      {/* 1. Category Filter */}
      <FilterDropdown 
        label="Category" 
        value={filters.category || 'All Categories'} 
        options={[
          'All Categories', 'Politics', 'Business', 'Economy', 'Global Conflict', 
          'Tech', 'Science', 'Health', 'Justice', 'Sports', 'Entertainment'
        ]}
        onSelect={(val) => onChange({ ...filters, category: val })}
      />

      {/* 2. Lean (Bias) Filter */}
      <FilterDropdown 
        label="Lean" 
        value={filters.lean || 'All Leans'} 
        options={['All Leans', 'Left', 'Left-Leaning', 'Center', 'Right-Leaning', 'Right']}
        onSelect={(val) => onChange({ ...filters, lean: val })}
      />

      {/* 3. Quality Filter */}
      <FilterDropdown 
        label="Quality" 
        value={filters.quality || 'All Quality Levels'} 
        options={[
            'All Quality Levels', 
            'A+ Excellent (90-100)', 
            'A High (80-89)', 
            'B Professional (70-79)', 
            'C Acceptable (60-69)'
        ]}
        onSelect={(val) => onChange({ ...filters, quality: val })}
      />

      {/* 4. Sort Order */}
      <FilterDropdown 
        label="Sort" 
        value={filters.sort || 'Latest First'} 
        options={['Latest First', 'Highest Quality', 'Most Covered', 'Lowest Bias']}
        onSelect={(val) => onChange({ ...filters, sort: val })}
      />
    </div>
  );
};

// --- Reusable Internal Dropdown Component ---
interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
}

const FilterDropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-select-container" ref={wrapperRef}>
      <div 
        className={`custom-select-value ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value}</span>
        <svg className="custom-select-arrow" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>

      {isOpen && (
        <ul className="custom-select-options">
          {options.map((option) => (
            <li 
              key={option} 
              className={`custom-select-option ${option === value ? 'selected' : ''}`}
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ArticleFilters;
