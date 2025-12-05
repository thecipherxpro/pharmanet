import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pharmacistId, pharmacistEmail } = await req.json();

    if (!pharmacistId && !pharmacistEmail) {
      return Response.json({ error: 'Pharmacist ID or email required' }, { status: 400 });
    }

    // Use service role to access user data
    const users = (await base44.asServiceRole.entities.User.list()) || [];
    
    let pharmacist;
    if (pharmacistId) {
      pharmacist = users.find(u => u.id === pharmacistId && u.user_type === 'pharmacist');
    } else {
      pharmacist = users.find(u => u.email === pharmacistEmail && u.user_type === 'pharmacist');
    }

    if (!pharmacist) {
      return Response.json({ error: 'Pharmacist not found' }, { status: 404 });
    }

    // Return public profile data (excluding sensitive fields)
    const publicProfile = {
      id: pharmacist.id,
      email: pharmacist.email,
      full_name: pharmacist.full_name,
      avatar_url: pharmacist.avatar_url,
      user_type: pharmacist.user_type,
      license_number: pharmacist.license_number,
      phone: pharmacist.phone,
      phone_private: pharmacist.phone_private,
      address: pharmacist.address,
      city: pharmacist.city,
      province: pharmacist.province,
      postal_code: pharmacist.postal_code,
      bio: pharmacist.bio,
      rating: pharmacist.rating,
      completed_shifts: pharmacist.completed_shifts,
      years_experience: pharmacist.years_experience,
      shift_preference: pharmacist.shift_preference,
      software_experience: pharmacist.software_experience,
      preferred_regions: pharmacist.preferred_regions,
      commute_mode: pharmacist.commute_mode,
      pharmaceutical_skills: pharmacist.pharmaceutical_skills,
      is_verified: pharmacist.is_verified
    };

    return Response.json(publicProfile);

  } catch (error) {
    console.error('Error fetching pharmacist profile:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});