import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated and is admin
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin' && user.user_type !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all users using service role
    const allUsers = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const batch = await base44.asServiceRole.entities.User.list('-created_date', limit, offset);
      if (!batch || batch.length === 0) break;
      allUsers.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }

    if (allUsers.length === 0) {
      return Response.json({ error: 'No users found' }, { status: 404 });
    }

    // Collect all unique keys from all users
    const allKeys = new Set();
    allUsers.forEach(user => {
      Object.keys(user).forEach(key => allKeys.add(key));
    });

    // Define priority columns (these come first)
    const priorityColumns = ['id', 'email', 'full_name', 'role', 'user_type', 'created_date', 'updated_date'];
    
    // Build final column order: priority first, then rest alphabetically
    const otherColumns = [...allKeys].filter(k => !priorityColumns.includes(k)).sort();
    const columns = [...priorityColumns.filter(c => allKeys.has(c)), ...otherColumns];

    // Helper to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV
    const headerRow = columns.map(escapeCSV).join(',');
    const dataRows = allUsers.map(user => {
      return columns.map(col => escapeCSV(user[col])).join(',');
    });

    const csvContent = [headerRow, ...dataRows].join('\n');

    // Return as downloadable CSV
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});