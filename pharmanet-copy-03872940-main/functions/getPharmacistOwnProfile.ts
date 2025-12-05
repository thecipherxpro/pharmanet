import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Pharmacist_Profile (private)
    const profiles = await base44.asServiceRole.entities.Pharmacist_Profile.filter({
      user_id: user.id
    });

    // Get PayrollPreference
    const payrollPrefs = await base44.asServiceRole.entities.PayrollPreference.filter({
      user_id: user.id
    });

    // Get PublicPharmacistProfile
    const publicProfiles = await base44.asServiceRole.entities.PublicPharmacistProfile.filter({
      user_id: user.id
    });

    return Response.json({
      profile: profiles.length > 0 ? profiles[0] : null,
      payroll: payrollPrefs.length > 0 ? payrollPrefs[0] : null,
      public_profile: publicProfiles.length > 0 ? publicProfiles[0] : null
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});