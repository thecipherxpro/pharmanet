import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Updates public profile statistics
 * - Profile views
 * - Hire count
 * - Response rate
 * - Average response time
 * - Next available date
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, pharmacistId, data } = await req.json();

    if (!pharmacistId) {
      return Response.json({ error: 'Pharmacist ID required' }, { status: 400 });
    }

    // Get public profile
    const profiles = await base44.asServiceRole.entities.PublicPharmacistProfile.filter({
      user_id: pharmacistId
    });

    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Public profile not found' }, { status: 404 });
    }

    let updateData = {};

    switch (action) {
      case 'increment_view':
        // Employer viewed the profile
        if (user.user_type !== 'employer') {
          return Response.json({ error: 'Only employers can increment views' }, { status: 403 });
        }
        updateData = {
          profile_views: (profile.profile_views || 0) + 1,
          last_active: new Date().toISOString()
        };
        break;

      case 'increment_hire':
        // Pharmacist was hired
        updateData = {
          hire_count: (profile.hire_count || 0) + 1,
          last_active: new Date().toISOString()
        };
        break;

      case 'update_response_rate':
        // Calculate response rate based on applications
        const applications = await base44.asServiceRole.entities.ShiftApplication.filter({
          pharmacist_email: profile.pharmacist_email
        });

        const totalApplications = applications.length;
        const respondedApplications = applications.filter(app => 
          app.status !== 'pending'
        ).length;

        const responseRate = totalApplications > 0 
          ? Math.round((respondedApplications / totalApplications) * 100)
          : 0;

        updateData = {
          response_rate: responseRate
        };
        break;

      case 'update_availability':
        // Update availability status and next available date
        if (!data || !data.status) {
          return Response.json({ error: 'Availability status required' }, { status: 400 });
        }

        updateData = {
          availability_status: data.status,
          next_available_date: data.next_available_date || null
        };
        break;

      case 'add_endorsement':
        // Add employer endorsement
        if (user.user_type !== 'employer') {
          return Response.json({ error: 'Only employers can add endorsements' }, { status: 403 });
        }

        if (!data || !data.endorsement) {
          return Response.json({ error: 'Endorsement text required' }, { status: 400 });
        }

        const currentEndorsements = profile.endorsements || [];
        const newEndorsement = {
          employer_id: user.id,
          employer_name: user.full_name || user.company_name,
          endorsement: data.endorsement,
          date: new Date().toISOString()
        };

        updateData = {
          endorsements: [...currentEndorsements, newEndorsement]
        };
        break;

      case 'update_tags':
        // Update search tags (admin only)
        if (user.role !== 'admin') {
          return Response.json({ error: 'Only admins can update tags' }, { status: 403 });
        }

        if (!data || !data.tags) {
          return Response.json({ error: 'Tags required' }, { status: 400 });
        }

        updateData = {
          tags: data.tags
        };
        break;

      case 'set_featured':
        // Set featured status (admin only)
        if (user.role !== 'admin') {
          return Response.json({ error: 'Only admins can set featured status' }, { status: 403 });
        }

        updateData = {
          featured: data.featured === true
        };
        break;

      case 'update_visibility':
        // Update profile visibility
        if (pharmacistId !== user.id && user.role !== 'admin') {
          return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (!data || !data.visibility) {
          return Response.json({ error: 'Visibility setting required' }, { status: 400 });
        }

        updateData = {
          profile_visibility: data.visibility
        };
        break;

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update profile
    const updatedProfile = await base44.asServiceRole.entities.PublicPharmacistProfile.update(
      profile.id,
      updateData
    );

    return Response.json({
      success: true,
      action: action,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Error updating profile stats:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to update profile statistics'
    }, { status: 500 });
  }
});