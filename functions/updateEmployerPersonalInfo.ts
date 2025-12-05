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
      full_name,
      date_of_birth,
      phone,
      personal_address,
      languages_spoken
    } = body;

    // Validate inputs
    if (full_name !== undefined && full_name.trim().length < 2) {
      return Response.json({ error: 'Full name must be at least 2 characters' }, { status: 400 });
    }

    if (phone !== undefined && phone.length > 0) {
      const cleanPhone = phone.replace(/[\s\-()]/g, '');
      if (!/^\d{10}$/.test(cleanPhone)) {
        return Response.json({ error: 'Phone must be 10 digits' }, { status: 400 });
      }
    }

    if (date_of_birth !== undefined) {
      const dob = new Date(date_of_birth);
      const age = Math.floor((new Date() - dob) / 31557600000);
      if (age < 18) {
        return Response.json({ error: 'Must be at least 18 years old' }, { status: 400 });
      }
    }

    if (personal_address !== undefined) {
      const addr = personal_address;
      if (!addr.street || addr.street.trim().length < 5) {
        return Response.json({ error: 'Street address must be at least 5 characters' }, { status: 400 });
      }
      if (!addr.city || addr.city.trim().length < 2) {
        return Response.json({ error: 'City is required' }, { status: 400 });
      }
      if (!addr.postal_code || !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(addr.postal_code)) {
        return Response.json({ error: 'Valid postal code required (e.g., M5V 3A8)' }, { status: 400 });
      }
    }

    // CRITICAL: Use service role to find ALL existing profiles for this user
    // Check by multiple identifiers to ensure we find existing record
    const allProfiles = await base44.asServiceRole.entities.Employer_Profile.filter({});
    
    // Find profile matching this user by user_id, email, or created_by
    const existingProfile = allProfiles.find(p => 
      p.user_id === user.id || 
      p.email === user.email || 
      p.created_by === user.email
    );

    console.log('User:', { id: user.id, email: user.email });
    console.log('Existing profile found:', existingProfile ? existingProfile.id : 'NONE');
    console.log('Total profiles checked:', allProfiles.length);

    // Build update data - only include provided fields
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name.trim();
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (phone !== undefined) updateData.phone = phone;
    if (personal_address !== undefined) updateData.personal_address = [personal_address];
    if (languages_spoken !== undefined) updateData.languages_spoken = languages_spoken;

    let result;
    
    if (existingProfile) {
      // UPDATE existing profile
      console.log('Updating existing profile:', existingProfile.id);
      
      result = await base44.asServiceRole.entities.Employer_Profile.update(
        existingProfile.id,
        {
          ...updateData,
          user_id: user.id, // Ensure user_id is correct
          email: user.email // Ensure email is correct
        }
      );
      
      console.log('Update successful:', result?.id);
    } else {
      // CREATE new profile only if none exists
      console.log('Creating new profile for user:', user.id);
      
      result = await base44.asServiceRole.entities.Employer_Profile.create({
        user_id: user.id,
        email: user.email,
        ...updateData
      });
      
      console.log('Create successful:', result?.id);
    }

    // Sync display_name to User if full_name changed
    if (full_name !== undefined) {
      await base44.auth.updateMe({
        display_name: full_name.trim()
      });
    }

    return Response.json({
      success: true,
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
      action: existingProfile ? 'updated' : 'created',
      profileId: result?.id
    });

  } catch (error) {
    console.error('updateEmployerPersonalInfo error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});