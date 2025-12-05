import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldAlert } from "lucide-react";

/**
 * @deprecated Use RouteProtection instead
 * Legacy component kept for backward compatibility
 */
export default function RoleProtection({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (!userData.user_type) {
        navigate(createPageUrl("RoleSelection"), { replace: true });
        return;
      }

      // Admin bypass
      if (userData.role === 'admin') {
        setLoading(false);
        return;
      }

      if (requiredRole && userData.user_type !== requiredRole) {
        if (userData.user_type === "employer") {
          navigate(createPageUrl("EmployerDashboard"), { replace: true });
        } else {
          navigate(createPageUrl("PharmacistDashboard"), { replace: true });
        }
      }
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

  if (!user || (requiredRole && user.user_type !== requiredRole && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}