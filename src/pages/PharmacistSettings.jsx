import React, { useState } from "react";
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
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bell,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import ProfileAvatar from "@/components/shared/ProfileAvatar";
import PharmacistPersonalInfoDrawer from "@/components/pharmacist/settings/PersonalInfoDrawer";
import PharmacistAddressDrawer from "@/components/pharmacist/settings/AddressDrawer";
import PharmacistPayrollDrawer from "@/components/pharmacist/settings/PayrollDrawer";
import PharmacistVerificationDrawer from "@/components/pharmacist/settings/VerificationDrawer";
import { PharmacistOnly } from "@/components/auth/RouteProtection";
import AboutCTACard from "@/components/shared/AboutCTACard";

function PharmacistSettingsContent() {
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['pharmacist-complete-profile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      
      // Use backend function to get data via service role
      let privateProfile = null;
      let payrollPref = null;
      let publicProfile = null;
      
      try {
        const response = await base44.functions.invoke('getPharmacistOwnProfile', {});
        privateProfile = response.data?.profile || null;
        payrollPref = response.data?.payroll || null;
        publicProfile = response.data?.public_profile || null;
      } catch (e) {
        console.log('Error loading profile data:', e);
      }
      
      return {
        user,
        private_profile: privateProfile,
        public_profile: publicProfile,
        payroll_preference: payrollPref
      };
    }
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleAvatarUpload = async (newAvatarUrl) => {
    await refetch();
    toast({ title: "Avatar updated successfully" });
  };

  const handlePrivacyToggle = async (field, value) => {
    try {
      await base44.functions.invoke('updatePharmacistProfile', {
        [field]: value
      });
      refetch();
      toast({ title: value ? "Information hidden" : "Information visible" });
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const { user, private_profile, public_profile, payroll_preference } = profileData || {};
  const address = private_profile?.personal_address?.[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Profile Summary */}
            <div className="col-span-4">
              <Card className="sticky top-24">
                <CardContent className="p-6 text-center">
                  <ProfileAvatar 
                    user={user} 
                    size="xl" 
                    editable={true}
                    onUploadSuccess={handleAvatarUpload}
                  />
                  <h2 className="text-xl font-bold text-gray-900 mt-4">
                    {user?.display_name || user?.full_name || 'Pharmacist'}
                  </h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">Pharmacist</Badge>
                    {public_profile?.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Settings Sections */}
            <div className="col-span-8 space-y-4">
              {/* Account Settings */}
              <Card>
                <CardContent className="p-0 divide-y">
                  <button onClick={() => setPersonalInfoOpen(true)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Personal Information</p>
                        <p className="text-sm text-gray-500">{private_profile?.full_name || user?.full_name || 'Not set'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button onClick={() => setAddressOpen(true)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Residential Address</p>
                        <p className="text-sm text-gray-500">{address ? `${address.city}, ${address.province}` : 'Not set'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button onClick={() => setPayrollOpen(true)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Payroll Settings</p>
                        <p className="text-sm text-gray-500">{payroll_preference?.method || 'Not configured'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {payroll_preference ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Set up</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">Required</Badge>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                  <button onClick={() => setVerificationOpen(true)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Verification</p>
                        <p className="text-sm text-gray-500">{public_profile?.is_verified ? 'Verified' : 'Not verified'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </CardContent>
              </Card>

              {/* Privacy Settings */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Privacy Settings</p>
                    <p className="text-sm text-gray-500">Control your visibility</p>
                  </div>
                </div>
                <div className="space-y-4 ml-13">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Hide email until booked</p>
                      <p className="text-xs text-gray-500">Employers can't see your email</p>
                    </div>
                    <Switch 
                      checked={public_profile?.email_private || false}
                      onCheckedChange={(checked) => handlePrivacyToggle('email_private', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Hide phone until booked</p>
                      <p className="text-xs text-gray-500">Employers can't see your phone</p>
                    </div>
                    <Switch 
                      checked={public_profile?.phone_private || false}
                      onCheckedChange={(checked) => handlePrivacyToggle('phone_private', checked)}
                    />
                  </div>
                </div>
              </Card>

              {/* About & Support */}
              <AboutCTACard />

              {/* Logout */}
              <Card>
                <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors text-red-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="font-medium">Log Out</p>
                  </div>
                </button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
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
                {user?.display_name || user?.full_name || 'Pharmacist'}
              </h2>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">Pharmacist</Badge>
                {public_profile?.is_verified ? (
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
                  {private_profile?.full_name || user?.full_name || 'Not set'} • {private_profile?.date_of_birth || 'No DOB'}
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

        {/* Payroll Settings */}
        <Card className="divide-y">
          <button 
            onClick={() => setPayrollOpen(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Payroll Settings</p>
                <p className="text-sm text-gray-500">
                  {payroll_preference?.method || 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {payroll_preference ? (
                <Badge className="bg-green-100 text-green-700 text-xs">Set up</Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">Required</Badge>
              )}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
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
                <p className="text-sm font-medium text-gray-900">Hide email until booked</p>
                <p className="text-xs text-gray-500">Employers can't see your email</p>
              </div>
              <Switch 
                checked={public_profile?.email_private || false}
                onCheckedChange={(checked) => handlePrivacyToggle('email_private', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Hide phone until booked</p>
                <p className="text-xs text-gray-500">Employers can't see your phone</p>
              </div>
              <Switch 
                checked={public_profile?.phone_private || false}
                onCheckedChange={(checked) => handlePrivacyToggle('phone_private', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Profile visibility</p>
                <p className="text-xs text-gray-500">
                  {public_profile?.profile_visibility === 'public' ? 'Visible to everyone' :
                   public_profile?.profile_visibility === 'hidden' ? 'Hidden from search' :
                   'Visible to employers only'}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {public_profile?.profile_visibility || 'employers_only'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* System Preferences */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">System Preferences</p>
              <p className="text-sm text-gray-500">Notifications and alerts</p>
            </div>
          </div>
          <div className="space-y-4 pl-13">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email notifications</p>
                <p className="text-xs text-gray-500">Receive shift updates via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Push notifications</p>
                <p className="text-xs text-gray-500">Browser and mobile alerts</p>
              </div>
              <Switch defaultChecked />
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
                  {public_profile?.is_verified 
                    ? 'Your account is verified'
                    : private_profile?.verification_status === 'pending'
                      ? 'Verification pending review'
                      : 'Verify your license'}
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
      </div>

      {/* Drawers */}
      <PharmacistPersonalInfoDrawer 
        open={personalInfoOpen}
        onClose={() => setPersonalInfoOpen(false)}
        profile={private_profile}
        user={user}
        onSave={() => {
          refetch();
          setPersonalInfoOpen(false);
        }}
      />
      
      <PharmacistAddressDrawer 
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        address={address}
        onSave={() => {
          refetch();
          setAddressOpen(false);
        }}
      />
      
      <PharmacistPayrollDrawer 
        open={payrollOpen}
        onClose={() => setPayrollOpen(false)}
        payrollPreference={payroll_preference}
        userId={user?.id}
        onSave={() => {
          refetch();
          setPayrollOpen(false);
        }}
      />

      <PharmacistVerificationDrawer
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        profile={private_profile}
        publicProfile={public_profile}
      />
    </div>
  );
}

export default function PharmacistSettings() {
  return (
    <PharmacistOnly>
      <PharmacistSettingsContent />
    </PharmacistOnly>
  );
}