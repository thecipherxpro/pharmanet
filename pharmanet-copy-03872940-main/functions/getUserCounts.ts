import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

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

    console.log('📊 [Get User Counts] Admin:', user.email);

    // Fetch all users using service role
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    console.log('👥 [Get User Counts] Total users found:', allUsers.length);

    // Count by type
    const pharmacists = allUsers.filter(u => u.user_type === 'pharmacist');
    const employers = allUsers.filter(u => u.user_type === 'employer');
    const admins = allUsers.filter(u => u.user_type === 'admin' || u.role === 'admin');
    const withType = allUsers.filter(u => u.user_type);
    const unassigned = allUsers.filter(u => !u.user_type && u.role !== 'admin');

    const counts = {
      total: allUsers.length,
      pharmacists: pharmacists.length,
      employers: employers.length,
      admins: admins.length,
      withType: withType.length,
      unassigned: unassigned.length
    };

    console.log('📊 [Get User Counts] Breakdown:', counts);

    return Response.json(counts);

  } catch (error) {
    console.error('❌ [Get User Counts] Error:', error);
    return Response.json({ 
      error: error.message,
      total: 0,
      pharmacists: 0,
      employers: 0,
      admins: 0,
      withType: 0,
      unassigned: 0
    }, { status: 500 });
  }
});