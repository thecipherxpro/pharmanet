import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import PolicyDrawer from "./PolicyDrawer";
import { PRICING_POLICY, CANCELLATION_POLICY, PRIVACY_POLICY } from "./policyContent";
import { motion } from "framer-motion";

export default function AgreementStep({ user, onNext, onBack, stepNumber, userType, isCompleting = false }) {
  const [agreements, setAgreements] = useState({
    pricing: false,
    cancellation: false,
    privacy: false
  });
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const policies = [
    {
      id: "pricing",
      name: "Pharmanet Pricing Model Policy",
      description: "Understand how shift rates are calculated",
      data: PRICING_POLICY,
      icon: "💰"
    },
    {
      id: "cancellation",
      name: "Cancellation Policy",
      description: "Terms for cancelling accepted shifts",
      data: CANCELLATION_POLICY,
      icon: "⚠️"
    },
    {
      id: "privacy",
      name: "Consent to Communicate & Privacy Policy",
      description: "How we use and protect your information",
      data: PRIVACY_POLICY,
      icon: "🔒"
    }
  ];

  const allAgreed = agreements.pricing && agreements.cancellation && agreements.privacy;

  const handlePolicyClick = (policy) => {
    setSelectedPolicy(policy.data);
    setDrawerOpen(true);
  };

  const handleToggleAgreement = (policyId) => {
    setAgreements(prev => ({
      ...prev,
      [policyId]: !prev[policyId]
    }));
  };

  const handleFinish = async () => {
    if (!allAgreed) {
      setError("Please agree to all policies to continue");
      return;
    }

    setSaving(true);
    setError(null);

    const attemptSave = async (attempt = 1) => {
      try {
        const now = new Date().toISOString();
        
        // Record policy agreement
        await base44.entities.PolicyAgreement.create({
          user_id: user.id,
          user_email: user.email,
          user_type: userType,
          pricing_policy_agreed: true,
          pricing_policy_agreed_at: now,
          cancellation_policy_agreed: true,
          cancellation_policy_agreed_at: now,
          privacy_policy_agreed: true,
          privacy_policy_agreed_at: now,
          all_policies_agreed: true,
          version: "1.0"
        });

        // Update user with policy agreement flag
        await base44.auth.updateMe({
          policies_agreed: true,
          policies_agreed_at: now,
          onboarding_step: stepNumber + 1
        });

        onNext();
      } catch (error) {
        console.error(`Error saving policy agreement (attempt ${attempt}):`, error);
        
        if (attempt < 3) {
          // Retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          return attemptSave(attempt + 1);
        }
        
        setRetryCount(prev => prev + 1);
        setError(
          retryCount >= 2 
            ? "Network issues persist. You can try again or continue anyway - your agreements will be saved when connection is restored."
            : "Failed to save your agreement. Please try again."
        );
      } finally {
        setSaving(false);
      }
    };

    await attemptSave();
  };

  // Allow continuing after multiple failures
  const handleContinueAnyway = async () => {
    // Save locally that user agreed
    localStorage.setItem('pharmanet_policies_agreed', JSON.stringify({
      user_id: user.id,
      agreed_at: new Date().toISOString(),
      policies: ['pricing', 'cancellation', 'privacy']
    }));
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms & Policies</h2>
        <p className="text-sm text-gray-600">Please review and agree to continue</p>
      </div>

      {/* Policy List */}
      <div className="space-y-3">
        {policies.map((policy, index) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 text-xl">
                  {policy.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handlePolicyClick(policy)}
                    className="text-left hover:text-teal-600 transition-colors group w-full"
                  >
                    <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:underline">
                      {policy.name}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {policy.description}
                    </p>
                  </button>
                </div>
                <button
                  onClick={() => handlePolicyClick(policy)}
                  className="flex-shrink-0 text-teal-600 hover:text-teal-700 text-xs font-medium flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Read
                </button>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                <Checkbox
                  id={`agree-${policy.id}`}
                  checked={agreements[policy.id]}
                  onCheckedChange={() => handleToggleAgreement(policy.id)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`agree-${policy.id}`}
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  I have read and agree to the <strong>{policy.name}</strong>
                </label>
                {agreements[policy.id] && (
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Master Agreement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`bg-gradient-to-r ${
          allAgreed 
            ? 'from-teal-50 to-cyan-50 border-teal-300' 
            : 'from-gray-50 to-gray-100 border-gray-300'
        } rounded-xl p-4 border-2 transition-all duration-300`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            allAgreed ? 'bg-teal-500' : 'bg-gray-300'
          } transition-colors`}>
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">
              {allAgreed ? "✓ All policies accepted" : "Accept all policies to continue"}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {allAgreed 
                ? "You're ready to start using Pharmanet" 
                : `${Object.values(agreements).filter(Boolean).length} of 3 accepted`
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error Message with Retry Option */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              {retryCount >= 2 && allAgreed && (
                <button
                  onClick={handleContinueAnyway}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium mt-2 underline"
                >
                  Continue anyway →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 h-12"
          disabled={saving}
        >
          Back
        </Button>
        <Button
          onClick={handleFinish}
          disabled={!allAgreed || saving || isCompleting}
          className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold"
        >
          {(saving || isCompleting) ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Completing...</span>
            </div>
          ) : (
            "Complete Setup"
          )}
        </Button>
      </div>

      {/* Policy Drawer */}
      <PolicyDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        policy={selectedPolicy}
      />
    </div>
  );
}