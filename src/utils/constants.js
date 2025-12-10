// src/utils/constants.js

// --- 1. FALLBACK IMAGES (Smart Category Matching) ---
// These are high-quality, abstract/minimalist images from Unsplash to keep the UI premium.
export const CATEGORY_IMAGES = {
  'Politics': 'https://images.unsplash.com/photo-1529101091760-6149d3c80a9c?auto=format&fit=crop&w=800&q=80',
  'Global Conflict': 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&w=800&q=80',
  'Economy': 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80',
  'Business': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  'Justice': 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
  'Science': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
  'Tech': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'Health': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
  'Education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
  'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  'Entertainment': 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=800&q=80',
  'Lifestyle': 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=800&q=80',
  'Human Interest': 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
  'Other': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
  'Default': 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80' // Newspaper abstract
};

/**
 * Returns a fallback image based on the article category.
 */
export const getFallbackImage = (category) => {
  if (!category) return CATEGORY_IMAGES['Default'];
  // Normalize category string to title case or match keys
  const key = Object.keys(CATEGORY_IMAGES).find(k => k.toLowerCase() === category.toLowerCase());
  return key ? CATEGORY_IMAGES[key] : CATEGORY_IMAGES['Default'];
};

// --- 2. CONFIGURATION LISTS (Single Source of Truth) ---

export const CATEGORIES = [
  'All Categories',
  'Politics',
  'Global Conflict',
  'Economy',
  'Business', // Added Business here as discussed
  'Justice',
  'Science',
  'Tech',
  'Health',
  'Education',
  'Sports',
  'Entertainment',
  'Lifestyle',
  'Human Interest',
  'Other'
];

export const LEANS = [
  'All Leans', 
  'Left', 
  'Left-Leaning', 
  'Center', 
  'Right-Leaning', 
  'Right', 
  'Not Applicable'
];

export const REGIONS = [
  { value: 'All', label: 'All Regions' },
  { value: 'Global', label: 'Global' },
  { value: 'India', label: 'India' }
];

export const ARTICLE_TYPES = [
  { value: 'All Types', label: 'All Article Types' },
  { value: 'Hard News', label: 'Hard News (Deep Analysis)' },
  { value: 'Opinion & Reviews', label: 'Opinion & Reviews (Tone Only)' }
];

export const SORT_OPTIONS = [
  'Latest First', 
  'Highest Quality', 
  'Most Covered', 
  'Lowest Bias'
];

export const QUALITY_LEVELS = [
  { value: 'All Quality Levels', label: 'All Quality Levels' },
  { value: 'A+ Excellent (90-100)', label: 'A+ : Excellent' },
  { value: 'A High (80-89)', label: 'A : High' },
  { value: 'B Professional (70-79)', label: 'B : Professional' },
  { value: 'C Acceptable (60-69)', label: 'C : Acceptable' },
  { value: 'D-F Poor (0-59)', label: 'D-F : Poor' }
];
