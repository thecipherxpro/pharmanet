/**
 * Offline Storage Utility
 * Manages localStorage caching for offline PWA support
 */

const CACHE_PREFIX = 'pharmanet_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Cache keys
export const CACHE_KEYS = {
  USER: 'user',
  SHIFTS: 'shifts',
  APPLICATIONS: 'my_applications',
  UPCOMING_SHIFTS: 'upcoming_shifts',
  PHARMACIES: 'pharmacies',
  NOTIFICATIONS: 'notifications',
  INVITATIONS: 'invitations',
  REVIEWS: 'reviews',
  LAST_SYNC: 'last_sync',
};

/**
 * Save data to localStorage with timestamp
 */
export function saveToCache(key, data) {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.warn('Failed to save to cache:', error);
    return false;
  }
}

/**
 * Get data from localStorage, checking expiry
 */
export function getFromCache(key, maxAge = CACHE_EXPIRY) {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age > maxAge) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Failed to get from cache:', error);
    return null;
  }
}

/**
 * Remove specific cache entry
 */
export function removeFromCache(key) {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clear all cached data
 */
export function clearAllCache() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get cache age in minutes
 */
export function getCacheAge(key) {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { timestamp } = JSON.parse(cached);
    return Math.floor((Date.now() - timestamp) / 60000);
  } catch (error) {
    return null;
  }
}

/**
 * Check if we're online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Queue action for when online
 */
const PENDING_ACTIONS_KEY = `${CACHE_PREFIX}pending_actions`;

export function queueOfflineAction(action) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
    pending.push({
      ...action,
      queuedAt: Date.now(),
    });
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
    return true;
  } catch (error) {
    return false;
  }
}

export function getPendingActions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

export function clearPendingActions() {
  localStorage.removeItem(PENDING_ACTIONS_KEY);
}

/**
 * Sync manager - tracks last successful sync
 */
export function updateLastSync() {
  saveToCache(CACHE_KEYS.LAST_SYNC, { syncedAt: new Date().toISOString() });
}

export function getLastSync() {
  const data = getFromCache(CACHE_KEYS.LAST_SYNC, Infinity);
  return data?.syncedAt || null;
}