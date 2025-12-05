import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldAlert, AlertTriangle, Lock } from "lucide-react";
import { checkPageAccess, getRedirectDestination, SECURITY_MATRIX } from "./SecurityMatrix";
import { securityLogger } from "./SecurityLogger";

/**
 * ENHANCED ROUTE PROTECTION
 * Comprehensive security with logging, monitoring, and detailed access control
 */
export default function EnhancedRouteProtection({ 
  children, 
  pageName,
  fallback = null
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState({
    hasAccess: false,
    reason: '',
    redirectTo: null
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAccess();
  }, [pageName]);

  const checkAccess = async () => {
    try {
      // Attempt to get user
      const userData = await base44.auth.me();
      setUser(userData);

      // Check page access using security matrix
      const accessCheck = checkPageAccess(pageName, userData);

      if (accessCheck.hasAccess) {
        // Log successful access
        securityLogger.logAccessGranted(pageName, userData, accessCheck.reason);
        
        setAccessState({
          hasAccess: true,
          reason: accessCheck.reason
        });
      } else {
        // Log denied access
        securityLogger.logAccessDenied(pageName, userData, accessCheck.reason);

        // Determine redirect destination
        const redirectTo = getRedirectDestination(userData, pageName);
        
        setAccessState({
          hasAccess: false,
          reason: accessCheck.reason,
          redirectTo
        });

        // Redirect after a brief delay
        setTimeout(() => {
          navigate(createPageUrl(redirectTo), { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error("Access check error:", error);
      
      // Log authentication failure
      securityLogger.log('AUTHENTICATION_ERROR', {
        pageName,
        error: error.message,
        severity: 'HIGH'
      });

      // Not authenticated - redirect to login
      setAccessState({
        hasAccess: false,
        reason: 'NOT_AUTHENTICATED',
        redirectTo: 'RoleSelection'
      });

      setTimeout(() => {
        base44.auth.redirectToLogin(location.pathname);
      }, 1500);
    }
    
    setLoading(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying access...</p>
          <p className="text-sm text-gray-500 mt-2">Checking permissions for {pageName}</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!accessState.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {accessState.reason === 'NOT_AUTHENTICATED' ? (
              <Lock className="w-10 h-10 text-red-600" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-red-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getAccessDeniedTitle(accessState.reason)}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {getAccessDeniedMessage(accessState.reason, user)}
          </p>

          {accessState.redirectTo && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Redirecting to {accessState.redirectTo}...
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate(createPageUrl(getRedirectDestination(user, pageName)))}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Access granted - render children
  return children;
}

/**
 * Helper: Get access denied title
 */
function getAccessDeniedTitle(reason) {
  const titles = {
    NOT_AUTHENTICATED: 'Authentication Required',
    USER_TYPE_NOT_SELECTED: 'Setup Required',
    INVALID_USER_TYPE: 'Access Denied',
    INVALID_ROLE: 'Insufficient Permissions',
    PAGE_NOT_FOUND: 'Page Not Found'
  };
  return titles[reason] || 'Access Denied';
}

/**
 * Helper: Get access denied message
 */
function getAccessDeniedMessage(reason, user) {
  const messages = {
    NOT_AUTHENTICATED: 'Please sign in to access this page.',
    USER_TYPE_NOT_SELECTED: 'Please complete your profile setup to continue.',
    INVALID_USER_TYPE: `This page is not available for ${user?.user_type || 'your'} accounts.`,
    INVALID_ROLE: 'You don\'t have the required permissions to view this page.',
    PAGE_NOT_FOUND: 'The page you\'re looking for doesn\'t exist.'
  };
  return messages[reason] || 'You don\'t have permission to access this page.';
}

/**
 * Convenience wrapper components with enhanced logging
 */
export function EmployerOnlyEnhanced({ children, pageName }) {
  return (
    <EnhancedRouteProtection pageName={pageName || 'EmployerPage'}>
      {children}
    </EnhancedRouteProtection>
  );
}

export function PharmacistOnlyEnhanced({ children, pageName }) {
  return (
    <EnhancedRouteProtection pageName={pageName || 'PharmacistPage'}>
      {children}
    </EnhancedRouteProtection>
  );
}