
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  User,
  MapPin,
  Phone,
  Award,
  Mail,
  Edit3,
  CheckCircle2,
  Briefcase,
  Monitor,
  Car,
  Bus,
  Calendar,
  Shield,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Wallet,
  CreditCard,
  ArrowRight,
  Languages,
  Save,
  X,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Authenticated } from "../components/auth/RouteProtection";
import { useQuery } from '@tanstack/react-query';
import CertificationUpload from "../components/profile/CertificationUpload";
import ProfileSkeleton from "../components/shared/skeletons/ProfileSkeleton";

const softwareOptions = [
  "Kroll",
  "Paperless Kroll",
  "Fillware",
  "PharmaClik",
  "Nexxsys",
  "Commander",
  "Assyst",
  "PrimeRx",
  "McKesson",
  "Other"
];

const gtaRegions = [
  "Toronto",
  "North York",
  "Scarborough",
  "Mississauga",
  "Vaughan",
  "Brampton",
  "Richmond Hill",
  "Markham",
  "Etobicoke",
  "Thornhill",
  "Ajax/Pickering",
  "Oshawa/Whitby"
];

const pharmaceuticalSkills = [
  "Methadone / Suboxone dispensing",
  "Vaccines and injections",
  "Inventory management",
  "Compounding experience",
  "Controlled substance handling"
];

const commonLanguages = [
  "English",
  "French",
  "Mandarin",
  "Cantonese",
  "Punjabi",
  "Hindi",
  "Urdu",
  "Tamil",
  "Arabic",
  "Spanish",
  "Tagalog",
  "Korean",
  "Persian",
  "Russian",
  "Portuguese",
  "Italian",
  "German",
  "Vietnamese",
  "Other"
];

function ProfileContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true); // New state for current user loading
  const [profileLoading, setProfileLoading] = useState(true); // New state for profile user loading
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [licenseError, setLicenseError] = useState("");

  const isPublicView = !!id;
  const isOwnProfile = !isPublicView || (user && profileUser && user.id === profileUser.id);

  const { data: payrollPreference } = useQuery({
    queryKey: ['payrollPreference', user?.id],
    queryFn: async () => {
      if (!user || isPublicView || !isOwnProfile) return null;
      const prefs = await base44.entities.PayrollPreference.filter({ user_id: user?.id });
      return prefs[0] || null;
    },
    enabled: !!user && !isPublicView && isOwnProfile,
  });

  const { data: walletCards } = useQuery({
    queryKey: ['walletCards', user?.id],
    queryFn: async () => {
      if (!user || isPublicView || !isOwnProfile) return [];
      const cards = await base44.entities.WalletCard.filter({ user_id: user?.id });
      return cards;
    },
    enabled: !!user && !isPublicView && isOwnProfile,
  });

  const { data: certifications = [], isLoading: certsLoading } = useQuery({
    queryKey: ['certifications', isOwnProfile ? user?.id : profileUser?.id],
    queryFn: async () => {
      const targetUserId = isOwnProfile ? user?.id : profileUser?.id;
      if (!targetUserId) return [];
      const certs = await base44.entities.Certification.filter({ user_id: targetUserId });
      return certs;
    },
    enabled: !!user && (isOwnProfile ? !!user?.id : !!profileUser?.id),
  });

  useEffect(() => {
    loadData();

    if (!isPublicView) {
      const handleAvatarUpdate = (event) => {
        if (event.detail?.avatar_url) {
          setUser(prevUser => ({
            ...prevUser,
            avatar_url: event.detail.avatar_url
          }));
          setProfileUser(prevUser => ({
            ...prevUser,
            avatar_url: event.detail.avatar_url
          }));
          setFormData(prevData => ({
            ...prevData,
            avatar_url: event.detail.avatar_url
          }));
        }
      };

      window.addEventListener('avatarUpdated', handleAvatarUpdate);

      return () => {
        window.removeEventListener('avatarUpdated', handleAvatarUpdate);
      };
    }
  }, [id, isPublicView]);

  const loadData = async () => {
    setUserLoading(true); // Start loading for current user
    setProfileLoading(true); // Start loading for profile user
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setUserLoading(false); // Current user loaded

      if (isPublicView) {
        try {
          const { data: targetUser } = await base44.functions.invoke('getPharmacistPublicProfile', {
            pharmacistId: id
          });
          
          if (targetUser) {
            setProfileUser(targetUser);
            setFormData(targetUser);
            setOriginalData(targetUser);
          } else {
            toast({
              title: "User not found",
              description: "The requested profile could not be found.",
              variant: "destructive",
            });
            setProfileUser(null);
            setFormData({});
          }
        } catch (error) {
          console.error("Error loading public profile:", error);
          toast({
            title: "Error",
            description: "Failed to load profile",
            variant: "destructive",
          });
          setProfileUser(null);
          setFormData({});
        } finally {
          setProfileLoading(false); // Public profile loading finished
        }
      } else {
        // If not public view, profileUser is currentUser
        setProfileUser(currentUser);
        setFormData(currentUser);
        setOriginalData(currentUser);
        setProfileLoading(false); // Profile user loading finished
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
      // Ensure all loading states are false on error
      setUserLoading(false);
      setProfileLoading(false);
    }
  };

  // Auto-sync public profile for pharmacists
  const syncPublicProfile = async () => {
    if (!user || user.user_type !== 'pharmacist' || isPublicView) return;
    
    setSyncing(true);
    try {
      await base44.functions.invoke('syncPublicPharmacistProfile', {});
      console.log('Public profile synced successfully');
    } catch (error) {
      console.error('Failed to sync public profile:', error);
      // Don't show error to user - this is a background operation
    } finally {
      setSyncing(false);
    }
  };

  const validateLicenseNumber = (value) => {
    if (!value) {
      setLicenseError("License number is required");
      return false;
    }
    
    // Remove any non-digit characters and check length
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length !== 6) {
      setLicenseError("License number must be exactly 6 digits");
      return false;
    }
    
    setLicenseError("");
    return true;
  };

  const handleLicenseChange = (value) => {
    // Only allow digits
    const cleanValue = value.replace(/\D/g, '');
    
    // Limit to 6 digits
    const limitedValue = cleanValue.slice(0, 6);
    
    setFormData({ ...formData, license_number: limitedValue });
    
    if (limitedValue) {
      validateLicenseNumber(limitedValue);
    } else {
      setLicenseError(""); // Clear error if input is empty
    }
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;

    // Validate license number before saving
    if (formData.license_number && !validateLicenseNumber(formData.license_number)) {
      toast({
        variant: "destructive",
        title: "Invalid License Number",
        description: "Please enter a valid 6-digit license number",
      });
      return;
    }

    setSaving(true);
    try {
      // Save to User entity
      await base44.auth.updateMe(formData);
      setOriginalData(formData);
      setIsEditMode(false);

      toast({
        variant: "success",
        title: "✓ Saved",
        description: "Profile updated successfully",
      });

      // Auto-sync to PublicPharmacistProfile if user is a pharmacist
      if (user.user_type === 'pharmacist') {
        // Sync in background (non-blocking)
        syncPublicProfile();
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditMode(false);
    setLicenseError("");
  };

  const handleMultiSelect = (field, value) => {
    if (!isEditMode) return;
    
    const current = formData[field] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];

    setFormData({ ...formData, [field]: updated });
  };

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const shouldHideContact = isPublicView && formData.phone_private;

  const hasPaymentMethod = walletCards && walletCards.length > 0;
  const hasPayrollSetup = !!payrollPreference;
  const walletComplete = hasPaymentMethod && hasPayrollSetup;

  if (profileLoading || userLoading) {
    return <ProfileSkeleton />;
  }

  if (isPublicView && !profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-6 text-center shadow-lg border-emerald-200/50 max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Profile Not Found</h2>
          <p className="text-sm text-gray-600 mb-4">The profile you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/')} size="sm">Go to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="px-3 py-3 space-y-3 max-w-2xl mx-auto mb-24">

        {/* Sync Indicator - Only for pharmacists editing own profile */}
        {!isPublicView && user?.user_type === 'pharmacist' && syncing && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing public profile...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Header Card */}
        <Card className="border-emerald-200/50 shadow-md overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-16 h-16 rounded-xl ring-2 ring-emerald-500/20 bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(formData.full_name)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                  {formData.full_name || "Pharmacist"}
                </h1>
                <div className="flex items-center gap-1.5 mb-2">
                  <Award className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-emerald-700">Ontario Licensed</span>
                </div>
                {formData.is_verified && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs h-5">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {isOwnProfile && !isPublicView && !isEditMode && (
                <Button
                  onClick={() => setIsEditMode(true)}
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 h-8 px-3 text-xs"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {formData.rating > 0 && (
              <div className="flex items-center gap-2 pt-3 border-t">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-base ${
                        i < Math.floor(formData.rating)
                          ? "text-amber-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-600">
                  {formData.rating.toFixed(1)} • {formData.completed_shifts || 0} shifts
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Status - Only for own profile */}
        {isOwnProfile && !isPublicView && (
          <Card
            className="border-2 border-blue-200 shadow-md cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => navigate(createPageUrl("PharmacistWallet"))}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Wallet & Payroll</h2>
                    <p className="text-xs text-gray-600">Payment setup</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2.5 rounded-lg border ${
                  hasPaymentMethod
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard className={`w-3.5 h-3.5 ${
                      hasPaymentMethod ? 'text-green-600' : 'text-amber-600'
                    }`} />
                    <p className="text-xs font-semibold text-gray-700">Payment Card</p>
                  </div>
                  {hasPaymentMethod ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <p className="text-xs text-green-700 font-medium">
                        {walletCards.length} card{walletCards.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <p className="text-xs text-amber-700 font-medium">Not set</p>
                    </div>
                  )}
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  hasPayrollSetup
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className={`w-3.5 h-3.5 ${
                      hasPayrollSetup ? 'text-green-600' : 'text-amber-600'
                    }`} />
                    <p className="text-xs font-semibold text-gray-700">Payroll</p>
                  </div>
                  {hasPayrollSetup ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <p className="text-xs text-green-700 font-medium truncate">
                        {payrollPreference.method}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <p className="text-xs text-amber-700 font-medium">Not set</p>
                    </div>
                  )}
                </div>
              </div>

              {!walletComplete && (
                <div className="mt-2.5 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 text-center">
                    💡 Complete setup to receive payments
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Certifications & Licenses</h2>
            </div>

            <CertificationUpload 
              certifications={certifications}
              userId={profileUser?.id}
              isOwnProfile={isOwnProfile}
            />
          </CardContent>
        </Card>

        {/* Languages */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Languages className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Languages Spoken</h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {commonLanguages.map((language) => {
                const isSelected = (formData.languages || []).includes(language);
                return (
                  <button
                    key={language}
                    onClick={() => isEditMode && handleMultiSelect('languages', language)}
                    disabled={!isEditMode}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-sm"
                        : isEditMode
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-700 cursor-default"
                    } ${!isEditMode && 'opacity-90'}`}
                  >
                    {language}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">Personal Information</h2>
              </div>
              {isOwnProfile && isEditMode && (
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="phone-private" className="text-xs text-gray-600 cursor-pointer">
                    Hide
                  </Label>
                  <Switch
                    id="phone-private"
                    checked={formData.phone_private || false}
                    onCheckedChange={(checked) => setFormData({...formData, phone_private: checked})}
                    className="data-[state=checked]:bg-emerald-600 scale-75"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {shouldHideContact ? "Hidden" : formData.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Phone</p>
                  {isEditMode ? (
                    <Input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1 h-8 bg-white border-gray-200 text-xs"
                    />
                  ) : (
                    <p className="text-xs font-medium text-gray-900">
                      {shouldHideContact ? "Hidden" : formData.phone || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Professional Information</h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  License Number * <span className="text-gray-500 font-normal">(6 digits)</span>
                </Label>
                {isEditMode ? (
                  <div>
                    <Input
                      value={formData.license_number || ""}
                      onChange={(e) => handleLicenseChange(e.target.value)}
                      placeholder="123456"
                      className={`bg-white border-gray-200 h-9 text-sm ${
                        licenseError ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                      maxLength={6}
                      required
                    />
                    {licenseError && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                        <p className="text-xs text-red-600">{licenseError}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your 6-digit Ontario pharmacist license number
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-mono text-gray-900 p-2.5 bg-gray-50 rounded-lg">
                    {formData.license_number || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Years of Experience</Label>
                {isEditMode ? (
                  <Input
                    type="number"
                    value={formData.years_experience || ""}
                    onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) })}
                    placeholder="5"
                    className="bg-white border-gray-200 h-9 text-sm"
                    min="0"
                    max="50"
                  />
                ) : (
                  <p className="text-sm text-gray-900 p-2.5 bg-gray-50 rounded-lg">
                    {formData.years_experience ? `${formData.years_experience} years` : "Not specified"}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-2 block">
                  Shift Preference
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: "temporary", label: "Temporary", description: "Short-term" },
                    { value: "permanent", label: "Permanent", description: "Long-term" },
                    { value: "shift_relief", label: "Shift Relief", description: "Relief" },
                    { value: "urgent", label: "Urgent", description: "Immediate" }
                  ].map((option) => {
                    const isSelected = formData.shift_preference === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (isEditMode) {
                            setFormData({ ...formData, shift_preference: option.value });
                          }
                        }}
                        disabled={!isEditMode}
                        className={`p-2.5 rounded-lg text-left transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-md"
                            : isEditMode
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-gray-100 text-gray-700 cursor-default opacity-90"
                        }`}
                      >
                        <p className="font-semibold text-xs mb-0.5">{option.label}</p>
                        <p className={`text-[10px] ${
                          isSelected ? "text-white/80" : "text-gray-500"
                        }`}>
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Professional Bio</Label>
                {isEditMode ? (
                  <Textarea
                    value={formData.bio || ""}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell employers about your experience..."
                    className="bg-white border-gray-200 min-h-[80px] text-sm"
                    rows={3}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {formData.bio || "No bio added yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Software Experience */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Software Experience</h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {softwareOptions.map((software) => {
                const isSelected = (formData.software_experience || []).includes(software);
                return (
                  <button
                    key={software}
                    onClick={() => isEditMode && handleMultiSelect('software_experience', software)}
                    disabled={!isEditMode}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-sm"
                        : isEditMode
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-700 cursor-default opacity-90"
                    }`}
                  >
                    {software}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Preferred Regions */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Preferred Work Regions (GTA)</h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {gtaRegions.map((region) => {
                const isSelected = (formData.preferred_regions || []).includes(region);
                return (
                  <button
                    key={region}
                    onClick={() => isEditMode && handleMultiSelect('preferred_regions', region)}
                    disabled={!isEditMode}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-sm"
                        : isEditMode
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-700 cursor-default opacity-90"
                    }`}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Commute Mode */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Commute Mode</h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "car", label: "Car", icon: Car },
                { value: "transit", label: "Transit", icon: Bus },
                { value: "other", label: "Other", icon: MapPin }
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = formData.commute_mode === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (isEditMode) {
                        setFormData({ ...formData, commute_mode: option.value });
                      }
                    }}
                    disabled={!isEditMode}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-emerald-500 to-indigo-600 text-white shadow-md"
                        : isEditMode
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-700 cursor-default opacity-90"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pharmaceutical Skills */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">Pharmaceutical Skills</h2>
            </div>

            <div className="space-y-1.5">
              {pharmaceuticalSkills.map((skill) => {
                const isSelected = (formData.pharmaceutical_skills || []).includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => isEditMode && handleMultiSelect('pharmaceutical_skills', skill)}
                    disabled={!isEditMode}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-sm"
                        : isEditMode
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-700 cursor-default opacity-90"
                    }`}
                  >
                    {skill}
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Availability Summary */}
        <Card className="border-emerald-200/50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">Availability</h2>
              </div>
              {isOwnProfile && !isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 h-7 px-2.5 text-xs"
                  onClick={() => navigate(createPageUrl("MySchedule"))}
                >
                  Edit
                </Button>
              )}
            </div>

            <div className="text-center py-6">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-3">
                No availability set yet
              </p>
              {isOwnProfile && !isEditMode && (
                <Button
                  onClick={() => navigate(createPageUrl("MySchedule"))}
                  className="bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 h-9 text-xs"
                  size="sm"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Add Availability
                </Button>
              )}
              <p className="text-[10px] text-gray-400 mt-2">
                Limited to 30 days ahead
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Sticky Bottom Save Bar - Only in Edit Mode - FIXED Z-INDEX */}
      {isEditMode && isOwnProfile && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 safe-bottom">
          <div className="max-w-2xl mx-auto px-3 py-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !!licenseError}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Public View Sticky Buttons */}
      {isPublicView && !isOwnProfile && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-2xl z-40">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-emerald-200 text-emerald-700 h-11 text-sm"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Send Inquiry
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 h-11 text-sm">
              <Calendar className="w-4 h-4 mr-1.5" />
              Book Shift
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <Authenticated>
      <ProfileContent />
    </Authenticated>
  );
}
