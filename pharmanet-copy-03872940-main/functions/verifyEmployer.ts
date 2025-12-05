import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Admin verifies employer account after checking details
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Only admin can verify
    if (!user || (user.role !== 'admin' && user.user_type !== 'admin')) {
      return Response.json({ 
        error: 'Only administrators can verify employers' 
      }, { status: 403 });
    }

    const { employerId } = await req.json();

    if (!employerId) {
      return Response.json({ error: 'Missing employerId' }, { status: 400 });
    }

    // Get employer details
    const employers = await base44.asServiceRole.entities.User.filter({ id: employerId });
    
    if (employers.length === 0) {
      return Response.json({ error: 'Employer not found' }, { status: 404 });
    }

    const employer = employers[0];

    // Validation checks
    const errors = [];
    const missingFields = [];

    // Check required fields
    if (!employer.full_name || employer.full_name.trim() === '') {
      missingFields.push('Full Name');
    }

    if (!employer.email || employer.email.trim() === '') {
      missingFields.push('Email');
    }

    if (!employer.phone || employer.phone.trim() === '') {
      missingFields.push('Phone Number');
    }

    // Check residential address
    if (!employer.residential_address) {
      missingFields.push('Residential Address');
    } else {
      const addr = employer.residential_address;
      if (!addr.street || !addr.city || !addr.province || !addr.postal_code) {
        missingFields.push('Complete Residential Address (missing fields)');
      }
      
      // Validate Canadian postal code format (A1A 1A1)
      if (addr.postal_code) {
        const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
        if (!postalCodeRegex.test(addr.postal_code)) {
          errors.push('Invalid Canadian postal code format. Must be: A1A 1A1');
        }
      }
    }

    // Check business registration ID
    if (!employer.business_registration_id || employer.business_registration_id.trim() === '') {
      missingFields.push('Business Registration ID');
    } else {
      // Validate 9-digit format
      const bnRegex = /^\d{9}$/;
      if (!bnRegex.test(employer.business_registration_id.replace(/\s/g, ''))) {
        errors.push('Business Registration ID must be 9 digits');
      }
    }

    if (missingFields.length > 0) {
      return Response.json({
        success: false,
        canVerify: false,
        error: 'Cannot verify - missing required information',
        missingFields: missingFields,
        validationErrors: errors
      }, { status: 400 });
    }

    if (errors.length > 0) {
      return Response.json({
        success: false,
        canVerify: false,
        error: 'Validation errors found',
        validationErrors: errors
      }, { status: 400 });
    }

    // All checks passed - verify employer
    await base44.asServiceRole.entities.User.update(employerId, {
      verified: true,
      verified_at: new Date().toISOString(),
      verified_by: user.email
    });

    // Send notification to employer
    try {
      await base44.asServiceRole.functions.invoke('triggerNotification', {
        from_email: 'admin@pharmanet.app',
        from_name: 'Pharmanet Admin',
        to_email: employer.email,
        to_name: employer.full_name,
        notification_type: 'account_verified',
        title: '✅ Account Verified',
        message: 'Congratulations! Your employer account has been verified. You can now post shifts and hire pharmacists.',
        priority: 'high',
        action_url: 'EmployerDashboard',
        action_text: 'Go to Dashboard',
        icon: 'check'
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return Response.json({
      success: true,
      message: 'Employer verified successfully',
      employer: {
        id: employer.id,
        full_name: employer.full_name,
        email: employer.email,
        verified: true
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ 
      error: error.message || 'Failed to verify employer' 
    }, { status: 500 });
  }
});