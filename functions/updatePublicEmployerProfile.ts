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

    const body = await req.json();
    const {
      bio,
      phone,
      software_used,
      preferred_shift_types,
      website,
      workplace_culture,
      contact_email_public,
      contact_phone_public,
      profile_visibility
    } = body;

    // Validate inputs
    if (bio && bio.length > 1000) {
      return Response.json({ error: 'Bio must be 1000 characters or less' }, { status: 400 });
    }

    if (website && website.length > 0) {
      try {
        new URL(website);
      } catch {
        return Response.json({ error: 'Invalid website URL' }, { status: 400 });
      }
    }

    // Find existing profile
    const existingProfiles = await base44.entities.Public_Employer_Profile.filter({
      user_id: user.id
    });

    // Validate phone if provided
    if (phone !== undefined && phone.length > 0) {
      const cleanPhone = phone.replace(/[\s\-()]/g, '');
      if (!/^\d{10}$/.test(cleanPhone)) {
        return Response.json({ error: 'Phone must be 10 digits' }, { status: 400 });
      }
    }

    const updateData = {};
    
    // Only include provided fields
    if (bio !== undefined) updateData.bio = bio.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (software_used !== undefined) updateData.software_used = software_used;
    if (preferred_shift_types !== undefined) updateData.preferred_shift_types = preferred_shift_types;
    if (website !== undefined) updateData.website = website.trim();
    if (workplace_culture !== undefined) updateData.workplace_culture = workplace_culture.trim();
    if (contact_email_public !== undefined) updateData.contact_email_public = contact_email_public;
    if (contact_phone_public !== undefined) updateData.contact_phone_public = contact_phone_public;
    if (profile_visibility !== undefined) updateData.profile_visibility = profile_visibility;

    let result;
    if (existingProfiles.length > 0) {
      // Verify ownership
      if (existingProfiles[0].user_id !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden - Not profile owner' }, { status: 403 });
      }
      
      result = await base44.entities.Public_Employer_Profile.update(
        existingProfiles[0].id,
        updateData
      );
    } else {
      // Create new profile
      result = await base44.entities.Public_Employer_Profile.create({
        user_id: user.id,
        employer_email: user.email,
        full_name: user.display_name || user.full_name || user.email.split('@')[0],
        ...updateData
      });
    }

    return Response.json({
      success: true,
      message: 'Public profile updated successfully',
      data: result
    });

  } catch (error) {
    console.error('updatePublicEmployerProfile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});