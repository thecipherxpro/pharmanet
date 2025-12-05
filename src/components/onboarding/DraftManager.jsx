import { useCallback } from 'react';

/**
 * Manual Draft Manager - Only saves on Continue button click
 * NO auto-loading to prevent initialization conflicts
 */

const STORAGE_KEY_EMPLOYER = 'employer_onboarding_draft_v4';
const STORAGE_KEY_PHARMACIST = 'pharmacist_onboarding_draft_v4';

// Helper to load draft synchronously before component renders
export const loadDraftSync = (userType = 'employer') => {
  const STORAGE_KEY = userType === 'pharmacist' ? STORAGE_KEY_PHARMACIST : STORAGE_KEY_EMPLOYER;
  
  try {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      console.log('[DraftManager] Found saved draft:', draft);
      return draft;
    }
  } catch (error) {
    console.error('[DraftManager] Load failed:', error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  
  return null;
};

export const useDraftManager = (step, formData, setFormData, userType = 'employer') => {
  const STORAGE_KEY = userType === 'pharmacist' ? STORAGE_KEY_PHARMACIST : STORAGE_KEY_EMPLOYER;

  // Manual save function - called explicitly from Continue button
  const saveDraft = useCallback(() => {
    try {
      const draft = {
        step,
        data: formData,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      console.log('[DraftManager] Draft saved for step', step);
    } catch (error) {
      console.error('[DraftManager] Save failed:', error);
    }
  }, [STORAGE_KEY, step, formData]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[DraftManager] Draft cleared');
    } catch (error) {
      console.error('[DraftManager] Clear failed:', error);
    }
  }, [STORAGE_KEY]);

  const hasDraft = useCallback(() => {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  }, [STORAGE_KEY]);

  return { saveDraft, clearDraft, hasDraft };
};

export default useDraftManager;