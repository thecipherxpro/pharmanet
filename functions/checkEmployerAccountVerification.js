import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized - Employer access only' }, { status: 401 });
    }

    // Check Profile Completion
    const profileComplete = !!(
      user.full_name &&
      user.phone &&
      user.company_name &&
      user.business_address &&
      user.city &&
      user.province &&
      user.postal_code
    );

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
        route: "EmployerProfile",
        items: [
          { field: "Full Name", complete: !!user.full_name },
          { field: "Phone Number", complete: !!user.phone },
          { field: "Company Name", complete: !!user.company_name },
          { field: "Business Address", complete: !!user.business_address },
          { field: "City", complete: !!user.city },
          { field: "Province", complete: !!user.province },
          { field: "Postal Code", complete: !!user.postal_code }
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