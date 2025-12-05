import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simplified onboarding requirements - just essential items
    const checklist = {
      hasPersonalInfo: false,
      hasPharmacy: false,
      hasPublicProfile: false
    };

    const missingFields = [];

    // Check Employer_Profile (personal info)
    try {
      let employerProfiles = await base44.entities.Employer_Profile.filter({ user_id: user.id });
      if (employerProfiles.length === 0) {
        employerProfiles = await base44.entities.Employer_Profile.filter({ email: user.email });
      }
      
      if (employerProfiles.length > 0) {
        const ep = employerProfiles[0];
        checklist.hasPersonalInfo = !!(
          ep.full_name && 
          ep.date_of_birth && 
          ep.personal_address && 
          ep.personal_address.length > 0
        );
      }
      
      if (!checklist.hasPersonalInfo) {
        missingFields.push('Personal information');
      }
    } catch (error) {
      console.error('Error checking Employer_Profile:', error);
    }

    // Check Pharmacy
    try {
      const pharmacies = await base44.entities.Pharmacy.filter({ created_by: user.email });
      checklist.hasPharmacy = pharmacies.length > 0;
      if (!checklist.hasPharmacy) {
        missingFields.push('At least one pharmacy');
      }
    } catch (error) {
      console.error('Error checking Pharmacy:', error);
    }

    // Check Public_Employer_Profile (phone, bio, software, shift types)
    try {
      let publicProfiles = await base44.entities.Public_Employer_Profile.filter({ user_id: user.id });
      if (publicProfiles.length === 0) {
        publicProfiles = await base44.entities.Public_Employer_Profile.filter({ employer_email: user.email });
      }
      
      if (publicProfiles.length > 0) {
        const pp = publicProfiles[0];
        const hasPhone = !!(pp.phone && pp.phone.trim().length > 0);
        const hasBio = !!(pp.bio && pp.bio.trim().length > 0);
        const hasSoftware = !!(pp.software_used && pp.software_used.length > 0);
        const hasShiftTypes = !!(pp.preferred_shift_types && pp.preferred_shift_types.length > 0);
        
        // Public profile is complete if they have phone AND bio AND (software OR shift types)
        checklist.hasPublicProfile = hasPhone && hasBio && (hasSoftware || hasShiftTypes);
        
        if (!hasPhone) missingFields.push('Phone number');
        if (!hasBio) missingFields.push('Company bio');
        if (!hasSoftware && !hasShiftTypes) missingFields.push('Software or shift preferences');
      } else {
        missingFields.push('Public profile setup');
      }
    } catch (error) {
      console.error('Error checking Public_Employer_Profile:', error);
    }

    // Calculate completion - 3 main requirements
    const totalChecks = 3;
    const completedChecks = [
      checklist.hasPersonalInfo,
      checklist.hasPharmacy,
      checklist.hasPublicProfile
    ].filter(Boolean).length;
    
    const completionPercentage = Math.round((completedChecks / totalChecks) * 100);
    const allComplete = completedChecks === totalChecks;

    console.log('Onboarding status:', {
      checklist,
      completedChecks,
      totalChecks,
      completionPercentage,
      allComplete,
      missingFields
    });

    return Response.json({
      allComplete,
      completionPercentage,
      checklist,
      missingFields,
      canPostShifts: checklist.hasPharmacy && allComplete
    });

  } catch (error) {
    console.error('Onboarding status check error:', error);
    return Response.json({ 
      error: error.message,
      allComplete: false,
      completionPercentage: 0,
      checklist: {},
      missingFields: ['Error checking status']
    }, { status: 500 });
  }
});