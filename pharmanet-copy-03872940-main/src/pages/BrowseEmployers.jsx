import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import EmployerCard from "../components/employers/EmployerCard";
import EmployerFilters from "../components/employers/EmployerFilters";
import DashboardSkeleton from "../components/shared/skeletons/DashboardSkeleton";
import ErrorMessage from "../components/shared/ErrorMessage";
import EmployerCardSkeleton from "../components/shared/skeletons/EmployerCardSkeleton";

function BrowseEmployersContent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    verified: false,
    topRated: false,
    software: [],
    shiftTypes: [],
    locations: []
  });

  // Fetch active employer profiles with pagination
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['activeEmployers'],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      // Fetch sorted by rating (descending) directly from DB if supported, otherwise sort client side (mixed page sorting is imperfect but faster load)
      // Using '-rating' for sort
      const result = await base44.entities.Public_Employer_Profile.filter(
        { is_active: true }, 
        "-rating", 
        limit, 
        pageParam
      );
      const profiles = result || [];
      return { profiles, fetchedCount: profiles.length };
    },
    getNextPageParam: (lastPage, allPages) => {
      const limit = 20;
      if (lastPage.fetchedCount < limit) return undefined;
      return allPages.length * limit;
    },
    staleTime: 60 * 1000,
  });

  const employers = data ? data.pages.flatMap(page => page.profiles) : [];

  // Filter employers based on search and filters
  const filteredEmployers = employers.filter(employer => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      employer.bio?.toLowerCase().includes(searchLower) ||
      employer.employer_email?.toLowerCase().includes(searchLower) ||
      employer.pharmacies_locations?.some(loc => loc.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // Verified filter
    if (filters.verified && !employer.is_verified) return false;

    // Top rated filter (4+ stars)
    if (filters.topRated && (employer.rating || 0) < 4) return false;

    // Software filter
    if (filters.software.length > 0) {
      const hasSoftware = filters.software.some(sw => 
        employer.software_used?.includes(sw)
      );
      if (!hasSoftware) return false;
    }

    // Shift types filter
    if (filters.shiftTypes.length > 0) {
      const hasShiftType = filters.shiftTypes.some(type => 
        employer.preferred_shift_types?.includes(type)
      );
      if (!hasShiftType) return false;
    }

    // Locations filter
    if (filters.locations.length > 0) {
      const hasLocation = filters.locations.some(loc => 
        employer.pharmacies_locations?.some(empLoc => 
          empLoc.toLowerCase().includes(loc.toLowerCase())
        )
      );
      if (!hasLocation) return false;
    }

    return true;
  });

  const activeFilterCount = 
    (filters.verified ? 1 : 0) +
    (filters.topRated ? 1 : 0) +
    filters.software.length +
    filters.shiftTypes.length +
    filters.locations.length;

  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Employers"
        message="We couldn't load employer profiles. Please try again."
        onRetry={refetch}
        onGoHome={() => navigate(createPageUrl("PharmacistDashboard"))}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="px-3 py-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-40 mb-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
        <div className="px-3 pt-4 space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <EmployerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-3 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Browse Employers</h1>
              <p className="text-xs text-gray-600">
                {filteredEmployers.length} employer{filteredEmployers.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search employers, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-gray-50 border-gray-200 rounded-xl text-sm"
            />
          </div>
        </div>
      </div>

      {/* Filters - Sticky */}
      <div className="sticky top-[120px] z-30 bg-white border-b border-gray-200 shadow-sm">
        <EmployerFilters 
          filters={filters} 
          setFilters={setFilters}
          activeCount={activeFilterCount}
        />
      </div>

      {/* Employer List */}
      <div className="px-3 pt-4">
        {filteredEmployers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No Employers Found</h3>
            <p className="text-sm text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredEmployers.map((employer) => (
              <EmployerCard 
                key={employer.id} 
                employer={employer}
                onClick={() => navigate(createPageUrl("EmployerPublicView") + `?id=${employer.user_id}`)}
              />
            ))}

            {hasNextPage && (
              <div className="flex justify-center pt-4 pb-8">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {isFetchingNextPage ? "Loading..." : "Load More Employers"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowseEmployers() {
  return (
    <PharmacistOnly>
      <BrowseEmployersContent />
    </PharmacistOnly>
  );
}