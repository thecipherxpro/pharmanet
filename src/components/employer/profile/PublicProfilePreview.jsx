import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProfileAvatar from "@/components/shared/ProfileAvatar";
import { 
  Star, 
  Calendar, 
  Users, 
  TrendingUp, 
  Building2,
  MapPin,
  Monitor,
  Briefcase,
  Globe,
  Mail,
  Phone,
  CheckCircle
} from "lucide-react";

export default function PublicProfilePreview({ user, profile, formData, pharmaciesCount }) {
  // Merge saved profile with current form data for live preview
  const displayData = {
    ...profile,
    ...formData
  };

  const formatShiftType = (type) => {
    const labels = {
      temporary: "Temporary",
      permanent: "Permanent", 
      shift_relief: "Shift Relief",
      urgent: "Urgent"
    };
    return labels[type] || type;
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
        <div className="flex items-start gap-4">
          <ProfileAvatar user={user} size="lg" editable={false} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">
                {user?.display_name || user?.full_name || 'Employer'}
              </h2>
              {profile?.is_verified && (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-gray-300 text-sm mt-1">Employer</p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{pharmaciesCount || 0} {pharmaciesCount === 1 ? 'pharmacy' : 'pharmacies'}</span>
              </div>
              {profile?.total_shifts_posted > 0 && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{profile.total_shifts_posted} shifts</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-b">
        <div className="p-4 text-center border-r">
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold">{profile?.rating?.toFixed(1) || '0.0'}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Rating</p>
        </div>
        <div className="p-4 text-center border-r">
          <div className="flex items-center justify-center gap-1 text-blue-600">
            <Users className="w-4 h-4" />
            <span className="font-bold">{profile?.total_hires || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Hires</p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold">{profile?.response_rate || 0}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Response</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Bio */}
        {displayData.bio && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">About</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{displayData.bio}</p>
          </div>
        )}

        {/* Workplace Culture */}
        {displayData.workplace_culture && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Workplace Culture</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{displayData.workplace_culture}</p>
          </div>
        )}

        {/* Software */}
        {displayData.software_used?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-900">Software</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {displayData.software_used.map((sw) => (
                <Badge key={sw} variant="outline" className="text-xs">
                  {sw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Shift Types */}
        {displayData.preferred_shift_types?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-900">Shift Types</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {displayData.preferred_shift_types.map((type) => (
                <Badge key={type} className="bg-blue-100 text-blue-700 text-xs">
                  {formatShiftType(type)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Website */}
        {displayData.website && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-gray-500" />
            <a 
              href={displayData.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate"
            >
              {displayData.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}

        {/* Contact Info */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-500" />
            {displayData.contact_email_public ? (
              <span className="text-gray-700">{user?.email}</span>
            ) : (
              <span className="text-gray-400 italic">Hidden until booking</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-500" />
            {displayData.contact_phone_public ? (
              <span className="text-gray-700">{profile?.phone || 'Not set'}</span>
            ) : (
              <span className="text-gray-400 italic">Hidden until booking</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}