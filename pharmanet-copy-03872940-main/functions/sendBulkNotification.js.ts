import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can send bulk notifications
    if (!user || (user.role !== 'admin' && user.user_type !== 'admin')) {
      return Response.json({ 
        error: 'Unauthorized - Admin access required' 
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      message,
      type = 'system',
      priority = 'medium',
      action_url,
      action_text,
      icon = 'bell',
      target_user_type = 'all', // 'all', 'pharmacist', 'employer'
      target_user_ids = [], // Optional: specific user IDs
      send_push = true,
      send_email = false
    } = body;

    // Validate required fields
    if (!title || !message) {
      return Response.json({ 
        error: 'Title and message are required' 
      }, { status: 400 });
    }

    console.log(`📢 [Bulk Notification] Admin ${user.email} sending to: ${target_user_type}`);
    console.log(`📋 [Bulk Notification] Title: "${title}", Type: ${type}, Priority: ${priority}`);

    // Get target users
    let targetUsers = [];
    
    if (target_user_ids && target_user_ids.length > 0) {
      // Specific users
      console.log(`👥 [Target] Specific users: ${target_user_ids.length}`);
      const users = await base44.asServiceRole.entities.User.list();
      targetUsers = users.filter(u => target_user_ids.includes(u.id));
    } else if (target_user_type === 'all') {
      // All users (pharmacists + employers)
      console.log('👥 [Target] All users');
      const users = await base44.asServiceRole.entities.User.list();
      targetUsers = users.filter(u => 
        (u.user_type === 'pharmacist' || u.user_type === 'employer') && 
        u.role !== 'admin'
      );
    } else if (target_user_type === 'pharmacist') {
      // All pharmacists
      console.log('👥 [Target] All pharmacists');
      const users = await base44.asServiceRole.entities.User.list();
      targetUsers = users.filter(u => u.user_type === 'pharmacist');
    } else if (target_user_type === 'employer') {
      // All employers
      console.log('👥 [Target] All employers');
      const users = await base44.asServiceRole.entities.User.list();
      targetUsers = users.filter(u => u.user_type === 'employer');
    } else {
      return Response.json({ 
        error: 'Invalid target_user_type. Must be: all, pharmacist, employer' 
      }, { status: 400 });
    }

    if (targetUsers.length === 0) {
      return Response.json({ 
        error: 'No target users found' 
      }, { status: 400 });
    }

    console.log(`✅ [Target] Found ${targetUsers.length} users to notify`);

    // Send notification to each user
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const targetUser of targetUsers) {
      try {
        console.log(`📤 [Sending] To ${targetUser.email} (${targetUser.user_type})`);
        
        const response = await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: targetUser.id,
          user_email: targetUser.email,
          title,
          message,
          type,
          priority,
          action_url,
          action_text,
          icon,
          metadata: {
            bulk_notification: true,
            sent_by: user.email,
            sent_at: new Date().toISOString()
          },
          send_push,
          send_email
        });

        successCount++;
        results.push({
          user_id: targetUser.id,
          user_email: targetUser.email,
          user_type: targetUser.user_type,
          success: true
        });

        console.log(`✅ [Success] Sent to ${targetUser.email}`);
      } catch (error) {
        failureCount++;
        results.push({
          user_id: targetUser.id,
          user_email: targetUser.email,
          user_type: targetUser.user_type,
          success: false,
          error: error.message
        });

        console.error(`❌ [Failed] To ${targetUser.email}:`, error.message);
      }
    }

    console.log(`🎉 [Bulk Notification] Complete - Success: ${successCount}, Failed: ${failureCount}`);

    // Log bulk notification for audit
    try {
      await base44.asServiceRole.entities.SecurityLog.create({
        event_type: 'admin_action',
        user_id: user.id,
        user_email: user.email,
        action: 'send_bulk_notification',
        resource_type: 'Notification',
        status: 'success',
        details: `Sent "${title}" to ${successCount} users (${target_user_type})`,
        severity: 'medium'
      });
    } catch (logError) {
      console.warn('⚠️ [Audit] Failed to log:', logError.message);
    }

    return Response.json({
      success: true,
      message: `Notification sent to ${successCount} of ${targetUsers.length} users`,
      stats: {
        total: targetUsers.length,
        success: successCount,
        failed: failureCount
      },
      target_user_type,
      notification: {
        title,
        message,
        type,
        priority,
        send_push,
        send_email
      },
      results: results.slice(0, 10) // Return first 10 for debugging
    });

  } catch (error) {
    console.error('❌ [Bulk Notification] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});