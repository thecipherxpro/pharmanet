import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook for optimistic UI updates
 * Updates cache immediately while mutation is in progress
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  const updateOptimistically = (queryKey, updater) => {
    // Cancel outgoing queries
    queryClient.cancelQueries({ queryKey });

    // Snapshot previous value
    const previousData = queryClient.getQueryData(queryKey);

    // Optimistically update cache
    queryClient.setQueryData(queryKey, updater);

    // Return rollback function
    return () => {
      queryClient.setQueryData(queryKey, previousData);
    };
  };

  return { updateOptimistically };
}

/**
 * Common optimistic update patterns
 */
export const OptimisticPatterns = {
  // Add item to list
  addToList: (newItem) => (oldData = []) => [...oldData, newItem],
  
  // Remove item from list
  removeFromList: (itemId) => (oldData = []) => 
    oldData.filter(item => item.id !== itemId),
  
  // Update item in list
  updateInList: (itemId, updates) => (oldData = []) =>
    oldData.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ),
  
  // Replace entire item
  replaceInList: (itemId, newItem) => (oldData = []) =>
    oldData.map(item => item.id === itemId ? newItem : item),
};