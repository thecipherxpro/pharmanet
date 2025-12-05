import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, MapPin, TrendingUp, AlertCircle } from "lucide-react";
import UnifiedShiftCard from "../components/shift/UnifiedShiftCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { formatTime12Hour, parseLocalDate } from "../components/utils/timeUtils";
import { getScheduleFromShift } from "../components/utils/shiftUtils";
import ErrorMessage from "../components/shared/ErrorMessage";
import CardGridSkeleton from "../components/shared/skeletons/CardGridSkeleton";
import PharmacistShiftDetailsDrawer from "../components/pharmacist/PharmacistShiftDetailsDrawer";
import EmptyState from "../components/shared/EmptyState";
import OnboardingGate from "../components/onboarding/OnboardingGate";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { saveFilters, loadFilters, addToRecentlyViewed, getRecentlyViewed } from "../components/utils/storageUtils";
import RecentlyViewed from "../components/shared/RecentlyViewed";
import SearchWithHistory from "../components/shared/SearchWithHistory";

function BrowseShiftsContent() {
  const savedFilters = loadFilters('SHIFT_FILTERS', { search: "", city: "all", urgency: "all" });
  const [searchQuery, setSearchQuery] = useState(savedFilters.search);
  const [cityFilter, setCityFilter] = useState(savedFilters.city);
  const [urgencyFilter, setUrgencyFilter] = useState(savedFilters.urgency);
  const [user, setUser] = useState(null);

  const [selectedShift, setSelectedShift] = useState(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUser();
    setRecentlyViewed(getRecentlyViewed('RECENTLY_VIEWED_SHIFTS'));
  }, []);

  useEffect(() => {
    saveFilters('SHIFT_FILTERS', {
      search: searchQuery,
      city: cityFilter,
      urgency: urgencyFilter
    });
  }, [searchQuery, cityFilter, urgencyFilter]);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const handleViewShiftDetails = (shift) => {
    const schedule = getScheduleFromShift(shift);
    const primaryDate = schedule[0]?.date || '';
    
    addToRecentlyViewed('RECENTLY_VIEWED_SHIFTS', {
      id: shift.id,
      pharmacy_name: shift.pharmacy_name,
      pharmacy_city: shift.pharmacy_city,
      shift_date: primaryDate,
      hourly_rate: shift.hourly_rate
    });
    setRecentlyViewed(getRecentlyViewed('RECENTLY_VIEWED_SHIFTS'));
    setSelectedShift(shift);
    setShowDetailsDrawer(true);
  };

  const { 
    data, 
    isLoading, 
    error: shiftsError, 
    refetch: refetchShifts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['shifts', cityFilter, urgencyFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const query = { status: "open" };
      if (cityFilter !== "all") query.pharmacy_city = cityFilter;
      if (urgencyFilter !== "all") query.pricing_tier = urgencyFilter;

      const rawShiftsResult = await base44.entities.Shift.filter(
        query, 
        "-created_date", 
        limit, 
        pageParam
      );
      const rawShifts = rawShiftsResult || [];
      
      const now = new Date();
      const filtered = rawShifts.filter(shift => {
        const schedule = getScheduleFromShift(shift);
        if (schedule.length === 0) return false;
        
        return schedule.some(dateInfo => {
          if (!dateInfo.date) return false;
          const shiftDate = parseLocalDate(dateInfo.date);
          const [endHours, endMinutes] = (dateInfo.end_time || "17:00").split(':').map(Number);
          const shiftEndDateTime = new Date(shiftDate);
          shiftEndDateTime.setHours(endHours, endMinutes, 0, 0);
          return shiftEndDateTime >= now;
        });
      });
      
      return { shifts: filtered, fetchedCount: rawShifts.length };
    },
    getNextPageParam: (lastPage, allPages) => {
      const limit = 20;
      if (lastPage.fetchedCount < limit) return undefined;
      return allPages.length * limit;
    },
    retry: 2,
    staleTime: 30000,
    refetchOnMount: true,
    refetchInterval: 10000,
  });

  const shifts = data ? data.pages.flatMap(page => page.shifts) : [];

  // Fetch user profile for recommendations
  const { data: userProfile } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.PublicPharmacistProfile.filter({
        pharmacist_email: user?.email
      });
      return profiles[0] || null;
    },
    enabled: !!user,
    staleTime: 120000,
  });

  // Calculate my applications for filtering
  const { data: myApplications } = useQuery({
    queryKey: ['myApplicationsForFilter', user?.email],
    queryFn: () => base44.entities.ShiftApplication.filter({
      pharmacist_email: user?.email
    }, "-applied_date", 100),
    enabled: !!user,
    initialData: [],
    staleTime: 10000,
    refetchInterval: 15000, // Poll applications periodically to check for status updates
  });

  const appliedShiftIds = new Set(myApplications.map(app => app.shift_id));

  // Auto-open shift drawer from external app URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shiftIdToOpen = urlParams.get('openShift');
    
    if (shiftIdToOpen && user && shifts.length > 0) {
      const shift = shifts.find(s => s.id === shiftIdToOpen);
      if (shift) {
        setSelectedShift(shift);
        setShowDetailsDrawer(true);
        // Clean URL parameter
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [shifts, user, location.search]);

  const handleRecentlyViewedClick = (recentItem) => {
    const shift = shifts.find(s => s.id === recentItem.id);
    if (shift) {
      handleViewShiftDetails(shift);
    } else {
      // If shift is not in the current loaded list (e.g. filtered out), 
      // update URL to trigger the effect which might handle it 
      // (though effect depends on 'shifts' which might not have it)
      navigate(createPageUrl("BrowseShifts") + `?openShift=${recentItem.id}`);
    }
  };



  // Client-side search only (City and Urgency handled in DB)
  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = !searchQuery || 
                         shift.pharmacy_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shift.pharmacy_city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Sort shifts by date
  const sortedShifts = React.useMemo(() => {
    return [...filteredShifts].sort((shiftA, shiftB) => {
      const scheduleA = getScheduleFromShift(shiftA);
      const scheduleB = getScheduleFromShift(shiftB);
      
      const dateA = scheduleA[0]?.date 
        ? parseLocalDate(scheduleA[0].date)
        : new Date();
        
      const dateB = scheduleB[0]?.date
        ? parseLocalDate(scheduleB[0].date)
        : new Date();
        
      return dateA - dateB;
    });
  }, [filteredShifts]);

  // Smart recommendations based on user profile
  const recommendedShifts = userProfile ? filteredShifts.filter(shift => {
    let score = 0;
    
    // Software match
    if (shift.pharmacy_software && userProfile.software_experience) {
      const hasMatchingSoftware = shift.pharmacy_software.some(sw => 
        userProfile.software_experience.includes(sw)
      );
      if (hasMatchingSoftware) score += 3;
    }
    
    // City match
    if (userProfile.preferred_regions?.includes(shift.pharmacy_city)) {
      score += 2;
    }
    
    // Not yet applied
    if (!appliedShiftIds.has(shift.id)) {
      score += 1;
    }
    
    return score >= 2;
  }) : [];

  const cities = [...new Set(shifts.map(s => s.pharmacy_city).filter(Boolean))];
  const highPayingShifts = filteredShifts.filter(s => s.hourly_rate >= 60);
  const notAppliedShifts = filteredShifts.filter(s => !appliedShiftIds.has(s.id));



  if (shiftsError) {
    return (
      <ErrorMessage
        title="Failed to Load Shifts"
        message="We couldn't load available shifts. Please check your connection and try again."
        onRetry={() => {
          refetchShifts();
        }}
        showRetry={true}
      />
    );
  }

  // The primary loading state for shifts content
  if (isLoading) {
    return <CardGridSkeleton itemCount={8} />;
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Browse Shifts</h1>
                <p className="text-sm text-gray-500 mt-1">{notAppliedShifts.length} new shifts available • {filteredShifts.length} total</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-72">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pharmacy or location..."
                    className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Filters Sidebar */}
            <div className="col-span-3">
              <Card className="sticky top-24 border border-gray-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
                      <Select value={cityFilter} onValueChange={setCityFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Cities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cities</SelectItem>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Urgency</label>
                      <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Rates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Rates</SelectItem>
                          <SelectItem value="emergency">🚨 Emergency</SelectItem>
                          <SelectItem value="very_urgent">⚡ Very Urgent</SelectItem>
                          <SelectItem value="urgent">🔥 Urgent</SelectItem>
                          <SelectItem value="planned">📅 Planned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(cityFilter !== "all" || urgencyFilter !== "all") && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setCityFilter("all");
                          setUrgencyFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>

                  {/* Smart Alerts */}
                  {recommendedShifts.length > 0 && (
                    <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">
                        {recommendedShifts.length} recommended based on your profile
                      </p>
                    </div>
                  )}
                  {highPayingShifts.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800">
                        {highPayingShifts.length} high-paying shifts ($60+/hr)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Shifts Grid */}
            <div className="col-span-9">
              {sortedShifts.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shifts Available</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your filters</p>
                    <Button variant="outline" onClick={() => { setCityFilter("all"); setUrgencyFilter("all"); }}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedShifts.map((shift) => (
                    <UnifiedShiftCard 
                      key={shift.id}
                      shift={shift}
                      viewType="pharmacist"
                      hasApplied={appliedShiftIds.has(shift.id)}
                      applicationStatus={myApplications.find(a => a.shift_id === shift.id)?.status}
                      onViewDetails={handleViewShiftDetails}
                    />
                  ))}
                </div>
              )}
              
              {hasNextPage && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading..." : "Load More Shifts"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Professional Medical Header */}
      <div className="bg-gradient-to-br from-teal-600 via-cyan-700 to-teal-800 text-white p-4 sm:p-6 pb-6 sm:pb-8 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold">Find Your Next Shift</h1>
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full text-[10px] font-medium text-white/90 border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Updates
          </div>
        </div>
        <p className="text-gray-200 mb-4 text-sm sm:text-base">
          {notAppliedShifts.length} new shifts available • {filteredShifts.length} total
        </p>

        {/* Search Bar */}
        <SearchWithHistory
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search pharmacy or location..."
              className="bg-white border-gray-200 text-gray-900 h-12 text-base shadow-sm"
            />

            {/* Smart Alerts */}
            <div className="mt-4 space-y-2">
              {recommendedShifts.length > 0 && (
                <div className="bg-blue-500/20 backdrop-blur rounded-xl p-3 flex items-center gap-2 border border-blue-400/30">
                  <TrendingUp className="w-5 h-5 text-blue-200 flex-shrink-0" />
                  <span className="text-sm text-gray-100">
                    <span className="font-bold">{recommendedShifts.length}</span> recommended shifts based on your profile
                  </span>
                </div>
              )}
              
              {highPayingShifts.length > 0 && (
                <div className="bg-green-500/20 backdrop-blur rounded-xl p-3 flex items-center gap-2 border border-green-400/30">
                  <TrendingUp className="w-5 h-5 text-green-200 flex-shrink-0" />
                  <span className="text-sm text-gray-100">
                    <span className="font-bold">{highPayingShifts.length}</span> high-paying shifts ($60+/hr) available
                  </span>
                </div>
              )}
        </div>
      </div>



      {/* Content */}
      <>
        {/* Professional Filters */}
          <div className="px-4 mb-4">
            <div className="bg-white rounded-xl shadow-md p-4 space-y-3 border border-gray-200">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Filter className="w-4 h-4" />
                Filters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-12 border-gray-200">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="h-12 border-gray-200">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rates</SelectItem>
                    <SelectItem value="emergency">🚨 Emergency</SelectItem>
                    <SelectItem value="very_urgent">⚡ Very Urgent</SelectItem>
                    <SelectItem value="urgent">🔥 Urgent</SelectItem>
                    <SelectItem value="short_notice">Short Notice</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="reasonable">Reasonable</SelectItem>
                    <SelectItem value="planned">📅 Planned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(cityFilter !== "all" || urgencyFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCityFilter("all");
                    setUrgencyFilter("all");
                  }}
                  className="w-full text-blue-600 h-10 hover:bg-blue-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <div className="px-4 mb-4">
              <RecentlyViewed 
                items={recentlyViewed} 
                type="shift" 
                onItemClick={handleRecentlyViewedClick}
              />
            </div>
          )}

          {/* Shifts List */}
          <div className="px-4 space-y-3">
            {sortedShifts.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No Shifts Available"
                description="There are no shifts matching your criteria at the moment. Try adjusting your filters or check back later for new opportunities."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchQuery("");
                  setCityFilter("all");
                  setUrgencyFilter("all");
                }}
                secondaryActionLabel="Browse Employers"
                onSecondaryAction={() => navigate(createPageUrl("BrowseEmployers"))}
              />
            ) : (
              sortedShifts.map((shift) => (
                <UnifiedShiftCard 
                  key={shift.id}
                  shift={shift}
                  viewType="pharmacist"
                  hasApplied={appliedShiftIds.has(shift.id)}
                  applicationStatus={myApplications.find(a => a.shift_id === shift.id)?.status}
                  onViewDetails={handleViewShiftDetails}
                />
              ))
            )}
            
            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center pt-4 pb-8">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="min-w-[200px]"
                >
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    "Load More Shifts"
                  )}
                </Button>
              </div>
            )}
            </div>
            </>
      </div>

      {/* Shift Details Drawer */}
      <PharmacistShiftDetailsDrawer
        open={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedShift(null);
        }}
        shift={selectedShift}
        userEmail={user?.email}
      />
    </div>
  );
}

export default function BrowseShifts() {
  return (
    <PharmacistOnly>
      <OnboardingGate userType="pharmacist" minimumCompletion={80}>
        <BrowseShiftsContent />
      </OnboardingGate>
    </PharmacistOnly>
  );
}