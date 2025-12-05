import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pharmacistId } = await req.json();

    if (!pharmacistId) {
      return Response.json({ error: 'pharmacistId is required' }, { status: 400 });
    }

    // Get pharmacist user data
    const pharmacistUser = await base44.asServiceRole.entities.User.filter({ id: pharmacistId });
    if (!pharmacistUser || pharmacistUser.length === 0) {
      return Response.json({ error: 'Pharmacist not found' }, { status: 404 });
    }

    const pharmacist = pharmacistUser[0];
    const pharmacistEmail = pharmacist.email;

    // Calculate completed shifts
    // Get all shift applications that were accepted
    const acceptedApplications = await base44.asServiceRole.entities.ShiftApplication.filter({
      pharmacist_email: pharmacistEmail,
      status: 'accepted'
    });

    // Get the shifts for these applications to verify they're completed
    const acceptedShiftIds = acceptedApplications.map(app => app.shift_id);
    
    let completedShiftsCount = 0;
    if (acceptedShiftIds.length > 0) {
      const shifts = await base44.asServiceRole.entities.Shift.list();
      const acceptedShifts = shifts.filter(shift => acceptedShiftIds.includes(shift.id));
      
      // Count completed shifts (shifts that have passed and are marked completed or filled)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      completedShiftsCount = acceptedShifts.filter(shift => {
        const shiftDate = new Date(shift.shift_date);
        return (shiftDate < today && (shift.status === 'completed' || shift.status === 'filled'));
      }).length;
    }

    // Calculate rating from reviews
    const reviews = await base44.asServiceRole.entities.Review.filter({
      pharmacist_id: pharmacistId,
      is_visible: true
    });

    let averageRating = 0;
    let ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
      
      // Calculate rating breakdown
      reviews.forEach(review => {
        const ratingValue = Math.floor(review.rating);
        if (ratingBreakdown[ratingValue] !== undefined) {
          ratingBreakdown[ratingValue]++;
        }
      });
    }

    // Calculate percentage ratings
    const ratingPercentages = {};
    Object.keys(ratingBreakdown).forEach(star => {
      ratingPercentages[star] = reviews.length > 0 
        ? Math.round((ratingBreakdown[star] / reviews.length) * 100)
        : 0;
    });

    // Calculate detailed metrics
    let professionalism = 0;
    let punctuality = 0;
    let communication = 0;
    let wouldHireAgainCount = 0;

    if (reviews.length > 0) {
      const reviewsWithDetails = reviews.filter(r => r.professionalism && r.punctuality && r.communication);
      
      if (reviewsWithDetails.length > 0) {
        professionalism = reviewsWithDetails.reduce((sum, r) => sum + r.professionalism, 0) / reviewsWithDetails.length;
        punctuality = reviewsWithDetails.reduce((sum, r) => sum + r.punctuality, 0) / reviewsWithDetails.length;
        communication = reviewsWithDetails.reduce((sum, r) => sum + r.communication, 0) / reviewsWithDetails.length;
      }

      wouldHireAgainCount = reviews.filter(r => r.would_hire_again).length;
    }

    const wouldHireAgainPercentage = reviews.length > 0 
      ? Math.round((wouldHireAgainCount / reviews.length) * 100)
      : 0;

    return Response.json({
      pharmacistId,
      pharmacistEmail,
      completedShifts: completedShiftsCount,
      rating: parseFloat(averageRating.toFixed(2)),
      totalReviews: reviews.length,
      ratingBreakdown,
      ratingPercentages,
      detailedRatings: {
        professionalism: parseFloat(professionalism.toFixed(2)),
        punctuality: parseFloat(punctuality.toFixed(2)),
        communication: parseFloat(communication.toFixed(2))
      },
      wouldHireAgainPercentage
    });

  } catch (error) {
    console.error('Error calculating pharmacist stats:', error);
    return Response.json({ 
      error: 'Failed to calculate stats',
      details: error.message 
    }, { status: 500 });
  }
});