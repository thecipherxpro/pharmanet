import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized - Employer access only' }, { status: 401 });
    }

    // Check Profile Completion - Use both Employer_Profile (personal) and Public_Employer_Profile (bio/phone)
    let profileComplete = false;
    let hasPersonalInfo = false;
    let hasBioAndPhone = false;
    
    try {
      // Check Employer_Profile for personal info (name, DOB, address)
      const employerProfiles = await base44.entities.Employer_Profile.filter({ 
        user_id: user.id 
      });
      
      if (employerProfiles && employerProfiles.length > 0) {
        const profile = employerProfiles[0];
        hasPersonalInfo = !!(
          profile.full_name &&
          profile.personal_address &&
          profile.personal_address.length > 0 &&
          profile.personal_address[0].street &&
          profile.personal_address[0].city &&
          profile.personal_address[0].postal_code
        );
      }

      // Check Public_Employer_Profile for bio and phone
      const publicProfiles = await base44.entities.Public_Employer_Profile.filter({
        user_id: user.id
      });

      if (publicProfiles && publicProfiles.length > 0) {
        const publicProfile = publicProfiles[0];
        hasBioAndPhone = !!(
          publicProfile.phone &&
          publicProfile.bio &&
          publicProfile.bio.length > 0
        );
      }

      profileComplete = hasPersonalInfo && hasBioAndPhone;
    } catch (error) {
      console.error('Error checking profile:', error);
      profileComplete = false;
    }

    // Check Wallet Card
    const walletCards = await base44.asServiceRole.entities.WalletCard.filter({ user_id: user.id });
    const hasCard = walletCards.length > 0;

    // Check Pharmacy Locations
    const pharmacies = await base44.asServiceRole.entities.Pharmacy.filter({ created_by: user.email });
    const hasPharmacy = pharmacies.length > 0;

    // Calculate overall completion
    const allComplete = profileComplete && hasCard && hasPharmacy;

    const checklist = {
      profile: {
        complete: profileComplete,
        title: "Complete Your Profile",
        description: "Add your business details and contact information",
        route: "EmployerSettings",
        items: [
          { field: "Personal Info", complete: hasPersonalInfo },
          { field: "Bio & Phone", complete: hasBioAndPhone }
        ]
      },
      wallet: {
        complete: hasCard,
        title: "Add Payment Card",
        description: "Add a card for acceptance fees and shift payments",
        route: "EmployerWallet",
        items: [
          { 
            field: "Payment Card", 
            complete: hasCard,
            description: hasCard 
              ? `${walletCards.length} card${walletCards.length !== 1 ? 's' : ''} on file`
              : "Required for hiring pharmacists"
          }
        ]
      },
      pharmacy: {
        complete: hasPharmacy,
        title: "Add Pharmacy Location",
        description: "Add at least one pharmacy location to start posting shifts",
        route: "Pharmacies",
        items: [
          { 
            field: "Pharmacy Locations", 
            complete: hasPharmacy,
            description: hasPharmacy
              ? `${pharmacies.length} location${pharmacies.length !== 1 ? 's' : ''} added`
              : "Add your first pharmacy"
          }
        ]
      }
    };

    return Response.json({
      success: true,
      allComplete,
      profileComplete,
      hasCard,
      hasPharmacy,
      completionPercentage: Math.round(
        ((profileComplete ? 33.33 : 0) + 
         (hasCard ? 33.33 : 0) + 
         (hasPharmacy ? 33.33 : 0))
      ),
      checklist
    });

  } catch (error) {
    console.error('Error checking employer account verification:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});