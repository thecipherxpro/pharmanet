import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Send notifications when a new shift is posted
 * Notifies relevant pharmacists based on location, software experience, etc.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { shift_id } = await req.json();

    if (!shift_id) {
      return Response.json({ error: 'shift_id is required' }, { status: 400 });
    }

    // Get shift details
    const shifts = await base44.asServiceRole.entities.Shift.filter({ id: shift_id });
    if (!shifts || shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    console.log('📢 [New Shift] Notifying pharmacists about:', shift.pharmacy_name);

    // Get all pharmacists who might be interested
    const allUsers = await base44.asServiceRole.entities.User.list();
    const pharmacists = allUsers.filter(u => u.user_type === 'pharmacist');

    console.log(`📊 Found ${pharmacists.length} pharmacists to potentially notify`);

    // Filter pharmacists based on preferences (if available)
    const relevantPharmacists = pharmacists.filter(p => {
      // Check if pharmacist has matching region preference
      if (p.preferred_regions && Array.isArray(p.preferred_regions)) {
        const matchesRegion = p.preferred_regions.includes(shift.pharmacy_city);
        if (matchesRegion) return true;
      }

      // Check if pharmacist has matching software experience
      if (p.software_experience && Array.isArray(p.software_experience) && shift.pharmacy_software) {
        const matchesSoftware = shift.pharmacy_software.some(sw => 
          p.software_experience.includes(sw)
        );
        if (matchesSoftware) return true;
      }

      // If no specific preferences, include all pharmacists
      return true;
    });

    console.log(`🎯 ${relevantPharmacists.length} relevant pharmacists to notify`);

    // Send notifications to relevant pharmacists
    const notificationPromises = relevantPharmacists.slice(0, 100).map(async (pharmacist) => {
      try {
        const urgencyTag = shift.urgency_level === 'emergency' || shift.urgency_level === 'very_urgent' 
          ? '🔥 Urgent: ' 
          : shift.urgency_level === 'urgent' 
          ? '⏰ ' 
          : '';

        await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: pharmacist.id,
          user_email: pharmacist.email,
          title: `${urgencyTag}New Shift Available`,
          message: `${shift.pharmacy_name} in ${shift.pharmacy_city} - $${shift.hourly_rate}/hr on ${shift.shift_date}`,
          type: 'shift_posted',
          priority: shift.urgency_level === 'emergency' ? 'urgent' : shift.urgency_level === 'very_urgent' ? 'high' : 'medium',
          action_url: `/shift-details?id=${shift.id}`,
          action_text: 'View Shift',
          icon: 'calendar',
          metadata: {
            shift_id: shift.id,
            pharmacy_name: shift.pharmacy_name,
            pharmacy_city: shift.pharmacy_city,
            hourly_rate: shift.hourly_rate,
            shift_date: shift.shift_date,
            urgency_level: shift.urgency_level
          },
          send_push: true,
          send_email: false
        });

        return { success: true, pharmacist_id: pharmacist.id };
      } catch (error) {
        console.error(`Failed to notify ${pharmacist.email}:`, error);
        return { success: false, pharmacist_id: pharmacist.id, error: error.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Notified ${successCount} pharmacists successfully`);

    return Response.json({
      success: true,
      notified: successCount,
      total: relevantPharmacists.length,
      results: results
    });

  } catch (error) {
    console.error('❌ Error notifying pharmacists:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});