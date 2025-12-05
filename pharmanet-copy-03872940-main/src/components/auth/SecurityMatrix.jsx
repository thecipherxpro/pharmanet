
/**
 * SECURITY MATRIX - Pharmanet Application
 * 
 * Defines all access control rules for the application.
 * This is the single source of truth for route permissions.
 */

export const USER_TYPES = {
  EMPLOYER: 'employer',
  PHARMACIST: 'pharmacist'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export const PAGE_CATEGORIES = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated',
  EMPLOYER_ONLY: 'employer_only',
  PHARMACIST_ONLY: 'pharmacist_only',
  ADMIN_ONLY: 'admin_only'
};

/**
 * Security Matrix - Maps pages to their access requirements
 */
export const SECURITY_MATRIX = {
  // Public Pages - No authentication required
  RoleSelection: {
    category: PAGE_CATEGORIES.PUBLIC,
    requireAuth: false,
    allowedUserTypes: [],
    allowedRoles: [],
    description: 'Initial role selection for new users'
  },

  // Authenticated Pages - Any logged-in user
  Dashboard: {
    category: PAGE_CATEGORIES.AUTHENTICATED,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER, USER_TYPES.PHARMACIST],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Main dashboard - redirects to user-type specific dashboard'
  },

  Profile: {
    category: PAGE_CATEGORIES.AUTHENTICATED,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER, USER_TYPES.PHARMACIST],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'User profile management'
  },

  // Employer-Only Pages
  EmployerDashboard: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Employer dashboard with shift management overview'
  },

  Pharmacies: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Manage pharmacy locations'
  },

  MyShifts: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'View and manage posted shifts'
  },

  PostShift: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Create new shift postings'
  },

  ManageApplications: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Review and manage shift applications'
  },

  AnalyticsReports: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'View analytics and reports'
  },

  FindPharmacists: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Search and browse pharmacist profiles'
  },

  EmployerProfile: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Employer profile and settings management (private)'
  },

  // Pharmacist-Only Pages
  PharmacistDashboard: {
    category: PAGE_CATEGORIES.PHARMACIST_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.PHARMACIST],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Pharmacist dashboard with upcoming shifts'
  },

  BrowseShifts: {
    category: PAGE_CATEGORIES.PHARMACIST_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.PHARMACIST],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Browse and search available shifts'
  },

  MyApplications: {
    category: PAGE_CATEGORIES.PHARMACIST_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.PHARMACIST],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'View submitted applications and their status'
  },

  MySchedule: {
    category: PAGE_CATEGORIES.PHARMACIST_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.PHARMACIST],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Calendar view of accepted shifts'
  },

  ShiftDetails: {
    category: PAGE_CATEGORIES.PHARMACIST_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.PHARMACIST],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Detailed view of a specific shift with apply option'
  }
};

/**
 * Check if a user has access to a specific page
 * @param {string} pageName - Name of the page
 * @param {Object} user - User object with user_type and role
 * @returns {Object} { hasAccess: boolean, reason: string }
 */
export function checkPageAccess(pageName, user) {
  const pageConfig = SECURITY_MATRIX[pageName];

  if (!pageConfig) {
    return { hasAccess: false, reason: 'PAGE_NOT_FOUND' };
  }

  // Public pages - always accessible
  if (pageConfig.category === PAGE_CATEGORIES.PUBLIC) {
    return { hasAccess: true, reason: 'PUBLIC_PAGE' };
  }

  // Check authentication
  if (pageConfig.requireAuth && !user) {
    return { hasAccess: false, reason: 'NOT_AUTHENTICATED' };
  }

  // Check if user has selected a type
  if (!user.user_type && pageName !== 'RoleSelection') {
    return { hasAccess: false, reason: 'USER_TYPE_NOT_SELECTED' };
  }

  // Admin bypass - admins can access everything except public-only pages
  if (user.role === USER_ROLES.ADMIN) {
    return { hasAccess: true, reason: 'ADMIN_BYPASS' };
  }

  // Check user type permission
  if (pageConfig.allowedUserTypes.length > 0) {
    if (!pageConfig.allowedUserTypes.includes(user.user_type)) {
      return { hasAccess: false, reason: 'INVALID_USER_TYPE' };
    }
  }

  // Check role permission
  if (pageConfig.allowedRoles.length > 0) {
    if (!pageConfig.allowedRoles.includes(user.role)) {
      return { hasAccess: false, reason: 'INVALID_ROLE' };
    }
  }

  return { hasAccess: true, reason: 'AUTHORIZED' };
}

/**
 * Get redirect destination for unauthorized access
 * @param {Object} user - User object
 * @param {string} attemptedPage - Page user tried to access
 * @returns {string} Redirect page name
 */
export function getRedirectDestination(user, attemptedPage) {
  if (!user) {
    return 'RoleSelection'; // Will trigger login
  }

  if (!user.user_type) {
    return 'RoleSelection';
  }

  // Redirect to appropriate dashboard
  if (user.user_type === USER_TYPES.EMPLOYER) {
    return 'EmployerDashboard';
  }

  if (user.user_type === USER_TYPES.PHARMACIST) {
    return 'PharmacistDashboard';
  }

  return 'RoleSelection';
}

/**
 * Get all accessible pages for a user
 * @param {Object} user - User object
 * @returns {Array} List of accessible page names
 */
export function getUserAccessiblePages(user) {
  return Object.keys(SECURITY_MATRIX).filter(pageName => {
    const { hasAccess } = checkPageAccess(pageName, user);
    return hasAccess;
  });
}
