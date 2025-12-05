import { useEffect } from 'react';

/**
 * Keyboard Shortcuts Hook
 * Adds keyboard navigation to onboarding flow
 */
export const useKeyboardShortcuts = ({ onNext, onBack, canGoNext, currentStep, totalSteps }) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Enter or Right Arrow = Next
      if ((e.key === 'Enter' || e.key === 'ArrowRight') && canGoNext && onNext) {
        e.preventDefault();
        onNext();
      }

      // Left Arrow = Back
      if (e.key === 'ArrowLeft' && currentStep > 1 && onBack) {
        e.preventDefault();
        onBack();
      }

      // Escape = Show help/cancel
      if (e.key === 'Escape') {
        // Could trigger help modal or confirmation dialog
        console.log('Escape pressed');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNext, onBack, canGoNext, currentStep, totalSteps]);
};

export default useKeyboardShortcuts;