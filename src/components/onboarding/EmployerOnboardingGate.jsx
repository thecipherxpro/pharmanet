import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2 } from "lucide-react";

export default function EmployerOnboardingGate({ children }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pharmacies = [], isLoading: pharmaciesLoading } = useQuery({
    queryKey: ['employerPharmacies', user?.email],
    queryFn: () => base44.entities.Pharmacy.filter({ created_by: user?.email }),
    enabled: !!user?.email && !user?.employer_onboarding_completed,
  });

  // Auto-mark onboarding complete when pharmacy exists
  useEffect(() => {
    const markOnboardingComplete = async () => {
      if (user && !user.employer_onboarding_completed && pharmacies.length > 0) {
        try {
          await base44.auth.updateMe({ employer_onboarding_completed: true });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        } catch (error) {
          console.error('Failed to update onboarding status:', error);
        }
      }
    };
    markOnboardingComplete();
  }, [user, pharmacies, queryClient]);

  if (userLoading || pharmaciesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if employer_onboarding_completed flag is set OR if they have pharmacies
  if (user?.employer_onboarding_completed || pharmacies.length > 0) {
    return children;
  }

  // Show gate - user needs to add at least one pharmacy
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 pb-24 md:pb-4">
      <Card className="max-w-lg w-full shadow-2xl border-2 border-gray-200">
        <CardContent className="p-6 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
            Add Your First Pharmacy
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-6 text-center">
            To start posting shifts, you need to add at least one pharmacy location.
          </p>

          <Button
            onClick={() => navigate(createPageUrl("Pharmacies"))}
            className="w-full h-11 sm:h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm sm:text-base"
          >
            Add Pharmacy
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
            This only takes a minute. You can add more pharmacies later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}