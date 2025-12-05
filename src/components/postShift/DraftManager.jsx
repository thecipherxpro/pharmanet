import React, { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Save, Trash2, AlertCircle } from "lucide-react";

/**
 * Manages draft saving/loading for shift posting
 */
export default function DraftManager({ formData, onLoadDraft, currentStep }) {
  const DRAFT_KEY = 'shiftPostingDraft';
  const DRAFT_TIMESTAMP_KEY = 'shiftPostingDraftTimestamp';

  // Auto-save draft every time formData changes
  useEffect(() => {
    if (currentStep > 1 && formData.pharmacy) {
      const draftData = {
        ...formData,
        savedStep: currentStep
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, new Date().toISOString());
    }
  }, [formData, currentStep]);

  const loadDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      onLoadDraft(parsedDraft);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
  };

  const hasDraft = () => {
    return !!localStorage.getItem(DRAFT_KEY);
  };

  const getDraftAge = () => {
    const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);
    if (!timestamp) return null;
    
    const draftDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now - draftDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  // Check for draft on mount
  useEffect(() => {
    if (hasDraft() && currentStep === 1 && !formData.pharmacy) {
      // Show draft available notification
      const event = new CustomEvent('draftAvailable', {
        detail: { age: getDraftAge(), load: loadDraft, clear: clearDraft }
      });
      window.dispatchEvent(event);
    }
  }, []);

  return null; // This is a headless component that manages draft state
}

// Hook to use draft manager
export function useDraft(formData, setFormData, setCurrentStep) {
  const [showDraftAlert, setShowDraftAlert] = React.useState(false);
  const [draftAge, setDraftAge] = React.useState('');

  useEffect(() => {
    const handleDraftAvailable = (event) => {
      setDraftAge(event.detail.age);
      setShowDraftAlert(true);
    };

    window.addEventListener('draftAvailable', handleDraftAvailable);
    return () => window.removeEventListener('draftAvailable', handleDraftAvailable);
  }, []);

  const loadDraft = () => {
    const draft = localStorage.getItem('shiftPostingDraft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      // Migrate legacy 'dates' to 'schedule' if needed
      if (parsedDraft.dates && !parsedDraft.schedule) {
        parsedDraft.schedule = parsedDraft.dates.map(d => ({
          date: d.date || '',
          start_time: d.startTime || d.start_time || '09:00',
          end_time: d.endTime || d.end_time || '17:00'
        }));
        delete parsedDraft.dates;
      }
      setFormData(parsedDraft);
      if (parsedDraft.savedStep) {
        setCurrentStep(parsedDraft.savedStep);
      }
      setShowDraftAlert(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('shiftPostingDraft');
    localStorage.removeItem('shiftPostingDraftTimestamp');
    setShowDraftAlert(false);
  };

  const DraftAlert = showDraftAlert ? (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-blue-800 text-sm">
          You have a saved draft from {draftAge}. Would you like to continue where you left off?
        </span>
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={clearDraft}
            className="h-8 text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Discard
          </Button>
          <Button
            size="sm"
            onClick={loadDraft}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-xs"
          >
            <Save className="w-3 h-3 mr-1" />
            Continue Draft
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  ) : null;

  return { DraftAlert, clearDraft };
}