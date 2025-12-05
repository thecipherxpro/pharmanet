import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'pharmacist') {
      return Response.json({ error: 'Unauthorized - Pharmacist access only' }, { status: 401 });
    }

    // Check Profile Completion
    const profileComplete = !!(
      user.full_name &&
      user.license_number &&
      user.phone &&
      user.years_experience &&
      user.bio &&
      user.shift_preference &&
      user.software_experience && user.software_experience.length > 0 &&
      user.preferred_regions && user.preferred_regions.length > 0 &&
      user.pharmaceutical_skills && user.pharmaceutical_skills.length > 0 &&
      user.languages && user.languages.length > 0
    );

    // Check Wallet Card
    const walletCards = await base44.asServiceRole.entities.WalletCard.filter({ user_id: user.id });
    const hasCard = walletCards.length > 0;

    // Check Payroll Preference
    const payrollPrefs = await base44.asServiceRole.entities.PayrollPreference.filter({ user_id: user.id });
    const hasPayroll = payrollPrefs.length > 0;

    // Check Availability
    const availabilities = await base44.asServiceRole.entities.Availability.filter({ pharmacist_email: user.email });
    const hasAvailability = availabilities.length > 0;

    // Calculate overall completion
    const walletComplete = hasCard && hasPayroll;
    const allComplete = profileComplete && walletComplete && hasAvailability;

    const checklist = {
      profile: {
        complete: profileComplete,
        title: "Complete Your Profile",
        description: "Add your professional details, experience, and preferences",
        route: "Profile",
        items: [
          { field: "License Number", complete: !!user.license_number },
          { field: "Phone Number", complete: !!user.phone },
          { field: "Years of Experience", complete: !!user.years_experience },
          { field: "Professional Bio", complete: !!user.bio },
          { field: "Shift Preference", complete: !!user.shift_preference },
          { field: "Software Experience", complete: !!(user.software_experience && user.software_experience.length > 0) },
          { field: "Preferred Regions", complete: !!(user.preferred_regions && user.preferred_regions.length > 0) },
          { field: "Pharmaceutical Skills", complete: !!(user.pharmaceutical_skills && user.pharmaceutical_skills.length > 0) },
          { field: "Languages Spoken", complete: !!(user.languages && user.languages.length > 0) }
        ]
      },
      wallet: {
        complete: walletComplete,
        title: "Complete Your Wallet",
        description: "Set up payment methods for cancellation protection and receiving payments",
        route: "PharmacistWallet",
        items: [
          { 
            field: "Payment Card", 
            complete: hasCard,
            description: "Required for cancellation fee processing"
          },
          { 
            field: "Payroll Preference", 
            complete: hasPayroll,
            description: "Choose how you want to receive shift payments"
          }
        ]
      },
      availability: {
        complete: hasAvailability,
        title: "Add Your Availability",
        description: "Let employers know when you're available to work",
        route: "MySchedule",
        items: [
          { 
            field: "Availability Slots", 
            complete: hasAvailability,
            description: `${availabilities.length} slot${availabilities.length !== 1 ? 's' : ''} added`
          }
        ]
      }
    };

    return Response.json({
      success: true,
      allComplete,
      profileComplete,
      walletComplete,
      hasAvailability,
      completionPercentage: Math.round(
        ((profileComplete ? 33.33 : 0) + 
         (walletComplete ? 33.33 : 0) + 
         (hasAvailability ? 33.33 : 0))
      ),
      checklist
    });

  } catch (error) {
    console.error('Error checking account verification:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});