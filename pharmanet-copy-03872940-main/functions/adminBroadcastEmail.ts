import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate and verify admin
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.user_type !== 'admin')) {
      return Response.json({ 
        error: 'Unauthorized - Admin only' 
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      subject,
      html_body,
      target_audience = 'specific', // 'all', 'pharmacists', 'employers', 'specific'
      specific_emails = []
    } = body;

    if (!subject || !html_body) {
      return Response.json({ error: 'Subject and Body are required' }, { status: 400 });
    }

    console.log('📧 [Email Broadcast] Admin:', user.email, '- Audience:', target_audience);

    // Resolve target emails
    let targetEmails = [];

    if (target_audience === 'specific') {
      targetEmails = specific_emails;
    } else {
      let filter = {};
      if (target_audience === 'pharmacists') filter = { user_type: 'pharmacist' };
      if (target_audience === 'employers') filter = { user_type: 'employer' };
      
      // For 'all' or types, we need to fetch users
      // Note: For large lists this might timeout. In production, this should be a queued job.
      // For now we'll fetch in batches or just list all (assuming < 1000 users for now)
      
      // Fetching only emails would be ideal but list() returns full objects
      const users = await base44.asServiceRole.entities.User.list(); // TODO: Pagination
      
      targetEmails = users
        .filter(u => {
          if (target_audience === 'all') return true;
          return u.user_type === (target_audience === 'pharmacists' ? 'pharmacist' : 'employer');
        })
        .map(u => u.email)
        .filter(e => e); // remove null/undefined
    }

    // Remove duplicates
    targetEmails = [...new Set(targetEmails)];

    console.log(`👥 [Email Broadcast] Sending to ${targetEmails.length} recipients`);

    // Send Emails (Batching to avoid rate limits if necessary, but Core.SendEmail is usually 1 by 1)
    let sentCount = 0;
    let failedCount = 0;

    // Limit to 50 for this synchronous implementation to avoid timeouts
    // In a real app, we'd use a background job or queue
    const MAX_BATCH = 50;
    const currentBatch = targetEmails.slice(0, MAX_BATCH);

    const emailPromises = currentBatch.map(async (email) => {
      try {
        console.log(`📤 Attempting to send to ${email}`);
        const response = await base44.asServiceRole.functions.invoke('sendBrevoEmail', {
          to: email,
          subject: subject,
          html_body: html_body
        });
        
        console.log(`📥 Response for ${email}:`, response.status, response.data);
        
        // Check if the response indicates success
        if (response.data && response.data.success) {
          console.log(`✅ Sent to ${email}`);
          return { success: true, email };
        } else {
          console.error(`❌ Failed to send to ${email}:`, response.data?.error || 'Unknown error');
          return { success: false, email, error: response.data?.error || 'No success flag' };
        }
      } catch (error) {
        console.error(`❌ Exception sending to ${email}:`, {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        return { success: false, email, error: error.response?.data?.error || error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    sentCount = results.filter(r => r.success).length;
    failedCount = results.filter(r => !r.success).length;
    
    const failedEmails = results.filter(r => !r.success).map(r => r.email);

    if (failedCount > 0) {
      console.error('❌ Failed emails:', failedEmails);
    }

    // If all emails failed, return an error
    if (sentCount === 0 && failedCount > 0) {
      const firstError = results.find(r => !r.success)?.error || 'Unknown error';
      return Response.json({
        error: `Failed to send emails: ${firstError}`,
        details: {
          total_targets: targetEmails.length,
          sent: sentCount,
          failed: failedCount,
          failed_emails: failedEmails
        }
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: `Successfully sent to ${sentCount} users${failedCount > 0 ? `, ${failedCount} failed` : ''}${targetEmails.length > MAX_BATCH ? ` (capped at ${MAX_BATCH})` : ''}`,
      details: {
        total_targets: targetEmails.length,
        sent: sentCount,
        failed: failedCount,
        failed_emails: failedEmails,
        capped: targetEmails.length > MAX_BATCH
      }
    });

  } catch (error) {
    console.error('❌ [Email Broadcast] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});