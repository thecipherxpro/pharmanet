import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check completion status - bio and phone now in Public_Employer_Profile
    const checks = {
      hasAvatar: !!user.avatar_url,
      hasPhone: false, // Will check from Public_Employer_Profile
      hasBio: false, // Will check from Public_Employer_Profile
      
      // Personal info
      profileComplete: false,
      hasPersonalInfo: false,
      
      // Pharmacy
      hasPharmacy: false,
      
      // Public profile
      publicProfileComplete: false
    };

    // Check Employer Profile (personal info) - with error handling
    try {
      const employerProfiles = await base44.entities.Employer_Profile.filter({ 
        user_id: user.id 
      });
      
      if (employerProfiles && employerProfiles.length > 0) {
        const employerProfile = employerProfiles[0];
        checks.hasPersonalInfo = !!(
          employerProfile.full_name &&
          employerProfile.date_of_birth &&
          employerProfile.personal_address &&
          employerProfile.personal_address.length > 0 &&
          employerProfile.personal_address[0].street &&
          employerProfile.personal_address[0].city &&
          employerProfile.personal_address[0].postal_code
        );
        checks.profileComplete = checks.hasPersonalInfo;
      }
    } catch (error) {
      console.error('Error checking Employer_Profile:', error);
    }

    // Check Pharmacy - with error handling
    try {
      const pharmacies = await base44.entities.Pharmacy.filter({ 
        created_by: user.email 
      });
      checks.hasPharmacy = pharmacies && pharmacies.length > 0;
    } catch (error) {
      console.error('Error checking Pharmacy:', error);
    }

    // Check Public Profile - with error handling
    try {
      const publicProfiles = await base44.entities.Public_Employer_Profile.filter({ 
        user_id: user.id 
      });

      if (publicProfiles && publicProfiles.length > 0) {
        const publicProfile = publicProfiles[0];
        // Check phone and bio - be lenient, just needs to exist
        checks.hasPhone = !!(publicProfile.phone && publicProfile.phone.trim().length > 0);
        checks.hasBio = !!(publicProfile.bio && publicProfile.bio.trim().length > 0);
        
        checks.publicProfileComplete = !!(
          publicProfile.software_used &&
          publicProfile.software_used.length > 0 &&
          publicProfile.preferred_shift_types &&
          publicProfile.preferred_shift_types.length > 0
        );
        

      }
    } catch (error) {
      console.error('Error checking Public_Employer_Profile:', error);
    }

    // Calculate completion percentage
    // Company Info: just needs phone OR bio (more lenient)
    const companyInfoComplete = checks.hasPhone && checks.hasBio;
    
    const totalChecks = 4;
    let completedChecks = 0;

    if (companyInfoComplete) completedChecks++;
    if (checks.hasPersonalInfo) completedChecks++;
    if (checks.hasPharmacy) completedChecks++;
    if (checks.publicProfileComplete) completedChecks++;

    const completionPercentage = Math.round((completedChecks / totalChecks) * 100);
    const allComplete = completionPercentage === 100;
    
    // Build checklist
    const checklist = {
      companyInfo: {
        title: "Company Information",
        description: "Phone and bio",
        complete: companyInfoComplete,
        route: "EmployerProfile"
      },
      personalInfo: {
        title: "Personal Information",
        description: "Name, DOB, and address",
        complete: checks.hasPersonalInfo,
        route: "EmployerSettings"
      },
      pharmacy: {
        title: "Add Pharmacy",
        description: "At least one pharmacy location",
        complete: checks.hasPharmacy,
        route: "Pharmacies"
      },
      publicProfile: {
        title: "Public Profile",
        description: "Software and shift preferences",
        complete: checks.publicProfileComplete,
        route: "EmployerProfile"
      }
    };

    return Response.json({
      completionPercentage,
      allComplete,
      checklist,
      ...checks
    });

  } catch (error) {
    console.error('Error checking profile completion:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});