import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.user_type !== 'employer' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden - Employers only' }, { status: 403 });
    }

    // Get target user ID (admin can fetch other profiles)
    const { searchParams } = new URL(req.url);
    let targetUserId = searchParams.get('user_id') || user.id;

    // Non-admin can only fetch their own profile
    if (user.role !== 'admin' && targetUserId !== user.id) {
      return Response.json({ error: 'Forbidden - Cannot access other profiles' }, { status: 403 });
    }

    // Fetch all profile data - try by user_id first, then fallback to email
    let [employerProfiles, publicProfiles, pharmacies] = await Promise.all([
      base44.asServiceRole.entities.Employer_Profile.filter({ user_id: targetUserId }),
      base44.asServiceRole.entities.Public_Employer_Profile.filter({ user_id: targetUserId }),
      base44.asServiceRole.entities.Pharmacy.filter({ created_by: user.email })
    ]);

    // Fallback: if not found by user_id, try by email
    if (employerProfiles.length === 0) {
      employerProfiles = await base44.asServiceRole.entities.Employer_Profile.filter({ email: user.email });
      // If found by email, update the user_id to ensure future lookups work
      if (employerProfiles.length > 0 && !employerProfiles[0].user_id) {
        await base44.asServiceRole.entities.Employer_Profile.update(employerProfiles[0].id, { user_id: targetUserId });
      }
    }
    
    if (publicProfiles.length === 0) {
      publicProfiles = await base44.asServiceRole.entities.Public_Employer_Profile.filter({ employer_email: user.email });
      // If found by email, update the user_id to ensure future lookups work
      if (publicProfiles.length > 0 && !publicProfiles[0].user_id) {
        await base44.asServiceRole.entities.Public_Employer_Profile.update(publicProfiles[0].id, { user_id: targetUserId });
      }
    }

    const employerProfile = employerProfiles[0] || null;
    const publicProfile = publicProfiles[0] || null;
    
    console.log('Fetched profiles:', {
      employerProfileId: employerProfile?.id,
      publicProfileId: publicProfile?.id,
      pharmaciesCount: pharmacies.length
    });

    // Calculate profile completeness
    let completeness = 0;
    const missingFields = [];

    // User fields (20%)
    if (user.display_name) completeness += 10;
    else missingFields.push('display_name');
    
    if (user.avatar_url) completeness += 10;
    else missingFields.push('avatar_url');

    // Employer Profile fields (30%) - personal info only
    if (employerProfile) {
      if (employerProfile.full_name) completeness += 10;
      else missingFields.push('full_name');
      
      if (employerProfile.date_of_birth) completeness += 10;
      else missingFields.push('date_of_birth');
      
      if (employerProfile.personal_address?.length > 0) completeness += 10;
      else missingFields.push('personal_address');
    } else {
      missingFields.push('full_name', 'date_of_birth', 'personal_address');
    }

    // Public Profile fields (40%) - bio, phone, software, shift types
    if (publicProfile) {
      if (publicProfile.bio) completeness += 10;
      else missingFields.push('bio');
      
      if (publicProfile.phone) completeness += 10;
      else missingFields.push('phone');
      
      if (publicProfile.software_used?.length > 0) completeness += 10;
      else missingFields.push('software_used');
      
      if (publicProfile.preferred_shift_types?.length > 0) completeness += 10;
      else missingFields.push('preferred_shift_types');
    } else {
      missingFields.push('bio', 'phone', 'software_used', 'preferred_shift_types');
    }

    // Pharmacy (10%)
    if (pharmacies.length > 0) completeness += 10;
    else missingFields.push('pharmacy');

    return Response.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          user_type: user.user_type,
          role: user.role,
          account_verified: user.account_verified,
          verification_submitted: user.verification_submitted,
          onboarding_completed: user.onboarding_completed,
          employer_onboarding_completed: user.employer_onboarding_completed
        },
        employer_profile: employerProfile,
        public_profile: publicProfile,
        pharmacies_count: pharmacies.length,
        profile_completeness: completeness,
        missing_fields: missingFields
      }
    });

  } catch (error) {
    console.error('getEmployerCompleteProfile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});