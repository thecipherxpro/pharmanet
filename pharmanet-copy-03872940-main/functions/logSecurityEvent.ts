import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const logEntry = await req.json();
    
    // Get real IP address from headers
    const ip_address = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    // Create security log entry with service role
    await base44.asServiceRole.entities.SecurityLog.create({
      ...logEntry,
      ip_address,
      created_date: new Date().toISOString()
    });

    // Check for critical events and trigger alerts
    if (logEntry.severity === 'critical' || logEntry.severity === 'high') {
      // Could send alert emails to admins here
      console.warn('HIGH SEVERITY SECURITY EVENT:', logEntry);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error logging security event:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});