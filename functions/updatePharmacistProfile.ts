import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.user_type !== 'pharmacist') {
      return Response.json({ error: 'Only pharmacists can update pharmacist profiles' }, { status: 403 });
    }

    const data = await req.json();

    // Define which fields go to which entity
    // Shared fields go to BOTH entities
    const sharedFields = ['full_name', 'phone', 'languages'];
    
    // Public profile specific fields
    const publicOnlyFields = [
      'avatar_url', 'license_number', 'years_experience', 'bio', 
      'software_experience', 'preferred_regions', 'commute_mode',
      'shift_preference', 'pharmaceutical_skills', 'phone_private',
      'email_private', 'profile_visibility', 'availability_status',
      'next_available_date'
    ];
    
    // Private profile specific fields
    const privateOnlyFields = [
      'date_of_birth', 'personal_address', 'ocp_license_number', 'verification_status'
    ];

    // Build data objects for each entity
    const publicData = {};
    const privateData = {};
    const userData = {};

    // Process shared fields - goes to both
    for (const field of sharedFields) {
      if (data[field] !== undefined) {
        publicData[field] = data[field];
        privateData[field] = data[field];
        
        // Also update User entity for certain fields
        if (field === 'full_name') {
          userData.display_name = data[field];
        }
      }
    }

    // Map languages to both entities (different field names)
    if (data.languages !== undefined) {
      publicData.languages = data.languages;
      privateData.languages_spoken = data.languages;
    }
    if (data.languages_spoken !== undefined) {
      publicData.languages = data.languages_spoken;
      privateData.languages_spoken = data.languages_spoken;
    }

    // Process public-only fields
    for (const field of publicOnlyFields) {
      if (data[field] !== undefined) {
        publicData[field] = data[field];
      }
    }

    // Process private-only fields
    for (const field of privateOnlyFields) {
      if (data[field] !== undefined) {
        privateData[field] = data[field];
      }
    }

    // Map license_number to ocp_license_number for private profile
    if (data.license_number !== undefined) {
      privateData.ocp_license_number = data.license_number;
    }

    // Use service role for reliable updates
    const serviceBase44 = base44.asServiceRole;

    // Update/Create Public Profile
    let publicProfile = null;
    const existingPublicProfiles = await serviceBase44.entities.PublicPharmacistProfile.filter({
      user_id: user.id
    });

    if (existingPublicProfiles.length > 0) {
      // Update existing
      publicProfile = await serviceBase44.entities.PublicPharmacistProfile.update(
        existingPublicProfiles[0].id,
        {
          ...publicData,
          last_synced: new Date().toISOString()
        }
      );
    } else {
      // Create new public profile
      publicProfile = await serviceBase44.entities.PublicPharmacistProfile.create({
        user_id: user.id,
        pharmacist_email: user.email,
        full_name: data.full_name || user.full_name || user.email.split('@')[0],
        ...publicData,
        last_synced: new Date().toISOString()
      });
    }

    // Update/Create Private Profile
    let privateProfile = null;
    const existingPrivateProfiles = await serviceBase44.entities.Pharmacist_Profile.filter({
      user_id: user.id
    });

    if (Object.keys(privateData).length > 0 || existingPrivateProfiles.length === 0) {
      if (existingPrivateProfiles.length > 0) {
        // Update existing
        privateProfile = await serviceBase44.entities.Pharmacist_Profile.update(
          existingPrivateProfiles[0].id,
          privateData
        );
      } else {
        // Create new private profile
        privateProfile = await serviceBase44.entities.Pharmacist_Profile.create({
          user_id: user.id,
          email: user.email,
          full_name: data.full_name || user.full_name || user.email.split('@')[0],
          phone: data.phone || '',
          languages_spoken: data.languages_spoken || data.languages || [],
          ...privateData
        });
      }
    }

    // Update User entity if needed
    if (Object.keys(userData).length > 0) {
      await base44.auth.updateMe(userData);
    }

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      publicProfile,
      privateProfile
    });

  } catch (error) {
    return Response.json({ 
      error: error.message || 'Failed to update profile' 
    }, { status: 500 });
  }
});