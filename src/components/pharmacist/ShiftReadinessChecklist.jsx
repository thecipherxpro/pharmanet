import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User,
  CreditCard,
  DollarSign,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ShiftReadinessChecklist({ onComplete, showAsGate = false }) {
  const navigate = useNavigate();

  const { data: checklistData, isLoading, refetch } = useQuery({
    queryKey: ['pharmacist-shift-readiness'],
    queryFn: async () => {
      const user = await base44.auth.me();
      
      // Use backend function to get profile data via service role
      let publicProfile = null;
      let payrollPreference = null;
      
      try {
        const response = await base44.functions.invoke('getPharmacistOwnProfile', {});
        publicProfile = response.data?.public_profile || null;
        payrollPreference = response.data?.payroll || null;
      } catch (e) {
        console.log('Error loading profile data:', e);
      }

      // Check 1: Public Profile Completeness
      let publicProfileComplete = false;
      if (publicProfile) {
        publicProfileComplete = !!(
          publicProfile.full_name &&
          publicProfile.license_number &&
          publicProfile.phone &&
          publicProfile.bio &&
          publicProfile.software_experience?.length > 0 &&
          publicProfile.preferred_regions?.length > 0
        );
      }

      // Check 2: Payment Card Added
      let hasPaymentCard = false;
      try {
        const cards = await base44.entities.WalletCard.filter({});
        hasPaymentCard = cards.length > 0;
      } catch (e) {
        console.log('No payment cards');
      }

      // Check 3: Payroll Configured
      let hasPayroll = false;
      if (payrollPreference) {
        hasPayroll = !!(
          payrollPreference.method &&
          payrollPreference.legal_first_name &&
          payrollPreference.legal_last_name
        );
      }

      const allComplete = publicProfileComplete && hasPaymentCard && hasPayroll;

      return {
        user,
        publicProfile,
        payrollPreference,
        checks: {
          publicProfile: publicProfileComplete,
          paymentCard: hasPaymentCard,
          payroll: hasPayroll
        },
        allComplete,
        completionPercentage: [publicProfileComplete, hasPaymentCard, hasPayroll].filter(Boolean).length / 3 * 100
      };
    },
    staleTime: 30000 // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const { checks, allComplete, completionPercentage } = checklistData || { checks: {}, allComplete: false, completionPercentage: 0 };

  // If all checks pass, hide the checklist completely and grant full access
  if (allComplete) {
    if (onComplete) {
      onComplete();
    }
    return null;
  }

  const checklistItems = [
    {
      id: 'publicProfile',
      title: 'Complete Public Profile',
      description: 'Add your bio, software experience, and preferred work regions',
      icon: User,
      complete: checks.publicProfile,
      action: () => navigate(createPageUrl('PharmacistProfile')),
      actionLabel: 'Complete Profile'
    },
    {
      id: 'paymentCard',
      title: 'Add Payment Card',
      description: 'Required for cancellation policy and platform fees',
      icon: CreditCard,
      complete: checks.paymentCard,
      action: () => navigate(createPageUrl('PharmacistWallet')),
      actionLabel: 'Add Card'
    },
    {
      id: 'payroll',
      title: 'Configure Payroll',
      description: 'Set up how you want to receive shift payments',
      icon: DollarSign,
      complete: checks.payroll,
      action: () => navigate(createPageUrl('PharmacistSettings')),
      actionLabel: 'Set Up Payroll'
    }
  ];

  if (showAsGate && !allComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Setup</h2>
            <p className="text-sm text-gray-600">
              Before you can accept shifts, please complete the following requirements:
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Setup Progress</span>
              <span className="font-medium text-teal-600">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div 
                key={item.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  item.complete 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-teal-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.complete ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {item.complete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <item.icon className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${item.complete ? 'text-green-700' : 'text-gray-900'}`}>
                        {item.title}
                      </h3>
                      {item.complete && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Done</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    {!item.complete && (
                      <Button 
                        size="sm" 
                        onClick={item.action}
                        className="mt-2 h-8 bg-teal-600 hover:bg-teal-700 text-xs"
                      >
                        {item.actionLabel}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-6"
            onClick={() => navigate(createPageUrl('PharmacistDashboard'))}
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Inline checklist view (for dashboard or profile)
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Shift Readiness</h3>
          <p className="text-xs text-gray-500">Complete all items to accept shifts</p>
        </div>
        {allComplete ? (
          <Badge className="bg-green-100 text-green-700">Ready</Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600 border-amber-200">
            {Math.round(completionPercentage)}% Complete
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {checklistItems.map((item) => (
          <button
            key={item.id}
            onClick={!item.complete ? item.action : undefined}
            disabled={item.complete}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
              item.complete 
                ? 'bg-green-50 cursor-default' 
                : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
            }`}
          >
            {item.complete ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={`text-sm flex-1 ${item.complete ? 'text-green-700' : 'text-gray-700'}`}>
              {item.title}
            </span>
            {!item.complete && (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}

// Hook to check shift readiness
export function useShiftReadiness() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pharmacist-shift-readiness-check'],
    queryFn: async () => {
      const user = await base44.auth.me();
      
      // Quick checks
      let publicProfileComplete = false;
      let hasPaymentCard = false;
      let hasPayroll = false;

      // Use backend function to get profile data
      try {
        const response = await base44.functions.invoke('getPharmacistOwnProfile', {});
        const publicProfile = response.data?.public_profile;
        const payrollPref = response.data?.payroll;
        
        if (publicProfile) {
          publicProfileComplete = !!(publicProfile.full_name && publicProfile.license_number && publicProfile.phone && publicProfile.bio && publicProfile.software_experience?.length > 0);
        }
        
        if (payrollPref) {
          hasPayroll = !!(payrollPref.method && payrollPref.legal_first_name);
        }
      } catch (e) {
        console.log('Error loading profile data:', e);
      }

      try {
        const cards = await base44.entities.WalletCard.filter({});
        hasPaymentCard = cards.length > 0;
      } catch (e) {}

      return {
        isReady: publicProfileComplete && hasPaymentCard && hasPayroll,
        checks: { publicProfileComplete, hasPaymentCard, hasPayroll }
      };
    },
    staleTime: 60000
  });

  return {
    isReady: data?.isReady || false,
    checks: data?.checks || {},
    isLoading,
    refetch
  };
}