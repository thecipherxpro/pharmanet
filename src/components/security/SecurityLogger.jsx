import { base44 } from "@/api/base44Client";

/**
 * Security logging utility
 * Use this to log security-relevant events throughout the app
 */
class SecurityLogger {
  static async log(eventType, details = {}) {
    try {
      const user = await base44.auth.me();
      
      const logEntry = {
        event_type: eventType,
        user_id: user?.id || 'anonymous',
        user_email: user?.email || 'anonymous',
        ip_address: 'client', // Will be set by backend
        user_agent: navigator.userAgent,
        status: details.status || 'success',
        details: JSON.stringify(details),
        severity: details.severity || 'low',
        ...details
      };

      // Use service role to write security logs
      await base44.functions.invoke('logSecurityEvent', logEntry);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static async logLogin(success = true) {
    await this.log(success ? 'login' : 'failed_login', {
      status: success ? 'success' : 'failure',
      severity: success ? 'low' : 'medium'
    });
  }

  static async logDataAccess(resourceType, resourceId, action) {
    await this.log('data_access', {
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      severity: 'low'
    });
  }

  static async logSuspiciousActivity(description) {
    await this.log('suspicious_activity', {
      details: description,
      severity: 'high'
    });
  }

  static async logPermissionDenied(resourceType, action) {
    await this.log('permission_denied', {
      resource_type: resourceType,
      action,
      severity: 'medium'
    });
  }

  static async logAdminAction(action, details) {
    await this.log('admin_action', {
      action,
      details: JSON.stringify(details),
      severity: 'medium'
    });
  }
}

export default SecurityLogger;