import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let employer_id = user.id;
    try {
      const body = await req.json();
      if (body.employer_id) {
        employer_id = body.employer_id;
      }
    } catch {
      // No body or invalid JSON - use user.id
    }
    
    const targetEmployerId = employer_id;

    // Fetch employer user data
    const users = await base44.asServiceRole.entities.User.filter({ id: targetEmployerId });
    if (!users || users.length === 0) {
      return Response.json({ error: 'Employer not found' }, { status: 404 });
    }
    
    const employerUser = users[0];

    // Calculate stats
    const [pharmacies, shifts, completedShifts] = await Promise.all([
      base44.asServiceRole.entities.Pharmacy.filter({ created_by: employerUser.email }),
      base44.asServiceRole.entities.Shift.filter({ employer_email: employerUser.email }),
      base44.asServiceRole.entities.Shift.filter({ 
        employer_email: employerUser.email,
        status: 'completed'
      })
    ]);

    const totalShiftsPosted = shifts.length;
    const totalHires = completedShifts.length;
    const numberOfPharmacies = pharmacies.length;

    // Get unique locations from pharmacies
    const pharmaciesLocations = [...new Set(pharmacies.map(p => p.city).filter(Boolean))];

    // Calculate response rate and time from applications
    const allApplications = await base44.asServiceRole.entities.ShiftApplication.list();
    const employerApplications = allApplications.filter(app => {
      const shift = shifts.find(s => s.id === app.shift_id);
      return shift && shift.employer_email === employerUser.email;
    });

    const respondedApps = employerApplications.filter(app => 
      app.status === 'accepted' || app.status === 'rejected'
    );

    const responseRate = employerApplications.length > 0 
      ? Math.round((respondedApps.length / employerApplications.length) * 100)
      : 0;

    // Calculate average response time (in hours)
    let totalResponseTimeHours = 0;
    let responseCount = 0;

    respondedApps.forEach(app => {
      if (app.applied_date && app.updated_date) {
        const appliedTime = new Date(app.applied_date);
        const respondedTime = new Date(app.updated_date);
        const diffHours = (respondedTime - appliedTime) / (1000 * 60 * 60);
        totalResponseTimeHours += diffHours;
        responseCount++;
      }
    });

    const averageResponseTime = responseCount > 0 
      ? Math.round(totalResponseTimeHours / responseCount)
      : 0;

    // Get software used from pharmacies
    const softwareUsed = [...new Set(pharmacies.flatMap(p => p.software || []).filter(Boolean))];

    // Get preferred shift types from posted shifts
    const preferredShiftTypes = [...new Set(shifts.map(s => s.shift_type).filter(Boolean))];

    // Get or create public profile
    const existingProfiles = await base44.asServiceRole.entities.Public_Employer_Profile.filter({
      user_id: targetEmployerId
    });

    // Get existing public profile bio (don't overwrite with User.bio)
    const existingBio = existingProfiles.length > 0 ? existingProfiles[0].bio : '';
    const existingPhone = existingProfiles.length > 0 ? existingProfiles[0].phone : '';

    const profileData = {
      user_id: targetEmployerId,
      employer_email: employerUser.email,
      full_name: employerUser.full_name || employerUser.display_name || '',
      avatar_url: employerUser.avatar_url || '',
      // Preserve bio and phone from Public_Employer_Profile (not User entity)
      bio: existingBio,
      phone: existingPhone,
      number_of_pharmacies: numberOfPharmacies,
      pharmacies_locations: pharmaciesLocations,
      total_shifts_posted: totalShiftsPosted,
      total_hires: totalHires,
      response_rate: responseRate,
      average_response_time: averageResponseTime,
      software_used: softwareUsed.length > 0 ? softwareUsed : (existingProfiles.length > 0 ? existingProfiles[0].software_used : []),
      preferred_shift_types: preferredShiftTypes.length > 0 ? preferredShiftTypes : (existingProfiles.length > 0 ? existingProfiles[0].preferred_shift_types : []),
      active_since: employerUser.created_date,
      last_active: new Date().toISOString(),
      is_active: true,
      profile_completeness: calculateProfileCompleteness({
        bio: existingBio,
        pharmacies: numberOfPharmacies,
        avatar: employerUser.avatar_url
      })
    };

    let publicProfile;
    if (existingProfiles.length > 0) {
      // Update existing profile
      publicProfile = await base44.asServiceRole.entities.Public_Employer_Profile.update(
        existingProfiles[0].id,
        profileData
      );
    } else {
      // Create new profile
      publicProfile = await base44.asServiceRole.entities.Public_Employer_Profile.create(profileData);
    }

    return Response.json({
      success: true,
      message: 'Public employer profile synced successfully',
      profile: publicProfile,
      stats: {
        pharmacies: numberOfPharmacies,
        shifts_posted: totalShiftsPosted,
        total_hires: totalHires,
        response_rate: responseRate,
        average_response_time: averageResponseTime
      }
    });

  } catch (error) {
    console.error('Error syncing employer profile:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync employer profile' 
    }, { status: 500 });
  }
});

function calculateProfileCompleteness(data) {
  let score = 0;
  const checks = [
    { field: data.bio, weight: 30 },
    { field: data.pharmacies > 0, weight: 30 },
    { field: data.avatar, weight: 20 },
  ];

  checks.forEach(check => {
    if (check.field) score += check.weight;
  });

  return Math.min(score, 100);
}