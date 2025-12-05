import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Syncs User entity data to PublicPharmacistProfile
 * Can be called manually or automatically after profile updates
 * 
 * Features:
 * - Auto-creates profile if doesn't exist
 * - Updates existing profile with latest User data
 * - Calculates profile completeness %
 * - Counts certifications
 * - Updates last_synced timestamp
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 });
    }

    // Parse request body for optional parameters
    let userId = user.id;
    let forceSync = false;
    
    try {
      const body = await req.json();
      if (body.userId && (user.role === 'admin' || body.userId === user.id)) {
        userId = body.userId;
      }
      if (body.forceSync) {
        forceSync = body.forceSync;
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Get user data (use service role if admin, regular call if own profile)
    let targetUser;
    if (user.role === 'admin' && userId !== user.id) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      targetUser = allUsers.find(u => u.id === userId);
    } else {
      targetUser = user;
    }

    if (!targetUser) {
      return Response.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Only sync pharmacist profiles
    if (targetUser.user_type !== 'pharmacist') {
      return Response.json({ 
        error: 'Can only sync pharmacist profiles',
        user_type: targetUser.user_type
      }, { status: 400 });
    }

    // Check if profile exists
    const existingProfiles = await base44.asServiceRole.entities.PublicPharmacistProfile.filter({
      user_id: userId
    });

    // Count certifications
    let certificationsCount = 0;
    try {
      const certs = await base44.asServiceRole.entities.Certification.filter({
        user_id: userId
      });
      certificationsCount = certs.length;
    } catch (certError) {
      console.log(`Could not fetch certifications: ${certError.message}`);
    }

    // Calculate profile completeness
    const calculateCompleteness = (userData) => {
      const fields = [
        userData.full_name,
        userData.license_number,
        userData.bio,
        userData.phone,
        userData.years_experience,
        userData.shift_preference,
        (userData.languages && userData.languages.length > 0),
        (userData.software_experience && userData.software_experience.length > 0),
        (userData.preferred_regions && userData.preferred_regions.length > 0),
        userData.commute_mode,
        (userData.pharmaceutical_skills && userData.pharmaceutical_skills.length > 0),
      ];
      
      const filledFields = fields.filter(Boolean).length;
      return Math.round((filledFields / fields.length) * 100);
    };

    // Prepare profile data
    const profileData = {
      user_id: targetUser.id,
      pharmacist_email: targetUser.email,
      full_name: targetUser.full_name || 'Pharmacist',
      avatar_url: targetUser.avatar_url || null,
      license_number: targetUser.license_number || null,
      license_verified: targetUser.license_verified || false,
      years_experience: targetUser.years_experience || null,
      rating: targetUser.rating || 0,
      completed_shifts: targetUser.completed_shifts || 0,
      bio: targetUser.bio || null,
      shift_preference: targetUser.shift_preference || null,
      languages: targetUser.languages || [],
      software_experience: targetUser.software_experience || [],
      preferred_regions: targetUser.preferred_regions || [],
      commute_mode: targetUser.commute_mode || null,
      pharmaceutical_skills: targetUser.pharmaceutical_skills || [],
      phone: targetUser.phone || null,
      phone_private: targetUser.phone_private || false,
      email_private: targetUser.email_private || false,
      is_verified: targetUser.is_verified || false,
      certifications_count: certificationsCount,
      profile_completeness: calculateCompleteness(targetUser),
      last_synced: new Date().toISOString(),
      // Keep existing analytics data
      last_active: new Date().toISOString(),
    };

    let result;
    let action;

    if (existingProfiles.length > 0) {
      // Update existing profile - preserve analytics fields
      const existingProfile = existingProfiles[0];
      
      const updateData = {
        ...profileData,
        // Preserve analytics that shouldn't be overwritten
        profile_views: existingProfile.profile_views || 0,
        hire_count: existingProfile.hire_count || 0,
        response_rate: existingProfile.response_rate || null,
        average_response_time: existingProfile.average_response_time || null,
        is_active: existingProfile.is_active !== false ? true : existingProfile.is_active,
        profile_visibility: existingProfile.profile_visibility || 'employers_only',
        payroll_method_public: existingProfile.payroll_method_public || false,
        availability_status: existingProfile.availability_status || 'available',
        next_available_date: existingProfile.next_available_date || null,
        featured: existingProfile.featured || false,
        endorsements: existingProfile.endorsements || [],
        tags: existingProfile.tags || [],
        sync_with_user: true,
      };

      result = await base44.asServiceRole.entities.PublicPharmacistProfile.update(
        existingProfile.id,
        updateData
      );
      action = 'updated';

    } else {
      // Create new profile with defaults
      const createData = {
        ...profileData,
        is_active: true,
        profile_visibility: 'employers_only',
        profile_views: 0,
        hire_count: 0,
        response_rate: null,
        average_response_time: null,
        payroll_method_public: false,
        availability_status: 'available',
        next_available_date: null,
        featured: false,
        endorsements: [],
        tags: [],
        sync_with_user: true,
      };

      result = await base44.asServiceRole.entities.PublicPharmacistProfile.create(createData);
      action = 'created';
    }

    return Response.json({
      success: true,
      action: action,
      profile_id: result.id,
      profile_completeness: profileData.profile_completeness,
      certifications_count: certificationsCount,
      synced_at: profileData.last_synced,
      message: `Profile ${action} successfully`
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      details: 'Failed to sync profile'
    }, { status: 500 });
  }
});