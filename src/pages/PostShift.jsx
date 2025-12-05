import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmployerOnly } from "../components/auth/RouteProtection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

// Step Components
import SelectPharmacyStep from "../components/postShift/SelectPharmacyStep";
import DatesTimesStep from "../components/postShift/DatesTimesStep";
import ShiftInfoStep from "../components/postShift/ShiftInfoStep";
import RequirementsStep from "../components/postShift/RequirementsStep";
import ReviewStep from "../components/postShift/ReviewStep";
import DraftManager, { useDraft } from "../components/postShift/DraftManager";

const steps = [
  { id: 1, title: "Pharmacy", component: SelectPharmacyStep },
  { id: 2, title: "Schedule", component: DatesTimesStep },
  { id: 3, title: "Details", component: ShiftInfoStep },
  { id: 4, title: "Requirements", component: RequirementsStep },
  { id: 5, title: "Review", component: ReviewStep }
];

function PostShiftContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    pharmacy: null,
    schedule: [], // Start empty - user will add via recurring or custom flow
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

  // Draft management
  const { DraftAlert, clearDraft } = useDraft(formData, setFormData, setCurrentStep);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      setError("Please complete your profile first");
    }
  };

  const { data: pharmacies } = useQuery({
    queryKey: ['myPharmacies', user?.email],
    queryFn: () => base44.entities.Pharmacy.filter({ 
      created_by: user?.email,
      is_active: true 
    }),
    enabled: !!user,
    initialData: [],
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isDateTimeInPast = (dateString, timeString) => {
    if (!dateString || !timeString) return false;
    
    const now = new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    const shiftDateTime = new Date(year, month - 1, day, hours, minutes);
    
    return shiftDateTime < now;
  };

  const canProceed = () => {
    const schedule = formData.schedule || [];
    switch (currentStep) {
      case 1:
        return formData.pharmacy !== null;
      case 2:
        // Must have at least one shift with valid date/time not in the past
        if (schedule.length === 0) return false;
        const allDatesValid = schedule.every(d => {
          if (!d.date || !d.start_time || !d.end_time) return false;
          const isStartPast = isDateTimeInPast(d.date, d.start_time);
          const isEndPast = isDateTimeInPast(d.date, d.end_time);
          return !isStartPast && !isEndPast;
        });
        return allDatesValid;
      case 3:
        // Title must be at least 20 chars, description at least 32 chars
        const titleValid = formData.title && formData.title.length >= 20;
        const descValid = formData.description && formData.description.length >= 32;
        return titleValid && descValid && formData.shiftType;
      case 4:
        return true; // Optional step
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
      setError(null);
    } else if (!canProceed() && currentStep === 2) {
      setError("Please ensure all shift dates and times are in the future");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
        // Ensure user is loaded
        if (!user) {
          throw new Error("User not authenticated. Please log in again.");
        }

        const { RateCalculator } = await import("../components/shift/RateCalculator");

        const schedule = formData.schedule || [];
        
        // Process schedule items to calculate effective rates
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

        const shiftData = {
          employer_id: user.id,
          employer_email: user.email,
          pharmacy_id: formData.pharmacy.id,
          pharmacy_name: formData.pharmacy.pharmacy_name,
          pharmacy_address: formData.pharmacy.address,
          pharmacy_city: formData.pharmacy.city,
          pharmacy_province: formData.pharmacy.province,
          pharmacy_software: formData.pharmacy.software ? [formData.pharmacy.software] : [],
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
          requirements: formData.requirements,
          status: "open",
          assigned_to: null
        };

        const createdShift = await base44.entities.Shift.create(shiftData);
        
        console.log(`Successfully created shift with ${schedule.length} date(s):`, createdShift);
        
        // Clear draft after successful submission
        clearDraft();
        
        navigate(createPageUrl("MyShifts"));
    } catch (err) {
      console.error("Error creating shift:", err);
      setError(err.message || "Failed to create shift. Please try again.");
    }
    setLoading(false);
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Draft Manager - Headless component for auto-save */}
      <DraftManager 
        formData={formData} 
        onLoadDraft={setFormData}
        currentStep={currentStep}
      />

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Sidebar - Steps Navigation */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
          <div className="p-6 border-b border-gray-100">
            <button
              onClick={() => navigate(createPageUrl("MyShifts"))}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Shifts</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Post New Shift</h1>
            <p className="text-sm text-gray-500 mt-1">Complete all steps to publish</p>
          </div>

          {/* Steps List */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {steps.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                const isAccessible = step.id <= currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                    disabled={!isAccessible}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                      isCurrent 
                        ? 'bg-teal-50 border-2 border-teal-200' 
                        : isCompleted 
                          ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isCurrent 
                        ? 'bg-teal-600 text-white' 
                        : isCompleted 
                          ? 'bg-teal-100 text-teal-700' 
                          : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm ${isCurrent ? 'text-teal-700' : 'text-gray-700'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {step.id === 1 && 'Select location'}
                        {step.id === 2 && 'Set dates & times'}
                        {step.id === 3 && 'Title & description'}
                        {step.id === 4 && 'Optional settings'}
                        {step.id === 5 && 'Confirm & post'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Draft Button */}
          {currentStep > 1 && (
            <div className="p-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem('shiftPostingDraft', JSON.stringify({ ...formData, savedStep: currentStep }));
                  localStorage.setItem('shiftPostingDraftTimestamp', new Date().toISOString());
                }}
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between max-w-3xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{steps[currentStep - 1].title}</h2>
                <p className="text-sm text-gray-500">Step {currentStep} of 5</p>
              </div>
              <div className="flex items-center gap-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`w-10 h-1.5 rounded-full transition-all ${
                      step.id <= currentStep ? 'bg-teal-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(DraftAlert || error) && (
            <div className="max-w-3xl px-8 pt-6">
              {DraftAlert}
              {error && (
                <Alert variant="destructive" className="border-2 mt-3">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step Content */}
          <div className="flex-1 px-8 py-8 pb-32 overflow-y-auto">
            <div className="max-w-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <CurrentStepComponent
                    formData={formData}
                    updateFormData={updateFormData}
                    pharmacies={pharmacies}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Sticky Footer */}
          <div className="bg-white border-t border-gray-200 px-8 py-4 sticky bottom-0 z-10">
            <div className="max-w-3xl flex items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                {currentStep === 5 && formData.schedule?.length > 0 && (
                  <span className="font-medium text-gray-700">
                    {formData.schedule.length} shift{formData.schedule.length > 1 ? 's' : ''} ready to post
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="h-11 px-6 border-gray-300 font-medium"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                {currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || loading}
                    className="h-11 px-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="h-11 px-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Post {(formData.schedule?.length || 1) > 1 ? `${formData.schedule.length} Shifts` : 'Shift'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <button
                onClick={() => currentStep === 1 ? navigate(createPageUrl("MyShifts")) : handleBack()}
                className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Post New Shift</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Step {currentStep} of 5: {steps[currentStep - 1].title}
                </p>
                <div className="flex items-center gap-1 sm:hidden mt-1">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`w-6 h-1.5 rounded-full transition-all ${
                        step.id === currentStep ? 'bg-teal-600' : step.id < currentStep ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem('shiftPostingDraft', JSON.stringify({ ...formData, savedStep: currentStep }));
                    localStorage.setItem('shiftPostingDraftTimestamp', new Date().toISOString());
                  }}
                  className="gap-1 sm:gap-2 h-9 px-2 sm:px-3"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="hidden sm:flex gap-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    step.id <= currentStep ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Draft Alert */}
        {DraftAlert && (
          <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
            {DraftAlert}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
            <Alert variant="destructive" className="border-2">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-36">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <CurrentStepComponent
                formData={formData}
                updateFormData={updateFormData}
                pharmacies={pharmacies}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer - Positioned above Layout bottom nav */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-xl z-[60]">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex gap-2 sm:gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 border-gray-300 font-medium active:scale-95 transition-transform"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              
              {currentStep < 5 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || loading}
                  className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md active:scale-95 transition-all"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md active:scale-95 transition-all"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Post {(formData.schedule?.length || 1) > 1 ? `${formData.schedule.length} Shifts` : 'Shift'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostShift() {
  return (
    <EmployerOnly>
      <PostShiftContent />
    </EmployerOnly>
  );
}