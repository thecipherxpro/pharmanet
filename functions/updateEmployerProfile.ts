import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Update employer profile information
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.user_type !== 'employer') {
      return Response.json({ 
        error: 'Only employers can update profile' 
      }, { status: 403 });
    }

    const { 
      full_name,
      phone,
      bio,
      visible_email,
      visible_phone,
      residential_address,
      business_registration_id,
      avatar_url
    } = await req.json();

    const updateData = {};

    // Update allowed fields
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (visible_email !== undefined) updateData.visible_email = visible_email;
    if (visible_phone !== undefined) updateData.visible_phone = visible_phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    
    // Validate and update residential address
    if (residential_address !== undefined) {
      const addr = residential_address;
      
      // Validate postal code if provided
      if (addr.postal_code) {
        const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
        if (!postalCodeRegex.test(addr.postal_code)) {
          return Response.json({
            error: 'Invalid Canadian postal code format. Must be: A1A 1A1'
          }, { status: 400 });
        }
      }
      
      updateData.residential_address = addr;
    }

    // Validate and update business registration ID
    if (business_registration_id !== undefined) {
      if (business_registration_id && business_registration_id.trim() !== '') {
        // Validate 9-digit format
        const bnRegex = /^\d{9}$/;
        const cleanBN = business_registration_id.replace(/\s/g, '');
        if (!bnRegex.test(cleanBN)) {
          return Response.json({
            error: 'Business Registration ID must be 9 digits'
          }, { status: 400 });
        }
        updateData.business_registration_id = cleanBN;
      } else {
        updateData.business_registration_id = business_registration_id;
      }
    }

    // Update user profile
    await base44.auth.updateMe(updateData);

    // Get updated user
    const updatedUser = await base44.auth.me();

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json({ 
      error: error.message || 'Failed to update profile' 
    }, { status: 500 });
  }
});