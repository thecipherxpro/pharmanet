import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { asyncHandler, ErrorTypes } from './helpers/errorHandler.js';

/**
 * Optimized endpoint to fetch employer profiles with user data
 * Reduces N+1 queries by batching user data fetches
 */
Deno.serve(asyncHandler(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const body = await req.json();
  const { limit = 50, offset = 0, filters = {} } = body;

  // Fetch public employer profiles
  const query = { is_active: true, ...filters };
  const employers = await base44.entities.Public_Employer_Profile.filter(query);

  // Sort by rating
  const sortedEmployers = employers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  
  // Apply pagination
  const paginatedEmployers = sortedEmployers.slice(offset, offset + limit);

  // Batch fetch user data for all employers at once
  const userIds = paginatedEmployers.map(emp => emp.user_id).filter(Boolean);
  
  // Fetch all users in one query (more efficient than N individual queries)
  const allUsers = await base44.asServiceRole.entities.User.list();
  const usersMap = new Map(
    allUsers
      .filter(u => userIds.includes(u.id))
      .map(u => [u.id, u])
  );

  // Batch fetch employer profiles
  const allEmployerProfiles = await base44.asServiceRole.entities.Employer_Profile.list();
  const employerProfilesMap = new Map(
    allEmployerProfiles
      .filter(p => userIds.includes(p.user_id))
      .map(p => [p.user_id, p])
  );

  // Enrich employer data with user information
  const enrichedEmployers = paginatedEmployers.map(employer => {
    const userData = usersMap.get(employer.user_id);
    const profileData = employerProfilesMap.get(employer.user_id);
    
    return {
      ...employer,
      display_name: userData?.display_name || profileData?.full_name || userData?.full_name || null,
      avatar_url: userData?.avatar_url || null
    };
  });

  return Response.json({
    success: true,
    data: enrichedEmployers,
    pagination: {
      total: sortedEmployers.length,
      limit: limit,
      offset: offset,
      hasMore: offset + limit < sortedEmployers.length
    }
  });
}));