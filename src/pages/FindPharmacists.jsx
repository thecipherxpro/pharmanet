import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SlidersHorizontal,
  MapPin,
  Clock,
  Star,
  ArrowLeft,
  Monitor,
  Shield,
  ChevronRight,
  Languages,
  Car,
  Syringe,
  Calendar,
  Mail,
  Search
} from "lucide-react";
import { EmployerOnly } from "../components/auth/RouteProtection";
import ProfileAvatar from "../components/shared/ProfileAvatar";
import SendInvitationDrawer from "../components/invitations/SendInvitationDrawer";
import { format } from "date-fns";
import ListSkeleton from "../components/shared/skeletons/ListSkeleton";
import EmptyState from "../components/shared/EmptyState";
import OnboardingGate from "../components/onboarding/OnboardingGate";
import { saveFilters, loadFilters, addToRecentlyViewed, getRecentlyViewed } from "../components/utils/storageUtils";
import RecentlyViewed from "../components/shared/RecentlyViewed";
import SearchWithHistory from "../components/shared/SearchWithHistory";

function FindPharmacistsContent() {
  const navigate = useNavigate();
  const savedFilters = loadFilters('PHARMACIST_FILTERS', { search: "", category: "all" });
  const [searchQuery, setSearchQuery] = useState(savedFilters.search);
  const [categoryFilter, setCategoryFilter] = useState(savedFilters.category);
  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [selectedPharmacist, setSelectedPharmacist] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  React.useEffect(() => {
    setRecentlyViewed(getRecentlyViewed('RECENTLY_VIEWED_PHARMACISTS'));
  }, []);

  React.useEffect(() => {
    saveFilters('PHARMACIST_FILTERS', {
      search: searchQuery,
      category: categoryFilter
    });
  }, [searchQuery, categoryFilter]);

  const { data: pharmacists = [], isLoading } = useQuery({
    queryKey: ['publicPharmacists'],
    queryFn: async () => {
      try {
        const profiles = await base44.entities.PublicPharmacistProfile.filter({ 
          is_active: true 
        }, '-last_active');
        
        // Fetch reviews for each pharmacist
        const profilesWithReviews = await Promise.all(
          profiles.map(async (profile) => {
            try {
              const reviews = await base44.entities.Review.filter({
                pharmacist_id: profile.user_id,
                is_visible: true
              });
              
              const totalReviews = reviews.length;
              const avgRating = totalReviews > 0 
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
                : 0;
              
              return {
                ...profile,
                rating: avgRating,
                totalReviews: totalReviews
              };
            } catch (err) {
              return profile;
            }
          })
        );
        
        return profilesWithReviews;
      } catch (error) {
        console.error('Error fetching pharmacist profiles:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  // Fetch sent invitations to show status
  const { data: sentInvitations = [] } = useQuery({
    queryKey: ['sentInvitations', currentUser?.email],
    queryFn: () => base44.entities.ShiftInvitation.filter({
      employer_email: currentUser?.email
    }, '-invited_at', 100),
    enabled: !!currentUser,
    staleTime: 30000,
  });

  const categories = [
    { value: "all", label: "All" },
    { value: "verified", label: "Verified" },
    { value: "experienced", label: "5+ Years" },
    { value: "top-rated", label: "Top Rated" }
  ];

  const filteredPharmacists = pharmacists.filter(pharmacist => {
    const matchesSearch = 
      pharmacist.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pharmacist.license_number?.includes(searchQuery);
    
    const matchesCategory = 
      categoryFilter === "all" ||
      (categoryFilter === "verified" && pharmacist.is_verified) ||
      (categoryFilter === "experienced" && pharmacist.years_experience >= 5) ||
      (categoryFilter === "top-rated" && pharmacist.rating >= 4.5);

    return matchesSearch && matchesCategory;
  });

  const handleViewProfile = (pharmacist) => {
    addToRecentlyViewed('RECENTLY_VIEWED_PHARMACISTS', {
      id: pharmacist.user_id,
      full_name: pharmacist.full_name,
      years_experience: pharmacist.years_experience
    });
    setRecentlyViewed(getRecentlyViewed('RECENTLY_VIEWED_PHARMACISTS'));
    navigate(`${createPageUrl("PublicProfile")}?id=${pharmacist.user_id}`);
  };

  const handleInvite = (e, pharmacist) => {
    e.stopPropagation();
    setSelectedPharmacist(pharmacist);
    setShowInviteDrawer(true);
  };

  const getAvailabilityText = (pharmacist) => {
    if (pharmacist.availability_status === "available") return "Available now";
    if (pharmacist.availability_status === "limited") return "Limited";
    if (pharmacist.next_available_date) {
      return format(new Date(pharmacist.next_available_date), 'MMM d');
    }
    return "Check";
  };

  const hasSpecializedSkills = (pharmacist) => {
    if (!pharmacist.pharmaceutical_skills) return false;
    const vaccinationSkills = ['Vaccination', 'Immunization', 'Injections'];
    return pharmacist.pharmaceutical_skills.some(skill => 
      vaccinationSkills.some(v => skill.toLowerCase().includes(v.toLowerCase()))
    );
  };

  const hasPendingInvitation = (pharmacistEmail) => {
    return sentInvitations.some(
      inv => inv.pharmacist_email === pharmacistEmail && inv.status === 'pending'
    );
  };

  if (isLoading) {
    return <ListSkeleton itemCount={8} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Pharmacists</h1>
                <p className="text-sm text-gray-500 mt-1">{filteredPharmacists.length} pharmacists available</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or license..."
                    className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <button className="h-10 px-4 bg-white border border-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Category Pills */}
          <div className="flex gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  categoryFilter === cat.value
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Desktop Grid */}
          {filteredPharmacists.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-semibold mb-1">No Pharmacists Found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPharmacists.map((pharmacist) => {
                const invited = hasPendingInvitation(pharmacist.pharmacist_email);
                return (
                  <div
                    key={pharmacist.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                    onClick={() => handleViewProfile(pharmacist)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <ProfileAvatar user={pharmacist} size="md" editable={false} />
                        {pharmacist.is_verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center border-2 border-white">
                            <Shield className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{pharmacist.full_name}</h3>
                        <p className="text-xs text-gray-500">
                          {pharmacist.years_experience > 0 && `${pharmacist.years_experience}y exp`}
                        </p>
                      </div>
                      {invited && (
                        <Badge className="bg-amber-500 text-white text-[10px]">Invited</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 bg-amber-50 rounded px-2 py-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold">{pharmacist.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      {pharmacist.software_experience?.[0] && (
                        <div className="flex items-center gap-1 bg-blue-50 rounded px-2 py-1">
                          <Monitor className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-800 truncate">{pharmacist.software_experience[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => handleInvite(e, pharmacist)}
                        disabled={invited}
                        className={`flex-1 h-8 text-xs ${invited ? 'bg-gray-300' : 'bg-teal-600 hover:bg-teal-700'}`}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        {invited ? 'Invited' : 'Invite'}
                      </Button>
                      <button className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Header */}
      <div className="sticky top-0 bg-white z-40 shadow-sm">
        <div className="px-3 py-3">
          <div className="flex items-center gap-2.5 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </button>
            <h1 className="text-base font-bold text-gray-900">Find Pharmacists</h1>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <SearchWithHistory
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search name or license..."
                className="w-full h-10 bg-gray-50 border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 active:bg-gray-100 transition-colors">
              <SlidersHorizontal className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat.value
                    ? "bg-teal-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 active:bg-gray-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-600">
          {filteredPharmacists.length} found
        </p>
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="px-3 mb-4">
          <RecentlyViewed items={recentlyViewed} type="pharmacist" />
        </div>
      )}

      {/* Pharmacist List */}
      <div className="px-3 space-y-2.5">
        {filteredPharmacists.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={Star}
              title="No Pharmacists Found"
              description="Try adjusting your search criteria or filters to find pharmacists. New pharmacists are joining daily."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchQuery("");
                setCategoryFilter("all");
              }}
              secondaryActionLabel="Post a Shift"
              onSecondaryAction={() => navigate(createPageUrl("PostShift"))}
            />
          </div>
        ) : (
          filteredPharmacists.map((pharmacist) => {
            const invited = hasPendingInvitation(pharmacist.pharmacist_email);
            
            return (
              <Card
                key={pharmacist.id}
                className="border-0 shadow-sm hover:shadow-md transition-all bg-white"
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Avatar with Verified Badge */}
                    <div 
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={() => handleViewProfile(pharmacist)}
                    >
                      <ProfileAvatar 
                        user={pharmacist} 
                        size="md"
                        editable={false}
                      />
                      {pharmacist.is_verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <Shield className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleViewProfile(pharmacist)}
                    >
                      {/* Name & Invited Badge */}
                      <div className="flex items-start justify-between mb-0.5">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight break-words">
                          {pharmacist.full_name}
                        </h3>
                        {invited && (
                          <Badge className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0">
                            Invited
                          </Badge>
                        )}
                      </div>

                      {/* Role & Experience */}
                      <p className="text-xs text-gray-600 mb-2">
                        {pharmacist.shift_preference ? 
                          `${pharmacist.shift_preference.charAt(0).toUpperCase() + pharmacist.shift_preference.slice(1).replace('_', ' ')}` : 
                          'Pharmacist'
                        }
                        {pharmacist.years_experience > 0 && ` • ${pharmacist.years_experience}y exp`}
                      </p>

                      {/* Rating & Software */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 bg-amber-50 rounded-md px-2 py-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-gray-900">
                            {pharmacist.rating > 0 ? pharmacist.rating.toFixed(1) : '0.0'}
                          </span>
                          <span className="text-xs text-gray-600">
                            ({pharmacist.totalReviews || 0})
                          </span>
                        </div>

                        {pharmacist.software_experience && pharmacist.software_experience.length > 0 && (
                          <div className="flex items-center gap-1 bg-blue-50 rounded-md px-2 py-1 flex-1 min-w-0">
                            <Monitor className="w-3 h-3 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-blue-900 truncate">
                              {pharmacist.software_experience.slice(0, 2).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Badges Row */}
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        {pharmacist.languages && pharmacist.languages.length > 1 && (
                          <div className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                            <Languages className="w-3 h-3" />
                            <span className="text-[10px]">{pharmacist.languages[0]}</span>
                          </div>
                        )}
                        
                        {pharmacist.commute_mode === 'car' && (
                          <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">
                            <Car className="w-3 h-3" />
                          </div>
                        )}

                        {hasSpecializedSkills(pharmacist) && (
                          <div className="flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-medium">
                            <Syringe className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Location & Availability */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          {pharmacist.preferred_regions && pharmacist.preferred_regions.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="font-medium">{pharmacist.preferred_regions[0]}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-teal-700">
                            {pharmacist.next_available_date ? (
                              <Calendar className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span className="font-medium">{getAvailabilityText(pharmacist)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex flex-col gap-1.5">
                      <Button
                        size="sm"
                        onClick={(e) => handleInvite(e, pharmacist)}
                        disabled={invited}
                        className={`h-8 px-2.5 text-xs ${
                          invited 
                            ? 'bg-gray-300 text-gray-600' 
                            : 'bg-teal-600 hover:bg-teal-700'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                      <button 
                        onClick={() => handleViewProfile(pharmacist)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Invitation Drawer */}
      {selectedPharmacist && (
        <SendInvitationDrawer
          open={showInviteDrawer}
          onClose={() => {
            setShowInviteDrawer(false);
            setSelectedPharmacist(null);
          }}
          pharmacistId={selectedPharmacist.user_id}
          pharmacistEmail={selectedPharmacist.pharmacist_email}
          pharmacistName={selectedPharmacist.full_name}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      </div>
    </div>
  );
}

export default function FindPharmacists() {
  return (
    <EmployerOnly>
      <OnboardingGate userType="employer" minimumCompletion={80}>
        <FindPharmacistsContent />
      </OnboardingGate>
    </EmployerOnly>
  );
}