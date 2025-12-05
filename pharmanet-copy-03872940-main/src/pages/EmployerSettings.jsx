import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  MapPin, 
  Languages, 
  Shield, 
  Eye, 
  LogOut, 
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import ProfileAvatar from "@/components/shared/ProfileAvatar";
import PersonalInfoDrawer from "@/components/employer/settings/PersonalInfoDrawer";
import AddressDrawer from "@/components/employer/settings/AddressDrawer";
import LanguagesDrawer from "@/components/employer/settings/LanguagesDrawer";
import BecomeVerifiedDrawer from "@/components/employer/BecomeVerifiedDrawer";
import { EmployerOnly } from "@/components/auth/RouteProtection";
import AboutCTACard from "@/components/shared/AboutCTACard";

function EmployerSettingsContent() {
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['employer-complete-profile'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getEmployerCompleteProfile');
      return response.data;
    }
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleAvatarUpload = async (newAvatarUrl) => {
    await refetch();
    toast({ title: "Avatar updated successfully" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const { user, employer_profile, public_profile } = profileData?.data || {};
  const address = employer_profile?.personal_address?.[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        
        {/* Header */}
        <div className="pt-2 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account and preferences</p>
        </div>

        {/* Profile Summary Card */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <ProfileAvatar 
              user={user} 
              size="lg" 
              editable={true}
              onUploadSuccess={handleAvatarUpload}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {user?.display_name || user?.full_name || 'Employer'}
              </h2>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">Employer</Badge>
                {user?.account_verified ? (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="divide-y">
          <button 
            onClick={() => setPersonalInfoOpen(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Personal Information</p>
                <p className="text-sm text-gray-500">
                  {employer_profile?.full_name || 'Not set'} • {employer_profile?.date_of_birth || 'No DOB'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </Card>

        {/* Residential Address */}
        <Card className="divide-y">
          <button 
            onClick={() => setAddressOpen(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Residential Address</p>
                <p className="text-sm text-gray-500">
                  {address ? `${address.city}, ${address.province}` : 'Not set'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </Card>

        {/* Languages */}
        <Card className="divide-y">
          <button 
            onClick={() => setLanguagesOpen(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Languages className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Languages</p>
                <p className="text-sm text-gray-500">
                  {employer_profile?.languages_spoken?.length > 0 
                    ? employer_profile.languages_spoken.join(', ')
                    : 'Not set'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Privacy Settings</p>
              <p className="text-sm text-gray-500">Control your visibility</p>
            </div>
          </div>
          <div className="space-y-4 pl-13">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Show email publicly</p>
                <p className="text-xs text-gray-500">Pharmacists can see your email</p>
              </div>
              <Switch 
                checked={public_profile?.contact_email_public || false}
                onCheckedChange={async (checked) => {
                  await base44.functions.invoke('updatePublicEmployerProfile', {
                    contact_email_public: checked
                  });
                  refetch();
                  toast({ title: checked ? "Email visible to pharmacists" : "Email hidden" });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Show phone publicly</p>
                <p className="text-xs text-gray-500">Pharmacists can see your phone</p>
              </div>
              <Switch 
                checked={public_profile?.contact_phone_public || false}
                onCheckedChange={async (checked) => {
                  await base44.functions.invoke('updatePublicEmployerProfile', {
                    contact_phone_public: checked
                  });
                  refetch();
                  toast({ title: checked ? "Phone visible to pharmacists" : "Phone hidden" });
                }}
              />
            </div>
          </div>
        </Card>

        {/* Verification */}
        <Card className="divide-y">
          <button 
            onClick={() => setVerificationOpen(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Verification</p>
                <p className="text-sm text-gray-500">
                  {user?.account_verified 
                    ? 'Your account is verified'
                    : user?.verification_submitted
                      ? 'Verification pending review'
                      : 'Verify your business'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </Card>

        {/* About & Support */}
        <AboutCTACard />

        {/* Account Management */}
        <Card className="divide-y">
          <button 
            onClick={handleLogout}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors text-red-600"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <p className="font-medium">Log Out</p>
            </div>
          </button>
        </Card>

      </div>

      {/* Drawers */}
      <PersonalInfoDrawer 
        open={personalInfoOpen}
        onClose={() => setPersonalInfoOpen(false)}
        profile={employer_profile}
        onSave={() => {
          refetch();
          setPersonalInfoOpen(false);
        }}
      />
      
      <AddressDrawer 
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        address={address}
        onSave={() => {
          refetch();
          setAddressOpen(false);
        }}
      />
      
      <LanguagesDrawer 
        open={languagesOpen}
        onClose={() => setLanguagesOpen(false)}
        languages={employer_profile?.languages_spoken || []}
        onSave={() => {
          refetch();
          setLanguagesOpen(false);
        }}
      />

      <BecomeVerifiedDrawer
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </div>
  );
}

export default function EmployerSettings() {
  return (
    <EmployerOnly>
      <EmployerSettingsContent />
    </EmployerOnly>
  );
}