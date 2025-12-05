import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmployerOnly } from "../components/auth/RouteProtection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Step Components
import DatesTimesStep from "../components/postShift/DatesTimesStep";
import ShiftInfoStep from "../components/postShift/ShiftInfoStep";
import RequirementsStep from "../components/postShift/RequirementsStep";

const steps = [
  { id: 1, title: "Schedule", component: DatesTimesStep },
  { id: 2, title: "Details", component: ShiftInfoStep },
  { id: 3, title: "Requirements", component: RequirementsStep }
];

function EditShiftContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shiftId = searchParams.get('id');

  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  const [formData, setFormData] = useState({
    schedule: [{
      date: "",
      start_time: "09:00",
      end_time: "17:00",
      hourly_rate: 50,
      is_manual_rate: false,
    }],
    title: "",
    description: "",
    shiftType: "",
    shiftIncludes: {
      assistant_on_site: false,
      vaccination_injections: false,
      addiction_dispensing: false,
      methadone_suboxone: false
    },
    requirements: {
      years_experience: 0,
      software_experience: []
    }
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      setError("Authentication error");
    }
  };

  // Fetch shift data
  const { data: shift, isLoading: shiftLoading } = useQuery({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      const shifts = await base44.entities.Shift.filter({ id: shiftId });
      return shifts[0];
    },
    enabled: !!shiftId && !!user
  });

  // Populate form with existing shift data
  useEffect(() => {
    if (shift && initializing) {
      // Load from schedule array (new) or shift_dates (legacy fallback)
      let schedule = [];
      
      if (shift.schedule && shift.schedule.length > 0) {
        schedule = shift.schedule.map(d => ({
          date: d.date,
          start_time: d.start_time,
          end_time: d.end_time,
          hourly_rate: d.hourly_rate || 50,
          is_manual_rate: d.is_manual_rate || false,
        }));
      } else if (shift.shift_dates && shift.shift_dates.length > 0) {
        // Legacy fallback
        schedule = shift.shift_dates.map(d => ({
          date: d.date,
          start_time: d.start_time,
          end_time: d.end_time,
          hourly_rate: 50,
          is_manual_rate: false,
        }));
      } else {
        schedule = [{
          date: "",
          start_time: "09:00",
          end_time: "17:00",
          hourly_rate: 50,
          is_manual_rate: false,
        }];
      }

      setFormData({
        schedule: schedule,
        title: shift.title || "",
        description: shift.description || "",
        shiftType: shift.shift_type || "",
        shiftIncludes: shift.shift_includes || {
          assistant_on_site: false,
          vaccination_injections: false,
          addiction_dispensing: false,
          methadone_suboxone: false
        },
        requirements: shift.requirements || {
          years_experience: 0,
          software_experience: []
        }
      });
      setInitializing(false);
    }
  }, [shift, initializing]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    const schedule = formData.schedule || [];
    switch (currentStep) {
      case 1:
        return schedule.length > 0 && schedule.every(d => d.date && d.start_time && d.end_time);
      case 2:
        return formData.title && formData.description && formData.shiftType;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!shift) {
      setError("Shift not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { RateCalculator } = await import("../components/shift/RateCalculator");

      const schedule = formData.schedule || [];
      
      // Process schedule items with per-date rates
      let overallMaxRate = 0;
      let totalHours = 0;
      let totalPay = 0;
      let earliestDaysAhead = 9999;

      const processedSchedule = schedule.map(item => {
        if (!item.date || !item.start_time || !item.end_time) return item;

        const [year, month, day] = item.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        dateObj.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const itemDaysAhead = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (itemDaysAhead < earliestDaysAhead) earliestDaysAhead = itemDaysAhead;

        const { rate: dynamicMinRate } = RateCalculator.calculateRate(itemDaysAhead);
        const effectiveRate = item.is_manual_rate && item.hourly_rate >= dynamicMinRate ? item.hourly_rate : dynamicMinRate;

        const [startHour, startMin] = item.start_time.split(':').map(Number);
        const [endHour, endMin] = item.end_time.split(':').map(Number);
        const hours = (endHour + endMin / 60) - (startHour + startMin / 60);

        totalHours += hours;
        totalPay += hours * effectiveRate;
        if (effectiveRate > overallMaxRate) overallMaxRate = effectiveRate;

        return { ...item, hourly_rate: effectiveRate };
      });

      const { urgency: overallUrgency } = RateCalculator.calculateRate(earliestDaysAhead);
      
      const updatedShift = {
        title: formData.title,
        description: formData.description,
        shift_type: formData.shiftType,
        schedule: processedSchedule,
        hourly_rate: overallMaxRate,
        pricing_tier: overallUrgency,
        days_ahead: earliestDaysAhead,
        total_hours: totalHours,
        total_pay: totalPay,
        shift_includes: formData.shiftIncludes,
        requirements: formData.requirements
      };

      await base44.entities.Shift.update(shift.id, updatedShift);
      
      navigate(createPageUrl("MyShifts"));
    } catch (err) {
      console.error("Error updating shift:", err);
      setError(err.message || "Failed to update shift. Please try again.");
    }
    setLoading(false);
  };

  if (shiftLoading || initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading shift...</p>
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shift Not Found</h2>
          <Button onClick={() => navigate(createPageUrl("MyShifts"))}>
            Back to My Shifts
          </Button>
        </div>
      </div>
    );
  }

  // Check if shift can be edited
  if (shift.status !== 'open') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Edit Shift</h2>
          <p className="text-gray-600 mb-4">
            Only open shifts can be edited. This shift is currently {shift.status}.
          </p>
          <Button onClick={() => navigate(createPageUrl("MyShifts"))}>
            Back to My Shifts
          </Button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => currentStep === 1 ? navigate(createPageUrl("MyShifts")) : handleBack()}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">Edit Shift</h1>
              <p className="text-sm text-gray-600">
                {shift.pharmacy_name} • Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full transition-all ${
                  step.id <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 border-gray-300"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Shift
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditShift() {
  return (
    <EmployerOnly>
      <EditShiftContent />
    </EmployerOnly>
  );
}