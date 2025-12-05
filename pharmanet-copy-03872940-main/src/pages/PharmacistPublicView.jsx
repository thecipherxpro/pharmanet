import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  Award,
  Mail,
  Phone,
  CheckCircle2,
  Briefcase,
  Monitor,
  Car,
  Bus,
  Shield,
  Clock,
  DollarSign,
  ArrowLeft,
  Lock,
  Star,
  Building2,
  Banknote,
  Languages,
  Calendar,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Authenticated } from "../components/auth/RouteProtection";
import { useQuery } from '@tanstack/react-query';
import ProfileAvatar from "../components/shared/ProfileAvatar";
import { safeDate } from "../components/utils/timeUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const softwareOptions = [
  "Kroll", "Paperless Kroll", "Fillware", "PharmaClik", "Nexxsys",
  "Commander", "Assyst", "PrimeRx", "McKesson", "Other"
];

const gtaRegions = [
  "Toronto", "North York", "Scarborough", "Mississauga", "Vaughan",
  "Brampton", "Richmond Hill", "Markham", "Etobicoke", "Thornhill",
  "Ajax/Pickering", "Oshawa/Whitby"
];

const pharmaceuticalSkills = [
  "Methadone / Suboxone dispensing",
  "Vaccines and injections",
  "Inventory management",
  "Compounding experience",
  "Controlled substance handling"
];

const commonLanguages = [
  "English", "French", "Mandarin", "Cantonese", "Punjabi",
  "Hindi", "Urdu", "Tamil", "Arabic", "Spanish",
  "Tagalog", "Korean", "Persian", "Russian", "Portuguese",
  "Italian", "German", "Vietnamese", "Other"
];

function PharmacistPublicViewContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHireModal, setShowHireModal] = useState(false);
  const [payrollMethod, setPayrollMethod] = useState(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [employerHasRelationship, setEmployerHasRelationship] = useState(false);

  const { data: certifications = [] } = useQuery({
    queryKey: ['certifications', profileUser?.id],
    queryFn: async () => {
      if (!profileUser?.id) return [];
      const certs = await base44.entities.Certification.filter({ user_id: profileUser.id });
      return certs;
    },
    enabled: !!profileUser?.id,
  });

  const { data: myShifts = [] } = useQuery({
    queryKey: ['employerOpenShifts', currentUser?.email],
    queryFn: () => base44.entities.Shift.filter({ 
      created_by: currentUser?.email,
      status: 'open'
    }),
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const loggedInUser = await base44.auth.me();
      setCurrentUser(loggedInUser);

      if (!id) {
        navigate(-1);
        return;
      }

      const { data: targetUser } = await base44.functions.invoke('getPharmacistPublicProfile', {
        pharmacistId: id
      });

      if (targetUser && targetUser.user_type === "pharmacist") {
        setProfileUser(targetUser);
        
        if (loggedInUser.user_type === "employer") {
          loadPayrollMethod(targetUser.id);
          checkEmployerRelationship(targetUser.id);
        }
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      navigate(-1);
    }
    setLoading(false);
  };

  const checkEmployerRelationship = async (pharmacistId) => {
    try {
      const { data } = await base44.functions.invoke('verifyEmployerPharmacistRelationship', {
        pharmacistId: pharmacistId
      });
      setEmployerHasRelationship(data.hasRelationship || false);
    } catch (error) {
      console.error("Error checking relationship:", error);
    }
  };

  const loadPayrollMethod = async (pharmacistId) => {
    setLoadingPayroll(true);
    try {
      const { data } = await base44.functions.invoke('payrollGetPharmacistPreference', {
        pharmacistId: pharmacistId,
        shiftId: 'public-view'
      });
      setPayrollMethod(data);
    } catch (error) {
      console.error("Error loading payroll method:", error);
    }
    setLoadingPayroll(false);
  };

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const getMethodIcon = (method) => {
    switch(method) {
      case "Direct Deposit": return Building2;
      case "Bank E-Transfer": return Mail;
      case "Cheque": return Banknote;
      default: return DollarSign;
    }
  };

  const shouldHideContactFromEmployer = 
    profileUser?.phone_private && 
    currentUser?.user_type === "employer" && 
    !employerHasRelationship;

  const shouldHideContactFromPharmacist = 
    profileUser?.phone_private && 
    currentUser?.user_type === "pharmacist";

  const shouldHideContact = shouldHideContactFromEmployer || shouldHideContactFromPharmacist;

  const handleHireClick = () => {
    if (myShifts.length === 0) {
      toast({
        variant: "destructive",
        title: "No Open Shifts",
        description: "Please post a shift first before hiring a pharmacist.",
      });
      return;
    }
    setShowHireModal(true);
  };

  const handleShiftSelection = (shiftId) => {
    navigate(createPageUrl("MyShifts"));
    toast({
      title: "Redirect to Shift",
      description: "You can send a shift invitation from the shift details page.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-32 bg-white/50 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white/50 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-6 text-center shadow-lg border-emerald-200/50 max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Profile Not Found</h2>
          <p className="text-sm text-gray-600 mb-4">The profile does not exist or is not available.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const firstName = profileUser.full_name?.split(' ')[0] || 'Pharmacist';

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-gray-900">Pharmacist Profile</h1>
              <p className="text-xs text-gray-600">View professional details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 space-y-3 max-w-2xl mx-auto py-4 mb-24">
        
        {/* Header Card */}
        <Card className="border-emerald-200/50 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <ProfileAvatar 
                  user={profileUser} 
                  size="xl"
                  editable={false}
                />

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {profileUser.full_name || "Pharmacist"}
                  </h1>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">
                      Ontario Licensed Pharmacist
                    </span>
                  </div>
                  {profileUser.is_verified && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* License Number Badge */}
            {profileUser.license_number && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Ontario Pharmacist License</p>
                    <p className="text-sm font-mono font-bold text-blue-900">#{profileUser.license_number}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Years of Experience */}
            {profileUser.years_experience && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <p className="text-sm text-gray-900">
                    <span className="font-bold">{profileUser.years_experience}</span> years of experience
                  </p>
                </div>
              </div>
            )}

            {profileUser.rating > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < Math.floor(profileUser.rating) ? "text-amber-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {profileUser.rating.toFixed(1)} • {profileUser.completed_shifts || 0} shifts completed
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bio Section */}
        {profileUser.bio && (
          <Card className="border-emerald-200/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Professional Bio</h2>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {profileUser.bio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payment Preferences - For Employers */}
        {currentUser?.user_type === "employer" && (
          <Card className="border-purple-200/50 shadow-lg overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
              </div>

              {loadingPayroll ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : payrollMethod ? (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {React.createElement(getMethodIcon(payrollMethod.method), {
                        className: "w-6 h-6 text-purple-600"
                      })}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Preferred Payment Method</p>
                      <p className="font-bold text-gray-900 text-lg">{payrollMethod.method}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-800">
                        {employerHasRelationship 
                          ? "Full banking details are visible on your filled shift details page."
                          : "Full banking details will be visible after you accept this pharmacist for a shift."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Payment method not configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        <Card className="border-emerald-200/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Certifications & Licenses</h2>
            </div>

            {certifications.length === 0 ? (
              <div className="text-center py-6">
                <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No certifications added</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{cert.certification_name}</h4>
                      <Badge variant="outline" className={
                        cert.status === 'verified' ? 'bg-green-100 text-green-700 border-green-300' :
                        cert.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                        'bg-gray-100 text-gray-700 border-gray-300'
                      }>
                        {cert.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{cert.certification_type}</p>
                    <p className="text-xs text-gray-500 mt-1">{cert.issuing_organization}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        {profileUser.languages && profileUser.languages.length > 0 && (
          <Card className="border-emerald-200/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Languages className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Languages Spoken</h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {profileUser.languages.map((language) => (
                  <Badge
                    key={language}
                    className="bg-gradient-to-r from-emerald-500 to-indigo-600 text-white border-none shadow-md"
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Professional Information */}
        <Card className="border-emerald-200/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Professional Information</h2>
            </div>

            <div className="space-y-4">
              {/* Shift Preference */}
              {profileUser.shift_preference && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Shift Preference</p>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                    {profileUser.shift_preference}
                  </Badge>
                </div>
              )}

              {/* Software Experience */}
              {profileUser.software_experience && profileUser.software_experience.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Software Experience</p>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.software_experience.map((software) => (
                      <Badge key={software} variant="outline" className="bg-gray-50">
                        <Monitor className="w-3 h-3 mr-1" />
                        {software}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Regions */}
              {profileUser.preferred_regions && profileUser.preferred_regions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Preferred Work Regions (GTA)</p>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.preferred_regions.map((region) => (
                      <Badge key={region} variant="outline" className="bg-gray-50">
                        <MapPin className="w-3 h-3 mr-1" />
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Commute Mode */}
              {profileUser.commute_mode && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Commute Mode</p>
                  <Badge variant="outline" className="bg-gray-50">
                    {profileUser.commute_mode === 'car' && <Car className="w-3 h-3 mr-1" />}
                    {profileUser.commute_mode === 'transit' && <Bus className="w-3 h-3 mr-1" />}
                    {profileUser.commute_mode}
                  </Badge>
                </div>
              )}

              {/* Pharmaceutical Skills */}
              {profileUser.pharmaceutical_skills && profileUser.pharmaceutical_skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Pharmaceutical Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.pharmaceutical_skills.map((skill) => (
                      <Badge key={skill} className="bg-emerald-100 text-emerald-700 border-emerald-300">
                        <Shield className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-emerald-200/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
            </div>

            {shouldHideContact && (
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Contact details will be revealed after you hire this pharmacist
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {shouldHideContact ? (
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700">Hidden</span>
                      </span>
                    ) : profileUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {shouldHideContact ? (
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700">Hidden</span>
                      </span>
                    ) : (profileUser.phone || "Not provided")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card className="border-emerald-200/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Availability</h2>
            </div>

            <div className="text-center py-6">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Availability information</p>
              <p className="text-xs text-gray-500">
                View availability details after initiating hire process
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Sticky Hire Button - Overrides Navigation */}
      {currentUser?.user_type === "employer" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl z-50">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleHireClick}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-lg font-bold shadow-lg"
            >
              HIRE {firstName.toUpperCase()}
            </Button>
          </div>
        </div>
      )}

      {/* Hire Modal - Shift Selection */}
      <Dialog open={showHireModal} onOpenChange={setShowHireModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Shift for {firstName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {myShifts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">You don't have any open shifts</p>
                <Button onClick={() => navigate(createPageUrl("PostShift"))}>
                  Post a Shift
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Select which shift you'd like to invite {firstName} to apply for:
                </p>
                {myShifts.map((shift) => (
                  <Card
                    key={shift.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleShiftSelection(shift.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{shift.pharmacy_name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {shift.schedule && shift.schedule.length > 0 
                              ? safeDate(shift.schedule[0].date)
                              : safeDate(shift.shift_date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {shift.schedule && shift.schedule.length > 0 
                              ? `${shift.schedule[0].start_time} - ${shift.schedule[0].end_time}` 
                              : (shift.start_time && shift.end_time ? `${shift.start_time} - ${shift.end_time}` : 'Time N/A')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${shift.hourly_rate}/hr</p>
                          <Badge variant="outline" className="mt-1">
                            {shift.total_hours}h
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHireModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PharmacistPublicView() {
  return (
    <Authenticated>
      <PharmacistPublicViewContent />
    </Authenticated>
  );
}