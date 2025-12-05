/**
 * Centralized React Query Cache Configuration
 * Provides optimized stale times and cache durations for different data types
 */

// Cache time constants (in milliseconds)
export const CACHE_TIMES = {
  // User data - changes infrequently
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  
  // Shifts - need to be reasonably fresh but not constantly refetching
  SHIFTS_LIST: 2 * 60 * 1000, // 2 minutes
  SHIFT_DETAILS: 60 * 1000, // 1 minute
  
  // Applications - moderate freshness needed
  APPLICATIONS: 60 * 1000, // 1 minute
  
  // Static/semi-static data
  PHARMACIES: 5 * 60 * 1000, // 5 minutes
  PRICING_CONFIG: 10 * 60 * 1000, // 10 minutes
  PUBLIC_PROFILES: 3 * 60 * 1000, // 3 minutes
  
  // Reviews and ratings - can be stale longer
  REVIEWS: 5 * 60 * 1000, // 5 minutes
  
  // Notifications - need to be fresh
  NOTIFICATIONS: 30 * 1000, // 30 seconds
  
  // Invitations - moderate freshness
  INVITATIONS: 60 * 1000, // 1 minute
  
  // Admin data - can be slightly stale
  ADMIN_USERS: 2 * 60 * 1000, // 2 minutes
  ADMIN_STATS: 60 * 1000, // 1 minute
};

// Refetch intervals (in milliseconds) - use sparingly
export const REFETCH_INTERVALS = {
  // Only use for truly real-time data
  LIVE_SHIFTS: 60 * 1000, // 1 minute (was 10 seconds - too aggressive)
  NOTIFICATIONS: 60 * 1000, // 1 minute
  
  // Disabled by default - use on specific pages only
  DISABLED: false,
};

// Default query options for different data types
export const getQueryOptions = (type) => {
  const baseOptions = {
    refetchOnWindowFocus: false, // Disable aggressive refetching
    retry: 2,
  };

  switch (type) {
    case 'user':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.USER_PROFILE,
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      };
    
    case 'shifts':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.SHIFTS_LIST,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: 'always', // Refetch when component mounts
      };
    
    case 'applications':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.APPLICATIONS,
        gcTime: 5 * 60 * 1000,
      };
    
    case 'pharmacies':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.PHARMACIES,
        gcTime: 15 * 60 * 1000,
      };
    
    case 'profiles':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.PUBLIC_PROFILES,
        gcTime: 10 * 60 * 1000,
      };
    
    case 'reviews':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.REVIEWS,
        gcTime: 15 * 60 * 1000,
      };
    
    case 'notifications':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.NOTIFICATIONS,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true, // Keep fresh on focus
      };
    
    case 'invitations':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.INVITATIONS,
        gcTime: 5 * 60 * 1000,
      };
    
    case 'admin':
      return {
        ...baseOptions,
        staleTime: CACHE_TIMES.ADMIN_USERS,
        gcTime: 10 * 60 * 1000,
      };
    
    default:
      return {
        ...baseOptions,
        staleTime: 60 * 1000, // 1 minute default
        gcTime: 5 * 60 * 1000,
      };
  }
};

// Helper to create safe array from API response
export const ensureArray = (result) => {
  return Array.isArray(result) ? result : [];
};