import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { PersonalInfoStep, PayrollStep } from "../components/onboarding/PharmacistOnboardingSteps";
import ProgressTracker from "../components/onboarding/ProgressTracker";
import { Button } from "@/components/ui/button";
import PharmacistSuccessScreen from "../components/onboarding/PharmacistSuccessScreen";
import AgreementStep from "../components/onboarding/AgreementStep";
import OnboardingErrorBoundary from "../components/onboarding/ErrorBoundary";

const STEPS = [
  { id: 1, name: "Personal", label: "Personal Info" },
  { id: 2, name: "Payroll", label: "Payroll" },
  { id: 3, name: "Agreement", label: "Terms & Policies" },
  { id: 4, name: "Complete", label: "Complete" }
];

function PharmacistOnboardingContent() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      // Check if already completed onboarding
      if (userData.onboarding_completed) {
        navigate(createPageUrl("PharmacistDashboard"), { replace: true });
        return;
      }

      // Resume from saved step
      if (userData.onboarding_step && userData.onboarding_step > 1 && userData.onboarding_step <= 3) {
        setCurrentStep(userData.onboarding_step);
      }
    } catch (error) {
      console.error("Error loading user:", error);

      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      setError("Failed to load your profile. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (nextStep) => {
    // Save progress to backend
    try {
      await base44.auth.updateMe({ onboarding_step: nextStep });
      // Refresh user data
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (e) {
      console.error("Failed to save step progress:", e);
    }
    setCurrentStep(nextStep);
  };

  const handleBack = async (prevStep) => {
    setCurrentStep(prevStep);
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);

      // Sync public profile
      try {
        await base44.functions.invoke('syncPublicPharmacistProfile');
      } catch (syncError) {
        console.error("Profile sync error:", syncError);
      }

      // Mark onboarding as completed
      await base44.auth.updateMe({
        onboarding_completed: true,
        onboarding_step: 4
      });

      // Send welcome email
      try {
        await base44.functions.invoke('sendWelcomeEmail', {
          email: user.email,
          name: user.full_name,
          userType: 'pharmacist'
        });
      } catch (emailError) {
        console.error("Welcome email error:", emailError);
      }

      setCurrentStep(4);
      setCompleting(false);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setError("Failed to complete setup. Please try again.");
      setCompleting(false);
    }
  };

  const handleFinalComplete = () => {
    navigate(createPageUrl("PharmacistDashboard"), { replace: true });
  };

  const handleCancel = () => {
    navigate(createPageUrl("PharmacistDashboard"), { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium text-gray-900">Loading your profile...</p>
          <p className="text-xs text-gray-500 mt-1">This should only take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setError(null);
                loadUser();
              }}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("PharmacistDashboard"))}
              variant="outline"
              className="w-full h-12"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Title with Cancel Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                {currentStep === 4 ? "Setup Complete!" : "Pharmacist Setup"}
              </h1>
              {currentStep < 4 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete your profile to start finding shifts
                </p>
              )}
            </div>
            {/* Cancel/Exit Button */}
            {currentStep < 4 && (
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                title="Exit onboarding"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress Tracker */}
          {currentStep < 4 && <ProgressTracker steps={STEPS.slice(0, -1)} currentStep={currentStep} />}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-28">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <PersonalInfoStep
                  user={user}
                  setUser={setUser}
                  onNext={() => handleStepComplete(2)}
                  onCancel={handleCancel}
                  stepNumber={1}
                />
              )}

              {currentStep === 2 && (
                <PayrollStep
                  user={user}
                  onNext={() => handleStepComplete(3)}
                  onBack={() => handleBack(1)}
                  stepNumber={2}
                />
              )}

              {currentStep === 3 && (
                <AgreementStep
                  user={user}
                  onNext={handleComplete}
                  onBack={() => handleBack(2)}
                  stepNumber={3}
                  userType="pharmacist"
                  isCompleting={completing}
                />
              )}

              {currentStep === 4 && (
                <PharmacistSuccessScreen onComplete={handleFinalComplete} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function PharmacistOnboarding() {
  return (
    <OnboardingErrorBoundary>
      <PharmacistOnly>
        <PharmacistOnboardingContent />
      </PharmacistOnly>
    </OnboardingErrorBoundary>
  );
}