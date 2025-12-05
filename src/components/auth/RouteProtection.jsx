import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldAlert, AlertTriangle } from "lucide-react";

/**
 * Route Protection Component
 * Protects routes based on:
 * - Authentication status
 * - User type (employer/pharmacist/admin)
 * - User role (admin/user)
 * 
 * Admin users have access to all routes regardless of user_type
 */
export default function RouteProtection({ children, allowedUserTypes = [], requireAdmin = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Check if user is admin (either by role or user_type)
      const isAdmin = userData.role === 'admin' || userData.user_type === 'admin';

      // If user is admin but hasn't set user_type to admin, update it
      if (userData.role === 'admin' && userData.user_type !== 'admin') {
        await base44.auth.updateMe({ user_type: 'admin' });
        userData.user_type = 'admin';
      }

      // If user hasn't selected a type and is not admin, redirect to role selection
      if (!userData.user_type && !isAdmin) {
        navigate(createPageUrl("RoleSelection"), { replace: true });
        return;
      }

      // Admin users have access to everything
      if (isAdmin) {
        setAccessDenied(false);
        setLoading(false);
        return;
      }

      // If route requires admin and user is not admin
      if (requireAdmin) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // If route has user type restrictions
      if (allowedUserTypes.length > 0) {
        if (!allowedUserTypes.includes(userData.user_type)) {
          // Redirect to appropriate dashboard
          if (userData.user_type === "employer") {
            navigate(createPageUrl("EmployerDashboard"), { replace: true });
          } else if (userData.user_type === "pharmacist") {
            navigate(createPageUrl("PharmacistDashboard"), { replace: true });
          }
          return;
        }
      }

      setAccessDenied(false);
    } catch (error) {
      console.error("Access check error:", error);
      navigate(createPageUrl("RoleSelection"), { replace: true });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            {requireAdmin 
              ? "This page requires administrator privileges."
              : "You don't have permission to access this page."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access this page.
          </p>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Convenience wrapper components for common protection patterns
 */
export function EmployerOnly({ children }) {
  return (
    <RouteProtection allowedUserTypes={['employer']}>
      {children}
    </RouteProtection>
  );
}

export function PharmacistOnly({ children }) {
  return (
    <RouteProtection allowedUserTypes={['pharmacist']}>
      {children}
    </RouteProtection>
  );
}

export function AdminOnly({ children }) {
  return (
    <RouteProtection requireAdmin={true}>
      {children}
    </RouteProtection>
  );
}

export function Authenticated({ children }) {
  return (
    <RouteProtection>
      {children}
    </RouteProtection>
  );
}