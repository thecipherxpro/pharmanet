import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Security middleware to validate and log data access
 * Implements role-based access control and audit logging
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        error: 'Unauthorized',
        granted: false 
      }, { status: 401 });
    }

    const { 
      resource_type, 
      resource_id, 
      action, 
      owner_id 
    } = await req.json();

    // Get request metadata
    const ip_address = req.headers.get('x-forwarded-for') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    // Security rules
    const rules = {
      // Admin has full access
      admin: () => user.role === 'admin' || user.user_type === 'admin',
      
      // User can access their own data
      isOwner: () => owner_id === user.id || owner_id === user.email,
      
      // Employers can access their shifts and pharmacies
      employerCanAccess: () => {
        if (user.user_type !== 'employer') return false;
        return ['Shift', 'Pharmacy', 'ShiftApplication'].includes(resource_type);
      },
      
      // Pharmacists can access their applications and wallet
      pharmacistCanAccess: () => {
        if (user.user_type !== 'pharmacist') return false;
        return ['ShiftApplication', 'WalletCard', 'PayrollPreference', 'Availability'].includes(resource_type);
      },
      
      // Read-only access for public shifts
      publicReadShifts: () => {
        return resource_type === 'Shift' && action === 'read';
      }
    };

    // Evaluate access
    let granted = false;
    let reason = 'Access denied';

    // Admin override
    if (rules.admin()) {
      granted = true;
      reason = 'Admin access';
    }
    // Owner access
    else if (rules.isOwner()) {
      granted = true;
      reason = 'Owner access';
    }
    // Role-based access
    else if (rules.employerCanAccess()) {
      granted = true;
      reason = 'Employer access';
    }
    else if (rules.pharmacistCanAccess()) {
      granted = true;
      reason = 'Pharmacist access';
    }
    // Public read access
    else if (rules.publicReadShifts()) {
      granted = true;
      reason = 'Public read access';
    }

    // Log access attempt
    const severity = granted ? 'low' : 'medium';
    await base44.asServiceRole.entities.SecurityLog.create({
      event_type: 'data_access',
      user_id: user.id,
      user_email: user.email,
      ip_address,
      user_agent,
      resource_type,
      resource_id,
      action,
      status: granted ? 'success' : 'blocked',
      details: reason,
      severity
    });

    // Log to DataAccessControl
    await base44.asServiceRole.entities.DataAccessControl.create({
      user_id: user.id,
      resource_type,
      resource_id,
      action,
      granted,
      reason,
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      granted, 
      reason,
      user_id: user.id,
      user_type: user.user_type
    });

  } catch (error) {
    console.error('Security validation error:', error);
    return Response.json({ 
      error: error.message,
      granted: false 
    }, { status: 500 });
  }
});