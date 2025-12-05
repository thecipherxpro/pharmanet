import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * ONE-TIME MIGRATION SCRIPT
 * Migrates all existing pharmacist User records to PublicPharmacistProfile
 * 
 * Usage: Call this function once to populate PublicPharmacistProfile with existing data
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run migration
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Unauthorized - Admin access required' 
      }, { status: 403 });
    }

    // Get all pharmacist users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const pharmacists = allUsers.filter(u => u.user_type === 'pharmacist');

    console.log(`Found ${pharmacists.length} pharmacist users to migrate`);

    const results = {
      total: pharmacists.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      profiles: []
    };

    // Helper function to calculate profile completeness
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

    // Process each pharmacist
    for (const pharmacist of pharmacists) {
      try {
        console.log(`Processing pharmacist: ${pharmacist.email}`);

        // Check if profile already exists
        const existingProfiles = await base44.asServiceRole.entities.PublicPharmacistProfile.filter({
          user_id: pharmacist.id
        });

        // Count certifications
        let certificationsCount = 0;
        try {
          const certs = await base44.asServiceRole.entities.Certification.filter({
            user_id: pharmacist.id
          });
          certificationsCount = certs.length;
        } catch (certError) {
          console.log(`Could not fetch certifications for ${pharmacist.email}: ${certError.message}`);
        }

        // Prepare profile data
        const profileData = {
          user_id: pharmacist.id,
          pharmacist_email: pharmacist.email,
          full_name: pharmacist.full_name || 'Pharmacist',
          avatar_url: pharmacist.avatar_url || null,
          license_number: pharmacist.license_number || null,
          license_verified: pharmacist.license_verified || false,
          years_experience: pharmacist.years_experience || null,
          rating: pharmacist.rating || 0,
          completed_shifts: pharmacist.completed_shifts || 0,
          bio: pharmacist.bio || null,
          shift_preference: pharmacist.shift_preference || null,
          languages: pharmacist.languages || [],
          software_experience: pharmacist.software_experience || [],
          preferred_regions: pharmacist.preferred_regions || [],
          commute_mode: pharmacist.commute_mode || null,
          pharmaceutical_skills: pharmacist.pharmaceutical_skills || [],
          phone: pharmacist.phone || null,
          phone_private: pharmacist.phone_private || false,
          email_private: pharmacist.email_private || false,
          is_verified: pharmacist.is_verified || false,
          is_active: true,
          profile_visibility: 'employers_only',
          last_active: new Date().toISOString(),
          profile_views: 0,
          hire_count: 0,
          response_rate: null,
          average_response_time: null,
          certifications_count: certificationsCount,
          payroll_method_public: false,
          availability_status: 'available',
          next_available_date: null,
          profile_completeness: calculateCompleteness(pharmacist),
          featured: false,
          endorsements: [],
          tags: [],
          sync_with_user: true,
          last_synced: new Date().toISOString()
        };

        if (existingProfiles.length > 0) {
          // Update existing profile
          const updated = await base44.asServiceRole.entities.PublicPharmacistProfile.update(
            existingProfiles[0].id,
            profileData
          );
          
          results.updated++;
          results.profiles.push({
            email: pharmacist.email,
            action: 'updated',
            profile_id: updated.id
          });
          
          console.log(`✓ Updated profile for ${pharmacist.email}`);
        } else {
          // Create new profile
          const created = await base44.asServiceRole.entities.PublicPharmacistProfile.create(profileData);
          
          results.created++;
          results.profiles.push({
            email: pharmacist.email,
            action: 'created',
            profile_id: created.id
          });
          
          console.log(`✓ Created profile for ${pharmacist.email}`);
        }

      } catch (error) {
        console.error(`Error processing ${pharmacist.email}:`, error);
        results.errors.push({
          email: pharmacist.email,
          error: error.message
        });
      }
    }

    // Calculate response rates for all profiles
    console.log('\nCalculating response rates...');
    
    try {
      const allProfiles = await base44.asServiceRole.entities.PublicPharmacistProfile.list();
      const allApplications = await base44.asServiceRole.entities.ShiftApplication.list();

      for (const profile of allProfiles) {
        const pharmacistApplications = allApplications.filter(
          app => app.pharmacist_email === profile.pharmacist_email
        );

        if (pharmacistApplications.length > 0) {
          const totalApplications = pharmacistApplications.length;
          const respondedApplications = pharmacistApplications.filter(
            app => app.status !== 'pending'
          ).length;

          const responseRate = Math.round((respondedApplications / totalApplications) * 100);

          await base44.asServiceRole.entities.PublicPharmacistProfile.update(profile.id, {
            response_rate: responseRate
          });

          console.log(`Updated response rate for ${profile.pharmacist_email}: ${responseRate}%`);
        }
      }
    } catch (error) {
      console.error('Error calculating response rates:', error);
    }

    // Summary
    const summary = {
      success: true,
      message: 'Migration completed',
      timestamp: new Date().toISOString(),
      statistics: {
        total_pharmacists: results.total,
        profiles_created: results.created,
        profiles_updated: results.updated,
        profiles_skipped: results.skipped,
        errors_count: results.errors.length
      },
      details: results
    };

    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Total Pharmacists: ${results.total}`);
    console.log(`Created: ${results.created}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log('========================\n');

    return Response.json(summary);

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      details: 'Migration failed'
    }, { status: 500 });
  }
});