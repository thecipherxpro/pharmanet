/**
 * SECURITY LOGGER
 * Logs security events for monitoring and audit trails
 */

const SECURITY_EVENT_TYPES = {
  ACCESS_GRANTED: 'ACCESS_GRANTED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_USER_TYPE: 'INVALID_USER_TYPE',
  ADMIN_BYPASS: 'ADMIN_BYPASS',
  ROLE_SELECTION_REQUIRED: 'ROLE_SELECTION_REQUIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED_ATTEMPT: 'UNAUTHORIZED_ATTEMPT'
};

class SecurityLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  /**
   * Log a security event
   * @param {string} eventType - Type of security event
   * @param {Object} details - Event details
   */
  log(eventType, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      ...details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    // Add to in-memory log
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔒 Security Event: ${eventType}`);
      console.log('Timestamp:', logEntry.timestamp);
      console.log('Details:', details);
      console.groupEnd();
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Log successful access
   */
  logAccessGranted(pageName, user, reason) {
    this.log(SECURITY_EVENT_TYPES.ACCESS_GRANTED, {
      pageName,
      userId: user?.id,
      userEmail: user?.email,
      userType: user?.user_type,
      userRole: user?.role,
      reason
    });
  }

  /**
   * Log denied access
   */
  logAccessDenied(pageName, user, reason) {
    this.log(SECURITY_EVENT_TYPES.ACCESS_DENIED, {
      pageName,
      userId: user?.id,
      userEmail: user?.email,
      userType: user?.user_type,
      userRole: user?.role,
      reason,
      severity: 'WARNING'
    });
  }

  /**
   * Log unauthorized attempt (potential security issue)
   */
  logUnauthorizedAttempt(pageName, user, attemptDetails) {
    this.log(SECURITY_EVENT_TYPES.UNAUTHORIZED_ATTEMPT, {
      pageName,
      userId: user?.id,
      userEmail: user?.email,
      ...attemptDetails,
      severity: 'HIGH'
    });
  }

  /**
   * Get recent security logs
   */
  getRecentLogs(count = 100) {
    return this.logs.slice(-count);
  }

  /**
   * Get logs for specific user
   */
  getUserLogs(userId) {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get denied access attempts
   */
  getDeniedAttempts() {
    return this.logs.filter(log => 
      log.eventType === SECURITY_EVENT_TYPES.ACCESS_DENIED ||
      log.eventType === SECURITY_EVENT_TYPES.UNAUTHORIZED_ATTEMPT
    );
  }

  /**
   * Send log to monitoring service (placeholder)
   */
  async sendToMonitoring(logEntry) {
    // In production, integrate with monitoring service like:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - Custom analytics endpoint
    
    try {
      // Example: await fetch('/api/security-logs', {
      //   method: 'POST',
      //   body: JSON.stringify(logEntry)
      // });
    } catch (error) {
      console.error('Failed to send security log:', error);
    }
  }

  /**
   * Clear logs (admin only)
   */
  clearLogs() {
    this.logs = [];
  }
}

// Singleton instance
export const securityLogger = new SecurityLogger();

export default securityLogger;