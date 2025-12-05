import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Check if user is admin - redirect to admin dashboard
      if (userData.role === "admin" || userData.user_type === "admin") {
        navigate(createPageUrl("AdminDashboard"), { replace: true });
        return;
      }
      
      // Check if user has selected a role
      if (!userData.user_type) {
        navigate(createPageUrl("RoleSelection"), { replace: true });
        return;
      }
      
      // Redirect based on user type
      if (userData.user_type === "employer") {
        navigate(createPageUrl("EmployerDashboard"), { replace: true });
      } else if (userData.user_type === "pharmacist") {
        navigate(createPageUrl("PharmacistDashboard"), { replace: true });
      }
    } catch (error) {
      console.error("Error loading user:", error);
      navigate(createPageUrl("RoleSelection"), { replace: true });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center px-4">
          <div className="w-12 h-12 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4">
        <div className="w-12 h-12 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}