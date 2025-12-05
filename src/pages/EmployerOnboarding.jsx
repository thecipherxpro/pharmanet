import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { EmployerOnly } from "../components/auth/RouteProtection";
import { CompanyInfoStep, PersonalInfoStep, AddPharmacyStep, PublicProfileStep } from "../components/onboarding/EmployerOnboardingSteps";
import { CheckCircle2, AlertCircle } from "lucide-react";
import SuccessCompletionScreen from "../components/onboarding/SuccessCompletionScreen";
import ProgressTracker from "../components/onboarding/ProgressTracker";
import { useDraftManager, loadDraftSync } from "../components/onboarding/DraftManager";
import { Button } from "@/components/ui/button";
import AgreementStep from "../components/onboarding/AgreementStep";
import OnboardingErrorBoundary from "../components/onboarding/ErrorBoundary";

const STEPS = [
  { id: 1, name: "Company", label: "Company Info" },
  { id: 2, name: "Personal", label: "Personal Info" },
  { id: 3, name: "Pharmacy", label: "Add Pharmacy" },
  { id: 4, name: "Profile", label: "Public Profile" },
  { id: 5, name: "Agreement", label: "Terms & Policies" },
  { id: 6, name: "Complete", label: "Complete" }
];

function EmployerOnboardingContent() {
  const navigate = useNavigate();
  
  // Load draft BEFORE initializing state to prevent conflicts
  const savedDraft = loadDraftSync('employer');
  
  // Ensure personal_address is always properly initialized, even from draft
  const getInitialFormData = () => {
    const defaults = {
      phone: "",
      bio: "",
      full_name: "",
      date_of_birth: "",
      personal_address: {
        street: "",
        city: "",
        province: "ON",
        postal_code: ""
      },
      languages_spoken: [],
      software_used: [],
      preferred_shift_types: [],
      workplace_culture: "",
      website: "",
      contact_email_public: false,
      contact_phone_public: false
    };
    
    if (!savedDraft?.data) return defaults;
    
    // Merge draft with defaults to ensure all nested objects exist
    return {
      ...defaults,
      ...savedDraft.data,
      personal_address: {
        ...defaults.personal_address,
        ...(savedDraft.data.personal_address || {})
      }
    };
  };
  
  const [currentStep, setCurrentStep] = useState(savedDraft?.step || 1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pharmacyCount, setPharmacyCount] = useState(0);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());

  // Manual draft save
  const { saveDraft, clearDraft } = useDraftManager(currentStep, formData, setFormData, 'employer');

  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      if (!mounted) return;
      console.log('[EmployerOnboarding] Loading user data...');
      await loadUser();
    };
    
    load().catch(err => {
      console.error('[EmployerOnboarding] Initial load failed:', err);
    });
    
    return () => {
      console.log('[EmployerOnboarding] Cleanup');
      mounted = false;
    };
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check authentication
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }
      
      const userData = await base44.auth.me();
      setUser(userData);

      // Fetch existing employer profile data
      const [employerProfiles, publicProfiles, pharmacies] = await Promise.all([
        base44.entities.Employer_Profile.filter({ user_id: userData.id }),
        base44.entities.Public_Employer_Profile.filter({ user_id: userData.id }),
        base44.entities.Pharmacy.filter({ created_by: userData.email })
      ]);

      const employerProfile = employerProfiles[0];
      const publicProfile = publicProfiles[0];
      setPharmacyCount(pharmacies.length);

      // Only update formData if it's still in initial state (hasn't been edited by user)
      // Check if draft was loaded - if so, don't overwrite
      const isDraftLoaded = savedDraft?.data;
      
      if (!isDraftLoaded) {
        setFormData(prev => {
          const hasUserInput = prev.phone || prev.bio || prev.full_name ||
                               (prev.personal_address && Object.values(prev.personal_address).some(val => val !== "" && val !== "ON"));

          // Phone and bio come from Public_Employer_Profile, not User entity
          const backendData = {
            phone: publicProfile?.phone || "",
            bio: publicProfile?.bio || "",
            full_name: employerProfile?.full_name || userData.full_name || "",
            date_of_birth: employerProfile?.date_of_birth || "",
            personal_address: employerProfile?.personal_address?.[0] || {
              street: "",
              city: "",
              province: "ON",
              postal_code: ""
            },
            languages_spoken: employerProfile?.languages_spoken || [],
            software_used: publicProfile?.software_used || [],
            preferred_shift_types: publicProfile?.preferred_shift_types || [],
            workplace_culture: publicProfile?.workplace_culture || "",
            website: publicProfile?.website || "",
            contact_email_public: publicProfile?.contact_email_public ?? false,
            contact_phone_public: publicProfile?.contact_phone_public ?? false
          };

          if (hasUserInput) {
            return {
              ...backendData,
              ...prev,
              personal_address: {
                ...(backendData.personal_address || {}),
                ...(prev.personal_address || {}),
              },
            };
          }
          
          return backendData;
        });
      }

      // If already completed, redirect to dashboard
      if (userData.employer_onboarding_completed) {
        navigate(createPageUrl("EmployerDashboard"), { replace: true });
        return;
      }

      // Resume from last step (but don't override if draft loaded)
      if (!isDraftLoaded) {
        const resumeStep = userData.onboarding_step || 1;
        setCurrentStep(Math.min(resumeStep, 5)); // Max step is 5
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      
      // Check if it's an auth error
      if (error?.response?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }
      
      setError("Failed to load your profile. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      // Sync public profile stats before marking complete
      try {
        await base44.functions.invoke('syncPublicEmployerProfile');
      } catch (syncError) {
        console.error("Profile sync error:", syncError);
      }

      // Mark onboarding as completed
      await base44.auth.updateMe({
        employer_onboarding_completed: true,
        onboarding_step: 6
      });

      // Send welcome email
      try {
        await base44.functions.invoke('sendWelcomeEmail', {
          email: user.email,
          name: user.full_name,
          userType: 'employer'
        });
      } catch (emailError) {
        console.error("Welcome email error:", emailError);
        // Don't block completion on email failure
      }

      // Clear draft
      clearDraft();

      // Move to success screen
      setCurrentStep(6);
      setLoading(false);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setError("Failed to complete setup. Please try again.");
      setLoading(false);
    }
  };

  const handleFinalComplete = async () => {
    // Called from success screen, cleanup
    clearDraft();
  };

  if (loading || !user) {
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

  // Error recovery screen
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
              onClick={() => navigate(createPageUrl("EmployerDashboard"))}
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
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header with Animated Progress */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold text-gray-900">
              {currentStep === 6 ? "Setup Complete!" : "Employer Setup"}
            </h1>
            {currentStep < 6 && (
              <p className="text-xs text-gray-500 mt-0.5">
                Complete your profile to start posting shifts
              </p>
            )}
          </div>

          {/* Animated Progress Tracker */}
          {currentStep < 6 && <ProgressTracker steps={STEPS.slice(0, -1)} currentStep={currentStep} />}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-3 py-4 pb-24">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {currentStep === 1 && (
            <CompanyInfoStep
              user={user}
              setUser={setUser}
              formData={formData}
              setFormData={setFormData}
              onNext={() => {
                saveDraft();
                setCurrentStep(2);
              }}
              stepNumber={1}
            />
          )}

          {currentStep === 2 && (
            <PersonalInfoStep
              user={user}
              setUser={setUser}
              formData={formData}
              setFormData={setFormData}
              onNext={() => {
                saveDraft();
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
              stepNumber={2}
            />
          )}

          {currentStep === 3 && (
            <AddPharmacyStep
              user={user}
              onNext={() => {
                saveDraft();
                setCurrentStep(4);
              }}
              onBack={() => setCurrentStep(2)}
              onSkip={() => {
                saveDraft();
                setCurrentStep(4);
              }}
              stepNumber={3}
            />
          )}

          {currentStep === 4 && (
            <PublicProfileStep
              user={user}
              formData={formData}
              setFormData={setFormData}
              onNext={() => {
                saveDraft();
                setCurrentStep(5);
              }}
              onBack={() => setCurrentStep(3)}
              stepNumber={4}
            />
          )}

          {currentStep === 5 && (
            <AgreementStep
              user={user}
              onNext={handleComplete}
              onBack={() => setCurrentStep(4)}
              stepNumber={5}
              userType="employer"
            />
          )}

          {currentStep === 6 && (
            <SuccessCompletionScreen
              pharmacyCount={pharmacyCount}
              onComplete={handleFinalComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmployerOnboarding() {
  return (
    <OnboardingErrorBoundary>
      <EmployerOnly>
        <EmployerOnboardingContent />
      </EmployerOnly>
    </OnboardingErrorBoundary>
  );
}