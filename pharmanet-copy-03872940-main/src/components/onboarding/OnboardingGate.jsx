import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function OnboardingGate({ userType, children }) {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleCompleteProfile = () => {
    if (userType === 'employer') {
      navigate(createPageUrl("EmployerOnboarding"));
    } else {
      navigate(createPageUrl("PharmacistOnboarding"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check the appropriate onboarding flag based on user type
  const isOnboardingComplete = userType === 'employer' 
    ? user?.employer_onboarding_completed 
    : user?.onboarding_completed;

  if (isOnboardingComplete) {
    return children;
  }

  // Show gate - user needs to complete onboarding
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 pb-24 md:pb-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="p-6 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
            Complete Your Onboarding
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-6 text-center">
            Please complete the onboarding process to access all features.
          </p>

          <Button
            onClick={handleCompleteProfile}
            className="w-full h-11 sm:h-12 bg-teal-600 hover:bg-teal-700 text-sm sm:text-base"
          >
            Complete Onboarding
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
            This only takes a few minutes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}