import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Star,
  CheckCircle,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Mail,
  Phone,
  Globe,
  Award,
  Briefcase,
  MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardSkeleton from "../components/shared/skeletons/DashboardSkeleton";
import ErrorMessage from "../components/shared/ErrorMessage";
import { Authenticated } from "../components/auth/RouteProtection";

function EmployerPublicViewContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employerId = searchParams.get("id");

  // Fetch employer public profile
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['employerPublicProfile', employerId],
    queryFn: async () => {
      const profiles = await base44.entities.Public_Employer_Profile.filter({
        user_id: employerId
      });
      return profiles[0];
    },
    enabled: !!employerId,
  });

  // Fetch employer user data for name and avatar
  const { data: userData } = useQuery({
    queryKey: ['employerUserData', employerId],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: employerId });
      return users[0];
    },
    enabled: !!employerId,
  });

  // Fetch employer private profile for full name
  const { data: employerProfile } = useQuery({
    queryKey: ['employerProfileData', employerId],
    queryFn: async () => {
      const profiles = await base44.entities.Employer_Profile.filter({ user_id: employerId });
      return profiles[0];
    },
    enabled: !!employerId,
  });

  // Track profile view
  useEffect(() => {
    if (profile?.id) {
      base44.entities.Public_Employer_Profile.update(profile.id, {
        profile_views: (profile.profile_views || 0) + 1
      }).catch(err => console.error('Failed to track view:', err));
    }
  }, [profile?.id]);

  if (error || (!isLoading && !profile)) {
    return (
      <ErrorMessage
        title="Employer Not Found"
        message="This employer profile doesn't exist or has been removed."
        onRetry={refetch}
        onGoHome={() => navigate(createPageUrl("BrowseEmployers"))}
      />
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const fullName = profile?.full_name || 
                   userData?.display_name || 
                   employerProfile?.full_name || 
                   userData?.full_name || 
                   profile?.employer_email?.split('@')[0] || 
                   'Employer';
  
  const avatarUrl = userData?.avatar_url;
  const hasRating = (profile.rating || 0) > 0;

  const getInitials = (name) => {
    if (!name) return 'E';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Employer Profile</h1>
              <p className="text-xs text-gray-600">Public information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Hero - Monochrome */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-3 py-8">
        <div className="text-center mb-6">
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-xl">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-900 font-bold text-3xl">
                {getInitials(fullName)}
              </span>
            )}
          </div>

          {/* Name & Verification */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold">{fullName}</h2>
            {profile.is_verified && (
              <CheckCircle className="w-6 h-6 text-white" />
            )}
          </div>

          {/* Rating */}
          {hasRating && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="w-5 h-5 fill-white" />
              <span className="text-xl font-bold">{profile.rating.toFixed(1)}</span>
              {profile.total_hires > 0 && (
                <span className="text-sm text-gray-300">
                  ({profile.total_hires} hire{profile.total_hires !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats - Monochrome Cards */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Building2 className="w-5 h-5 mx-auto mb-1 text-white" />
            <div className="text-2xl font-bold text-white">
              {profile.number_of_pharmacies || 0}
            </div>
            <div className="text-xs text-gray-300 font-medium">
              Pharmacies
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Briefcase className="w-5 h-5 mx-auto mb-1 text-white" />
            <div className="text-2xl font-bold text-white">
              {profile.total_shifts_posted || 0}
            </div>
            <div className="text-xs text-gray-300 font-medium">
              Shifts Posted
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Users className="w-5 h-5 mx-auto mb-1 text-white" />
            <div className="text-2xl font-bold text-white">
              {profile.total_hires || 0}
            </div>
            <div className="text-xs text-gray-300 font-medium">
              Total Hires
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-4 space-y-3">
        {/* Performance Stats */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Response Rate</span>
                </div>
                <span className="text-base font-bold text-gray-900">
                  {profile.response_rate || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Avg Response Time</span>
                </div>
                <span className="text-base font-bold text-gray-900">
                  {profile.average_response_time || 0}h
                </span>
              </div>
              {profile.active_since && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Active Since</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(profile.active_since).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        {profile.pharmacies_locations && profile.pharmacies_locations.length > 0 && (
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Locations
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.pharmacies_locations.map((location, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    {location}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Software Used */}
        {profile.software_used && profile.software_used.length > 0 && (
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4">
              <h3 className="text-base font-bold text-gray-900 mb-3">Software Used</h3>
              <div className="flex flex-wrap gap-2">
                {profile.software_used.map((software, idx) => (
                  <span 
                    key={idx}
                    className="inline-block px-3 py-2 bg-gray-100 border border-gray-200 text-gray-800 rounded-xl text-sm font-medium"
                  >
                    {software}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shift Types */}
        {profile.preferred_shift_types && profile.preferred_shift_types.length > 0 && (
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4">
              <h3 className="text-base font-bold text-gray-900 mb-3">Shift Types Offered</h3>
              <div className="flex flex-wrap gap-2">
                {profile.preferred_shift_types.map((type, idx) => (
                  <span 
                    key={idx}
                    className="inline-block px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium"
                  >
                    {type.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endorsements */}
        {profile.endorsements && profile.endorsements.length > 0 && (
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Endorsements
              </h3>
              <div className="space-y-3">
                {profile.endorsements.map((endorsement, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-700 italic mb-2">
                      "{endorsement.endorsement}"
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-900">
                        {endorsement.pharmacist_name}
                      </span>
                      <span className="text-gray-600">
                        {new Date(endorsement.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact CTA */}
        <Card className="border-2 border-gray-900 shadow-lg bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl">
          <CardContent className="p-5">
            <h3 className="text-lg font-bold mb-2">Interested in Working Here?</h3>
            <p className="text-gray-300 text-sm mb-4">
              Send a message to express your interest and availability.
            </p>
            <Button 
              onClick={() => navigate(createPageUrl("Messages"))}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 rounded-xl"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EmployerPublicView() {
  return (
    <Authenticated>
      <EmployerPublicViewContent />
    </Authenticated>
  );
}