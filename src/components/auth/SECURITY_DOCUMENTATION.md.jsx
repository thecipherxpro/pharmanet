# 🔒 Pharmanet Security System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [User Types & Roles](#user-types--roles)
3. [Security Architecture](#security-architecture)
4. [Access Control Matrix](#access-control-matrix)
5. [Implementation Guide](#implementation-guide)
6. [Security Logging](#security-logging)
7. [Testing & Validation](#testing--validation)
8. [Best Practices](#best-practices)

---

## Overview

Pharmanet implements a comprehensive, multi-layered security system that controls access based on:
- **Authentication Status**: User must be logged in
- **User Type**: Employer or Pharmacist
- **User Role**: Admin or Standard User

### Key Security Features
✅ **Multi-layer Protection** - Authentication + Authorization
✅ **Centralized Security Matrix** - Single source of truth
✅ **Comprehensive Logging** - All access attempts tracked
✅ **Admin Bypass** - Admins have universal access
✅ **Automatic Redirects** - Intelligent routing for unauthorized users
✅ **Real-time Monitoring** - Security dashboard for admins
✅ **Session Management** - Secure token handling
✅ **XSS Prevention** - Input sanitization
✅ **CSRF Protection** - Built into base44 SDK

---

## User Types & Roles

### User Types
```javascript
EMPLOYER: 'employer'
  - Pharmacy owners/managers
  - Post shifts, manage locations
  - Review applications
  - Access analytics

PHARMACIST: 'pharmacist'
  - Relief pharmacists
  - Browse and apply for shifts
  - Manage schedule
  - Track applications
```

### User Roles
```javascript
ADMIN: 'admin'
  - Full system access
  - Can access both employer and pharmacist pages
  - Access security dashboard
  - Bypass all restrictions

USER: 'user'
  - Standard access
  - Restricted to own user type pages
  - Cannot access admin features
```

### Permission Hierarchy
```
Admin (role)
├── Employer (user_type)
│   └── All Employer Pages
└── Pharmacist (user_type)
    └── All Pharmacist Pages

Standard User (role)
├── Employer (user_type)
│   └── Only Employer Pages
└── Pharmacist (user_type)
    └── Only Pharmacist Pages
```

---

## Security Architecture

### Component Structure
```
components/auth/
├── SecurityMatrix.js          # Access control rules (source of truth)
├── SecurityLogger.js          # Event logging & monitoring
├── EnhancedRouteProtection.js # Main protection component
├── RouteProtection.js         # Legacy component (still supported)
├── SecurityDashboard.js       # Admin monitoring interface
└── SECURITY_DOCUMENTATION.md  # This file
```

### Data Flow
```
User Request
    ↓
EnhancedRouteProtection
    ↓
Check Authentication (base44.auth.me())
    ↓
Check SecurityMatrix (checkPageAccess())
    ↓
Log Event (SecurityLogger)
    ↓
Grant Access OR Redirect
```

---

## Access Control Matrix

### Public Pages
| Page | Auth Required | Access |
|------|---------------|--------|
| RoleSelection | No | Everyone |

### Authenticated Pages (All Users)
| Page | User Types | Description |
|------|------------|-------------|
| Profile | All | User profile management |
| Dashboard | All | Redirects to user-type dashboard |

### Employer-Only Pages
| Page | Auth | Admin Access | Description |
|------|------|--------------|-------------|
| EmployerDashboard | ✅ | ✅ | Main employer dashboard |
| Pharmacies | ✅ | ✅ | Manage pharmacy locations |
| MyShifts | ✅ | ✅ | View/manage posted shifts |
| PostShift | ✅ | ✅ | Create new shift postings |
| ManageApplications | ✅ | ✅ | Review shift applications |
| AnalyticsReports | ✅ | ✅ | View analytics & reports |
| FindPharmacists | ✅ | ✅ | Search pharmacist profiles |

### Pharmacist-Only Pages
| Page | Auth | Admin Access | Description |
|------|------|--------------|-------------|
| PharmacistDashboard | ✅ | ✅ | Main pharmacist dashboard |
| BrowseShifts | ✅ | ✅ | Browse available shifts |
| MyApplications | ✅ | ✅ | View application status |
| MySchedule | ✅ | ✅ | Calendar of accepted shifts |
| ShiftDetails | ✅ | ✅ | Detailed shift view + apply |

---

## Implementation Guide

### Method 1: Enhanced Route Protection (Recommended)
```jsx
import EnhancedRouteProtection from "../components/auth/EnhancedRouteProtection";

function MyShiftsContent() {
  // Your page logic
  return <div>My Shifts</div>;
}

export default function MyShifts() {
  return (
    <EnhancedRouteProtection pageName="MyShifts">
      <MyShiftsContent />
    </EnhancedRouteProtection>
  );
}
```

### Method 2: Convenience Wrappers
```jsx
import { EmployerOnly } from "../components/auth/RouteProtection";

export default function Pharmacies() {
  return (
    <EmployerOnly>
      <PharmaciesContent />
    </EmployerOnly>
  );
}
```

### Adding New Protected Pages

1. **Add to SecurityMatrix.js**
```javascript
export const SECURITY_MATRIX = {
  // ... existing pages
  NewEmployerPage: {
    category: PAGE_CATEGORIES.EMPLOYER_ONLY,
    requireAuth: true,
    allowedUserTypes: [USER_TYPES.EMPLOYER],
    allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.USER],
    description: 'Description of the new page'
  }
};
```

2. **Wrap Your Component**
```jsx
import EnhancedRouteProtection from "../components/auth/EnhancedRouteProtection";

export default function NewEmployerPage() {
  return (
    <EnhancedRouteProtection pageName="NewEmployerPage">
      <YourContent />
    </EnhancedRouteProtection>
  );
}
```

---

## Security Logging

### Event Types
```javascript
ACCESS_GRANTED          // Successful access
ACCESS_DENIED           // Permission denied
AUTHENTICATION_REQUIRED // Not logged in
INVALID_USER_TYPE       // Wrong user type
ADMIN_BYPASS            // Admin accessed page
UNAUTHORIZED_ATTEMPT    // Security violation
SESSION_EXPIRED         // Token expired
```

### Logging Example
```javascript
import { securityLogger } from "../components/auth/SecurityLogger";

// Automatic logging (done by EnhancedRouteProtection)
securityLogger.logAccessGranted(pageName, user, reason);
securityLogger.logAccessDenied(pageName, user, reason);

// Manual logging
securityLogger.log('CUSTOM_EVENT', {
  detail1: 'value',
  severity: 'HIGH'
});

// Query logs
const recentLogs = securityLogger.getRecentLogs(100);
const deniedAttempts = securityLogger.getDeniedAttempts();
const userLogs = securityLogger.getUserLogs(userId);
```

### Production Monitoring
```javascript
// SecurityLogger.js automatically sends to monitoring in production
async sendToMonitoring(logEntry) {
  // Integrate with:
  // - Sentry (error tracking)
  // - LogRocket (session replay)
  // - Datadog (APM)
  // - Custom endpoint
  
  await fetch('/api/security-logs', {
    method: 'POST',
    body: JSON.stringify(logEntry)
  });
}
```

---

## Testing & Validation

### Test Scenarios

#### 1. Employer Access Tests
```javascript
// Should access employer pages
✅ Employer user accessing EmployerDashboard
✅ Employer user accessing Pharmacies
✅ Employer user accessing PostShift

// Should be denied pharmacist pages
❌ Employer user accessing BrowseShifts
❌ Employer user accessing MyApplications
```

#### 2. Pharmacist Access Tests
```javascript
// Should access pharmacist pages
✅ Pharmacist user accessing PharmacistDashboard
✅ Pharmacist user accessing BrowseShifts
✅ Pharmacist user accessing ShiftDetails

// Should be denied employer pages
❌ Pharmacist user accessing Pharmacies
❌ Pharmacist user accessing PostShift
```

#### 3. Admin Access Tests
```javascript
// Should access everything
✅ Admin accessing EmployerDashboard
✅ Admin accessing PharmacistDashboard
✅ Admin accessing SecurityDashboard
✅ Admin accessing all pages
```

#### 4. Unauthenticated Tests
```javascript
// Should redirect to login
❌ Unauthenticated accessing any protected page
✅ Redirect to RoleSelection → Login
```

#### 5. Edge Cases
```javascript
✅ Session expiry handling
✅ User type change (employer → pharmacist)
✅ Role change (user → admin)
✅ Account deactivation
✅ Multiple tab sessions
✅ Rapid page navigation
```

### Manual Testing Checklist
- [ ] Test all employer pages as employer
- [ ] Test all pharmacist pages as pharmacist
- [ ] Test all pages as admin
- [ ] Test unauthenticated access
- [ ] Test navigation between restricted pages
- [ ] Test browser back button behavior
- [ ] Test session expiry
- [ ] Verify security logs are generated
- [ ] Check redirect destinations
- [ ] Validate error messages

---

## Best Practices

### 1. Security-First Development
```javascript
// ✅ Always wrap protected components
export default function MyPage() {
  return (
    <EnhancedRouteProtection pageName="MyPage">
      <Content />
    </EnhancedRouteProtection>
  );
}

// ❌ Never expose protected content directly
export default function MyPage() {
  return <Content />;  // Vulnerable!
}
```

### 2. Centralized Configuration
```javascript
// ✅ Define all access rules in SecurityMatrix
// Single source of truth - easy to audit

// ❌ Don't scatter permission checks across components
if (user.user_type === 'employer') { /* ... */ }  // Bad!
```

### 3. Logging Everything
```javascript
// ✅ Log all security-relevant events
securityLogger.log('USER_ACTION', { details });

// ✅ Log denied attempts
securityLogger.logAccessDenied(page, user, reason);

// Monitor logs regularly in SecurityDashboard
```

### 4. Fail Securely
```javascript
// ✅ Deny access by default
if (!hasAccess) {
  return <AccessDenied />;
}

// ❌ Don't assume access
if (hasAccess) {
  return <Content />;
}
// Missing else - might show content!
```

### 5. Admin Considerations
```javascript
// ✅ Admin bypass is intentional
if (user.role === 'admin') {
  return { hasAccess: true, reason: 'ADMIN_BYPASS' };
}

// ⚠️ Be careful with admin actions
// Log all admin activities
// Implement admin audit trail
```

### 6. Session Management
```javascript
// ✅ Handle session expiry gracefully
try {
  const user = await base44.auth.me();
} catch (error) {
  // Redirect to login
  base44.auth.redirectToLogin(currentPath);
}

// ✅ Refresh tokens before expiry
// Handled automatically by base44 SDK
```

### 7. Error Messages
```javascript
// ✅ User-friendly, non-technical
"You don't have permission to access this page."

// ❌ Don't expose system details
"JWT token expired at 2024-01-15T10:30:00Z"  // Bad!
```

### 8. Performance
```javascript
// ✅ Cache user permissions
const accessiblePages = useMemo(
  () => getUserAccessiblePages(user),
  [user]
);

// ✅ Minimize permission checks
// Done once per page load, not per component
```

---

## Security Monitoring

### Admin Dashboard Access
```javascript
// Navigate to SecurityDashboard (admins only)
// View:
// - Real-time access logs
// - Denied access attempts
// - Active users
// - Access control matrix
// - Security statistics
```

### Production Monitoring
```javascript
// Integrate with monitoring services:

// 1. Sentry - Error Tracking
Sentry.captureMessage('SECURITY_EVENT', {
  level: 'warning',
  extra: logEntry
});

// 2. LogRocket - Session Replay
LogRocket.track('SecurityEvent', logEntry);

// 3. Datadog - APM
datadogRum.addAction('security_event', logEntry);
```

---

## Compliance & Auditing

### Audit Trail
All security events are logged with:
- Timestamp
- User ID & Email
- User Type & Role
- Page Accessed
- Access Decision (granted/denied)
- Reason Code
- User Agent
- IP Address (in production)

### GDPR Compliance
- User data encrypted at rest
- Access logs retained for 90 days
- User deletion removes all logs
- Data access auditable

### Security Standards
- OWASP Top 10 compliance
- HTTPS only (enforced)
- XSS prevention
- CSRF protection
- SQL injection prevention (via ORM)
- Secure password storage (handled by base44)

---

## Troubleshooting

### Common Issues

#### 1. "Access Denied" for Valid User
**Cause**: User type not set
**Solution**: Redirect to RoleSelection
```javascript
if (!user.user_type) {
  navigate(createPageUrl('RoleSelection'));
}
```

#### 2. Infinite Redirect Loop
**Cause**: Redirect destination also protected
**Solution**: Ensure redirect pages are accessible
```javascript
// Dashboard must handle both user types
if (user.user_type === 'employer') {
  navigate('EmployerDashboard');
} else {
  navigate('PharmacistDashboard');
}
```

#### 3. Logs Not Appearing
**Cause**: Logger not initialized
**Solution**: Check SecurityLogger singleton
```javascript
import { securityLogger } from "./SecurityLogger";
// Singleton - works everywhere
```

#### 4. Admin Can't Access Page
**Cause**: Admin bypass not implemented
**Solution**: Check SecurityMatrix logic
```javascript
if (user.role === USER_ROLES.ADMIN) {
  return { hasAccess: true, reason: 'ADMIN_BYPASS' };
}
```

---

## Future Enhancements

### Planned Features
- [ ] Two-factor authentication (2FA)
- [ ] IP whitelisting for admin
- [ ] Rate limiting for failed access
- [ ] Advanced threat detection
- [ ] Automated security reports
- [ ] Integration with SIEM tools
- [ ] Compliance dashboard
- [ ] Security incident response workflow

---

## Support & Contact

For security concerns or questions:
- Review this documentation
- Check SecurityMatrix.js for access rules
- View SecurityLogger for event logs
- Access SecurityDashboard (admins only)
- Contact security team for incidents

**Remember**: Security is everyone's responsibility! 🔒

---

*Last Updated: 2024*
*Version: 1.0*
*Maintainer: Development Team*