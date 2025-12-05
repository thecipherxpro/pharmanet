/**
 * Utility functions for localStorage management
 */

const STORAGE_KEYS = {
  SHIFT_FILTERS: 'pharmanet_shift_filters',
  PHARMACIST_FILTERS: 'pharmanet_pharmacist_filters',
  RECENTLY_VIEWED_SHIFTS: 'pharmanet_recently_viewed_shifts',
  RECENTLY_VIEWED_PHARMACISTS: 'pharmanet_recently_viewed_pharmacists',
};

/**
 * Save filters to localStorage
 */
export const saveFilters = (key, filters) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(filters));
  } catch (error) {
    console.error('Error saving filters:', error);
  }
};

/**
 * Load filters from localStorage
 */
export const loadFilters = (key, defaultFilters = {}) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS[key]);
    return saved ? JSON.parse(saved) : defaultFilters;
  } catch (error) {
    console.error('Error loading filters:', error);
    return defaultFilters;
  }
};

/**
 * Clear filters from localStorage
 */
export const clearFilters = (key) => {
  try {
    localStorage.removeItem(STORAGE_KEYS[key]);
  } catch (error) {
    console.error('Error clearing filters:', error);
  }
};

/**
 * Add item to recently viewed list (max 10 items)
 */
export const addToRecentlyViewed = (key, item) => {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS[key]);
    let items = existing ? JSON.parse(existing) : [];
    
    // Remove if already exists
    items = items.filter(i => i.id !== item.id);
    
    // Add to beginning
    items.unshift({
      ...item,
      viewedAt: new Date().toISOString()
    });
    
    // Keep only last 10
    items = items.slice(0, 10);
    
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(items));
  } catch (error) {
    console.error('Error adding to recently viewed:', error);
  }
};

/**
 * Get recently viewed items
 */
export const getRecentlyViewed = (key) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS[key]);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return [];
  }
};

/**
 * Clear recently viewed items
 */
export const clearRecentlyViewed = (key) => {
  try {
    localStorage.removeItem(STORAGE_KEYS[key]);
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
  }
};