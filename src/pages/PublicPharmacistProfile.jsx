import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  User as UserIcon,
  Mail,
  Phone,
  Award,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  Star,
  Car,
  Bus,
  Bike,
  MessageSquare,
  Send,
  ArrowLeft
} from "lucide-react";
import { format, isFuture } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as Avatar from '@radix-ui/react-avatar';

export default function PublicPharmacistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const { data: pharmacist, isLoading } = useQuery({
    queryKey: ['pharmacistPublicProfile', id],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: id });
      return users[0];
    },
    enabled: !!id,
  });

  const { data: availability } = useQuery({
    queryKey: ['pharmacistPublicAvailability', pharmacist?.email],
    queryFn: () => base44.entities.AvailabilitySchedule.filter(
      { pharmacist_email: pharmacist?.email, available: true },
      "date",
      3
    ),
    enabled: !!pharmacist,
    initialData: [],
  });

  const upcomingAvailability = availability.filter(slot => 
    isFuture(new Date(slot.date))
  ).slice(0, 3);

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.split(" ");
    return parts.length >= 2 
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  if (isLoading || !pharmacist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-4">
        <div className="max-w-2xl mx-auto space-y-4 pt-6">
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
          <div className="h-64 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const showContactInfo = hasActiveBooking || !pharmacist.phone_private;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-indigo-50 pb-32">
      {/* Back Button */}
      <div className="px-4 pt-6 pb-2">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Header Card */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5" />
          
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-full blur-sm opacity-30" />
                <Avatar.Root className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                  <Avatar.Fallback className="w-full h-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                    {getInitials(pharmacist.full_name)}
                  </Avatar.Fallback>
                </Avatar.Root>
                {pharmacist.verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center ring-4 ring-white">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {pharmacist.full_name}
                </h1>
                <p className="text-emerald-600 font-semibold mb-2">
                  Ontario Licensed Pharmacist
                </p>
                {pharmacist.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(pharmacist.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {pharmacist.rating.toFixed(1)} ({pharmacist.completed_shifts} shifts)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {showContactInfo ? pharmacist.email : "Hidden until booked"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                <p className="text-sm font-medium text-gray-900">
                  {showContactInfo ? (pharmacist.phone || "Not provided") : "Hidden until booked"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      {pharmacist.license_number && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Professional Details</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">License Number</p>
                <p className="text-sm font-medium text-gray-900">{pharmacist.license_number}</p>
              </div>

              {pharmacist.years_experience && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Experience</p>
                  <p className="text-sm font-medium text-gray-900">{pharmacist.years_experience} years</p>
                </div>
              )}

              {pharmacist.shift_preference && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Shift Preference</p>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {pharmacist.shift_preference.replace('_', ' → ')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bio */}
      {pharmacist.bio && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">About Me</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{pharmacist.bio}</p>
          </div>
        </div>
      )}

      {/* Software Experience */}
      {pharmacist.software_experience && pharmacist.software_experience.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Software Experience</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {pharmacist.software_experience.map((software) => (
                <Badge key={software} variant="secondary" className="bg-purple-100 text-purple-700">
                  {software}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preferred Regions */}
      {pharmacist.preferred_regions && pharmacist.preferred_regions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-bold text-gray-900">Preferred Work Regions</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {pharmacist.preferred_regions.map((region) => (
                <Badge key={region} variant="secondary" className="bg-rose-100 text-rose-700">
                  {region}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skills */}
      {pharmacist.pharmaceutical_skills && pharmacist.pharmaceutical_skills.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">Pharmaceutical Skills</h2>
            </div>
            <div className="space-y-2">
              {pharmacist.pharmaceutical_skills.map((skill) => (
                <div key={skill} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-900">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Availability */}
      {upcomingAvailability.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5" />
              <h2 className="text-lg font-bold">Upcoming Availability</h2>
            </div>

            <div className="space-y-2">
              {upcomingAvailability.map((slot, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4" />
                    <div>
                      <p className="font-semibold text-sm">
                        {format(new Date(slot.date), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs opacity-90">
                        {slot.start_time} - {slot.end_time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions */}
      {currentUser && currentUser.user_type === "employer" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-14 font-semibold"
              onClick={() => {/* Handle send inquiry */}}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Send Inquiry
            </Button>
            <Button
              className="h-14 font-semibold bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700"
              onClick={() => {/* Handle book shift */}}
            >
              <Send className="w-5 h-5 mr-2" />
              Book Shift
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}