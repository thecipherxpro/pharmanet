import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  saveToCache,
  getFromCache,
  isOnline,
  updateLastSync,
  getLastSync,
  CACHE_KEYS,
} from './OfflineStorage';

/**
 * Hook for offline-first data fetching
 * Caches data to localStorage and serves from cache when offline
 */
export function useOfflineData(queryKey, fetchFn, options = {}) {
  const {
    cacheKey,
    enabled = true,
    staleTime = 30000,
    cacheMaxAge = 24 * 60 * 60 * 1000, // 24 hours
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const queryClient = useQueryClient();

  const storageKey = cacheKey || queryKey.join('_');

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Try to get cached data first
    const cachedData = getFromCache(storageKey, cacheMaxAge);
    
    if (cachedData) {
      setData(cachedData);
      setIsFromCache(true);
      setIsLoading(false);
    }

    // If offline, use cached data only
    if (!isOnline()) {
      if (!cachedData) {
        setError(new Error('No cached data available offline'));
      }
      setIsLoading(false);
      return;
    }

    // Fetch fresh data when online
    try {
      const freshData = await fetchFn();
      setData(freshData);
      setIsFromCache(false);
      setError(null);
      
      // Save to cache
      saveToCache(storageKey, freshData);
      updateLastSync();
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err);
      
      // Fall back to cached data on error
      if (cachedData) {
        setData(cachedData);
        setIsFromCache(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetchFn, storageKey, cacheMaxAge]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (enabled) {
        fetchData();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, fetchData]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    return fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    refetch,
    lastSync: getLastSync(),
  };
}

/**
 * Hook to cache React Query data to localStorage
 */
export function useCacheSync(queryKey, data, cacheKey) {
  useEffect(() => {
    if (data && isOnline()) {
      saveToCache(cacheKey || queryKey.join('_'), data);
    }
  }, [data, queryKey, cacheKey]);
}

/**
 * Get cached data for initial load
 */
export function getCachedInitialData(cacheKey) {
  return getFromCache(cacheKey) || undefined;
}

export { CACHE_KEYS, isOnline, getLastSync };