import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Star, CheckCircle, Calendar, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function EmployerCard({ employer, onClick }) {
  if (!employer) return null;

  const rating = employer.rating || 0;
  const hasRating = rating > 0;

  // Optimized: Fetch both employer profile and user data in a single query batch
  const { data: employerData, isLoading: dataLoading } = useQuery({
    queryKey: ['employerCardData', employer.user_id],
    queryFn: async () => {
      // Batch queries for better performance
      const [profiles, users] = await Promise.all([
        base44.entities.Employer_Profile.filter({ user_id: employer.user_id }),
        base44.entities.User.filter({ id: employer.user_id })
      ]);
      
      return {
        profile: profiles?.[0] || null,
        user: users?.[0] || null
      };
    },
    enabled: !!employer.user_id,
    staleTime: 5 * 60 * 1000,
  });

  const employerProfile = employerData?.profile;
  const userData = employerData?.user;
  
  // Priority: User.display_name > Employer_Profile.full_name > User.full_name > email username > "Employer"
  const fullName = userData?.display_name || 
                   employerProfile?.full_name || 
                   userData?.full_name || 
                   employer.employer_email?.split('@')[0] || 
                   'Employer';
  const avatarUrl = userData?.avatar_url;
  
  // Show loading state only if still fetching
  const isLoadingData = dataLoading;
  
  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return 'E';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card 
      onClick={onClick}
      className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-base">
                {getInitials(fullName)}
              </span>
            )}
          </div>

          {/* Name & Verification */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {isLoadingData ? (
                  <span className="inline-block h-5 w-32 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  fullName
                )}
              </h3>
              {employer.is_verified && (
                <div className="flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-gray-900" />
                </div>
              )}
            </div>

            {/* Rating */}
            {hasRating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-gray-900 fill-gray-900" />
                <span className="text-sm font-semibold text-gray-900">
                  {rating.toFixed(1)}
                </span>
                {employer.total_hires > 0 && (
                  <span className="text-xs text-gray-500">
                    ({employer.total_hires} hire{employer.total_hires !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {employer.bio && (
          <p className="text-sm text-gray-700 leading-relaxed mb-3 line-clamp-2">
            {employer.bio}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-gray-900">
              {employer.number_of_pharmacies || 0}
            </div>
            <div className="text-[10px] text-gray-600 font-medium">
              Pharmacies
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-gray-900">
              {employer.total_shifts_posted || 0}
            </div>
            <div className="text-[10px] text-gray-600 font-medium">
              Shifts Posted
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-gray-900">
              {employer.response_rate || 0}%
            </div>
            <div className="text-[10px] text-gray-600 font-medium">
              Response
            </div>
          </div>
        </div>

        {/* Locations */}
        {employer.pharmacies_locations && employer.pharmacies_locations.length > 0 && (
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 flex flex-wrap gap-1">
              {employer.pharmacies_locations.slice(0, 3).map((location, idx) => (
                <span 
                  key={idx}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                >
                  {location}
                </span>
              ))}
              {employer.pharmacies_locations.length > 3 && (
                <span className="inline-block px-2 py-0.5 text-gray-600 text-xs font-medium">
                  +{employer.pharmacies_locations.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Software */}
        {employer.software_used && employer.software_used.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {employer.software_used.slice(0, 4).map((software, idx) => (
              <span 
                key={idx}
                className="inline-block px-2 py-1 bg-gray-100 border border-gray-200 text-gray-800 rounded-lg text-xs font-medium"
              >
                {software}
              </span>
            ))}
            {employer.software_used.length > 4 && (
              <span className="inline-block px-2 py-1 text-gray-600 text-xs font-medium">
                +{employer.software_used.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Shift Types */}
        {employer.preferred_shift_types && employer.preferred_shift_types.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {employer.preferred_shift_types.map((type, idx) => (
              <span 
                key={idx}
                className="inline-block px-2 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium"
              >
                {type.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}

        {/* View Profile CTA */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="w-full text-center text-sm font-semibold text-gray-900">
            View Full Profile →
          </div>
        </div>
      </CardContent>
    </Card>
  );
}