import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, UserCheck, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // If user is admin, redirect to admin dashboard
      if (userData.role === "admin" || userData.user_type === "admin") {
        navigate(createPageUrl("AdminDashboard"), { replace: true });
        return;
      }
      
      // If user already has a role, redirect them to appropriate dashboard
      if (userData.user_type) {
        if (userData.user_type === "employer") {
          navigate(createPageUrl("EmployerDashboard"), { replace: true });
        } else if (userData.user_type === "pharmacist") {
          navigate(createPageUrl("PharmacistDashboard"), { replace: true });
        }
        return;
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setLoading(false);
  };

  const selectRole = async (roleType) => {
    if (selecting) return;
    
    setSelecting(true);
    setError(null);
    console.log('🚀 Starting role selection:', roleType);
    
    try {
      // Set user_type and default values based on role
      const updateData = { 
        user_type: roleType,
        onboarding_step: 1
      };
      
      console.log('📝 Updating user with:', updateData);
      const result = await base44.auth.updateMe(updateData);
      console.log('✅ User updated successfully:', result);
      
      // Send welcome email (non-blocking) - skip if function doesn't exist
      try {
        base44.functions.invoke('sendWelcomeEmail', { user_type: roleType })
          .then(() => console.log('📧 Welcome email sent'))
          .catch(err => console.warn('⚠️ Email failed (non-critical):', err));
      } catch (err) {
        console.warn('⚠️ Welcome email function not available:', err);
      }
      
      // Small delay before redirect to ensure state update completes
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redirect
      console.log('🔄 Redirecting to dashboard...');
      const targetPage = roleType === "employer" ? "EmployerDashboard" : "PharmacistDashboard";
      navigate(createPageUrl(targetPage), { replace: true });
      
    } catch (err) {
      console.error("❌ Error selecting role:", err);
      setError(err.message || 'Failed to set role. Please try again.');
      setSelecting(false);
    }
  };

  // Show loading state while checking user
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 bg-black rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/670069211_Pharmanet.png" 
              alt="Pharmanet Logo" 
              className="w-full h-full object-contain brightness-0 invert"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Pharmanet
          </h1>
          <p className="text-sm text-gray-600">
            Select your account type
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gray-100 border border-gray-300 rounded-lg p-3"
          >
            <p className="text-gray-900 text-center text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {/* Role Cards */}
        <div className="space-y-4">
          {/* Employer Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="border-2 border-gray-200 rounded-lg p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    Employer
                  </h2>
                  <p className="text-sm text-gray-600 mb-3">
                    Post shifts and hire pharmacists
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>Manage multiple locations</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>Review qualified candidates</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>Flexible scheduling</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!selecting) selectRole("employer");
                }}
                disabled={selecting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11 font-semibold"
              >
                {selecting ? "Setting up..." : "Register as Employer"}
              </Button>
            </div>
          </motion.div>

          {/* Pharmacist Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="border-2 border-gray-200 rounded-lg p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    Pharmacist
                  </h2>
                  <p className="text-sm text-gray-600 mb-3">
                    Find shifts and earn competitive rates
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>Browse available shifts</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>Earn $50-$90/hour</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>Flexible scheduling</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!selecting) selectRole("pharmacist");
                }}
                disabled={selecting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11 font-semibold"
              >
                {selecting ? "Setting up..." : "Register as Pharmacist"}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-gray-500">
            Your role can be updated later in settings
          </p>
        </motion.div>
      </div>
    </div>
  );
}