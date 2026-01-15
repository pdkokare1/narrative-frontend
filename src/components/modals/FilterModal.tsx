// src/components/modals/FilterModal.tsx
import React, { useState } from 'react';
import CustomSelect from '../ui/CustomSelect';
import Button from '../ui/Button';
import './FilterModal.css';
import { IFilters } from '../../types';
import { 
  CATEGORIES, LEANS, REGIONS, ARTICLE_TYPES, QUALITY_LEVELS, SORT_OPTIONS 
} from '../../utils/constants';

interface FilterModalProps {
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ filters, onFilterChange, onClose }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum distance (px) to register as a swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    const isDownSwipe = distance > minSwipeDistance;
    
    if (isDownSwipe) {
      onClose();
    }
  };

  const handleChange = (e: { target: { name: string; value: string } }) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    onFilterChange({
      category: 'All Categories',
      politicalLean: 'All Leans', 
      region: 'Global',
      articleType: 'All Types',
      quality: 'All Quality Levels',
      sort: 'Latest First'
    });
  };

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal" onClick={e => e.stopPropagation()}>
        
        {/* Swipe Area: Handle + Header */}
        <div 
          className="filter-swipe-area"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="filter-drag-handle" />
          <div className="filter-header">
            <h3 className="filter-title">Filter & Sort</h3>
            <button className="filter-reset" onClick={handleReset}>Reset</button>
          </div>
        </div>

        <div className="filter-body">
          <div className="filter-row">
            <div className="filter-group-label">Sort Order</div>
            <CustomSelect name="sort" value={filters.sort || 'Latest First'} options={SORT_OPTIONS} onChange={handleChange} />
          </div>

          <div className="filter-row">
            <div className="filter-group-label">Category</div>
            <CustomSelect name="category" value={filters.category || 'All Categories'} options={CATEGORIES} onChange={handleChange} />
          </div>

          <div className="filter-row">
            <div className="filter-group-label">Political Lean</div>
            <CustomSelect name="politicalLean" value={filters.politicalLean || 'All Leans'} options={LEANS} onChange={handleChange} />
          </div>

          <div className="filter-row">
            <div className="filter-group-label">Region</div>
            <CustomSelect name="region" value={filters.region || 'Global'} options={REGIONS} onChange={handleChange} />
          </div>

          <div className="filter-row">
            <div className="filter-group-label">Article Type</div>
            <CustomSelect name="articleType" value={filters.articleType || 'All Types'} options={ARTICLE_TYPES} onChange={handleChange} />
          </div>

          <div className="filter-row">
            <div className="filter-group-label">Quality Grade</div>
            <CustomSelect name="quality" value={filters.quality || 'All Quality Levels'} options={QUALITY_LEVELS} onChange={handleChange} />
          </div>
        </div>

        <div className="filter-footer">
          <Button variant="primary" onClick={onClose} style={{ width: '100%', padding: '10px' }}>
            Apply Filters
          </Button>
        </div>

      </div>
    </div>
  );
};

export default FilterModal;
