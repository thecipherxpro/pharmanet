import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated and is an employer
    const user = await base44.auth.me();
    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Only employers can submit reviews' }, { status: 403 });
    }

    const { 
      pharmacistId,
      shiftId,
      rating,
      professionalism,
      punctuality,
      communication,
      wouldHireAgain,
      reviewText
    } = await req.json();

    // Validate required fields
    if (!pharmacistId || !shiftId || !rating) {
      return Response.json({ 
        error: 'pharmacistId, shiftId, and rating are required' 
      }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return Response.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Verify the shift exists and belongs to this employer
    const shift = await base44.entities.Shift.filter({ id: shiftId });
    if (!shift || shift.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shiftData = shift[0];
    if (shiftData.created_by !== user.email) {
      return Response.json({ error: 'You can only review shifts you posted' }, { status: 403 });
    }

    // Verify the shift is completed
    if (shiftData.status !== 'completed' && shiftData.status !== 'filled') {
      return Response.json({ 
        error: 'Can only review completed shifts' 
      }, { status: 400 });
    }

    // Verify the pharmacist was assigned to this shift
    const application = await base44.asServiceRole.entities.ShiftApplication.filter({
      shift_id: shiftId,
      status: 'accepted'
    });

    if (!application || application.length === 0) {
      return Response.json({ 
        error: 'No accepted application found for this shift' 
      }, { status: 400 });
    }

    const pharmacistEmail = application[0].pharmacist_email;

    // Check if review already exists for this shift
    const existingReview = await base44.entities.Review.filter({
      shift_id: shiftId,
      employer_id: user.id
    });

    if (existingReview && existingReview.length > 0) {
      return Response.json({ 
        error: 'You have already reviewed this shift' 
      }, { status: 400 });
    }

    // Get pharmacist details
    const pharmacistUser = await base44.asServiceRole.entities.User.filter({ id: pharmacistId });
    if (!pharmacistUser || pharmacistUser.length === 0) {
      return Response.json({ error: 'Pharmacist not found' }, { status: 404 });
    }

    const pharmacist = pharmacistUser[0];

    // Create the review
    const review = await base44.entities.Review.create({
      pharmacist_id: pharmacistId,
      pharmacist_email: pharmacistEmail,
      employer_id: user.id,
      employer_name: user.company_name || user.full_name,
      shift_id: shiftId,
      rating: parseFloat(rating),
      professionalism: professionalism ? parseFloat(professionalism) : null,
      punctuality: punctuality ? parseFloat(punctuality) : null,
      communication: communication ? parseFloat(communication) : null,
      would_hire_again: wouldHireAgain === true,
      review_text: reviewText || null,
      pharmacy_name: shiftData.pharmacy_name,
      shift_date: shiftData.shift_date,
      is_verified: true,
      is_visible: true
    });

    console.log('✅ Review created successfully');

    // Update pharmacist stats using service role
    try {
      await base44.functions.invoke('updatePublicProfileStats', {
        pharmacistId: pharmacistId
      });
      console.log('✅ Profile stats updated');
    } catch (error) {
      console.error('Failed to update profile stats:', error);
    }

    // 🔔 Send notification to pharmacist about new review
    try {
      const starEmoji = rating >= 4.5 ? '⭐' : rating >= 4 ? '🌟' : rating >= 3 ? '✨' : '📊';
      const ratingText = rating >= 4.5 ? 'excellent' : rating >= 4 ? 'great' : rating >= 3 ? 'good' : 'new';
      
      await base44.asServiceRole.functions.invoke('sendNotification', {
        user_id: pharmacistId,
        user_email: pharmacistEmail,
        title: `${starEmoji} New Review Received!`,
        message: `${user.company_name || user.full_name} gave you ${rating}/5 stars for your shift at ${shiftData.pharmacy_name}${reviewText ? ` - "${reviewText.substring(0, 60)}${reviewText.length > 60 ? '...' : ''}"` : ''}`,
        type: 'review_received',
        priority: 'high',
        action_url: '/profile',
        action_text: 'View Review',
        icon: 'star',
        metadata: {
          review_id: review.id,
          shift_id: shiftId,
          rating: rating,
          employer_id: user.id,
          employer_name: user.company_name || user.full_name,
          pharmacy_name: shiftData.pharmacy_name
        },
        send_push: true,
        send_email: false
      });

      console.log('✅ Notification sent to pharmacist');
    } catch (notifError) {
      console.error('⚠️ Failed to send notification:', notifError);
      // Don't fail the review if notification fails
    }

    return Response.json({
      success: true,
      review: review,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return Response.json({ 
      error: 'Failed to submit review',
      details: error.message 
    }, { status: 500 });
  }
});