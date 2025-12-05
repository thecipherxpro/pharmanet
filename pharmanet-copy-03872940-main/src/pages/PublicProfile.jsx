import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Award,
  Clock,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Star,
  Languages,
  Monitor,
  Shield,
  Car,
  CreditCard,
  Lock,
  Send,
  Plus,
  AlertCircle,
  Briefcase,
  User,
  FileCheck, // Added FileCheck
  Bus,        // Added Bus
  Bike,       // Added Bike
  X           // Added X icon
} from "lucide-react";
import { Authenticated } from "../components/auth/RouteProtection";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { formatTime12Hour, safeFormat, safeDate } from "../components/utils/timeUtils";
import LoadingScreen from "../components/shared/LoadingScreen";
import ErrorMessage from "../components/shared/ErrorMessage";

function PublicProfileContent() {
  const [searchParams] = useSearchParams();
  // Support both 'id' and 'employerId' for backward compatibility
  const pharmacistId = searchParams.get('id') || searchParams.get('employerId');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHireDrawer, setShowHireDrawer] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [invitationNote, setInvitationNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [employerHasRelationship, setEmployerHasRelationship] = useState(false);

  useEffect(() => {
    loadData();
  }, [pharmacistId]);

  const loadData = async () => {
    try {
      setError(null); // Clear any previous errors
      const loggedInUser = await base44.auth.me();
      setCurrentUser(loggedInUser);

      if (!pharmacistId) {
        navigate(-1);
        return;
      }

      try {
        const { data: targetUser } = await base44.functions.invoke('getPharmacistPublicProfile', {
          pharmacistId: pharmacistId
        });

        if (targetUser && targetUser.user_type === "pharmacist") {
          setProfileUser(targetUser);

          if (loggedInUser.user_type === "employer") {
            checkEmployerRelationship(targetUser.id);
            loadPaymentMethod(targetUser.id);
          }
        } else {
          setError("Profile not found.");
        }
      } catch (profileError) {
        console.error("Error loading pharmacist profile:", profileError);
        setError(profileError.message || "Failed to load pharmacist profile.");
      }
    } catch (currentUserError) {
      console.error("Error loading current user:", currentUserError);
      setError(currentUserError.message || "Failed to load user information.");
    }
    setLoading(false);
  };

  const checkEmployerRelationship = async (pharmacistUserId) => {
    try {
      const { data } = await base44.functions.invoke('verifyEmployerPharmacistRelationship', {
        pharmacistId: pharmacistUserId
      });
      setEmployerHasRelationship(data.hasRelationship || false);
    } catch (error) {
      console.error("Error checking relationship:", error);
      setEmployerHasRelationship(false);
    }
  };

  const loadPaymentMethod = async (pharmacistUserId) => {
    try {
      const { data } = await base44.functions.invoke('payrollGetPharmacistPreference', {
        pharmacistId: pharmacistUserId,
        shiftId: 'public-view'
      });
      setPaymentMethod(data);
    } catch (error) {
      console.error("Error loading payment method:", error);
      setPaymentMethod(null);
    }
  };

  const { data: availability = [], isLoading: availabilityLoading } = useQuery({
    queryKey: ['pharmacistAvailability', profileUser?.email],
    queryFn: async () => {
      if (!profileUser?.email) return [];
      const avail = await base44.entities.Availability.filter({
        pharmacist_email: profileUser.email
      }, '-date');
      return avail.slice(0, 10);
    },
    enabled: !!profileUser?.email,
  });

  const { data: employerShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['employerOpenShifts', currentUser?.email],
    queryFn: async () => {
      if (currentUser?.user_type !== 'employer') return [];
      const shifts = await base44.entities.Shift.filter({
        created_by: currentUser.email,
        status: 'open'
      }, '-shift_date');
      return shifts;
    },
    enabled: !!currentUser && currentUser.user_type === 'employer',
  });

  const { data: existingInvitations = [], isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery({
    queryKey: ['pharmacistExistingInvitations', profileUser?.id, currentUser?.id],
    queryFn: async () => {
      if (!profileUser?.id || !currentUser?.id) return [];
      
      const invitations = await base44.entities.ShiftInvitation.filter({
        employer_id: currentUser.id,
        pharmacist_id: profileUser.id,
        status: 'pending'
      });
      
      return invitations;
    },
    enabled: !!profileUser?.id && !!currentUser?.id,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['pharmacistReviews', profileUser?.id],
    queryFn: async () => {
      if (!profileUser?.id) return [];
      const reviewsList = await base44.entities.Review.filter({
        pharmacist_id: profileUser.id,
        is_visible: true
      }, '-created_date');
      return reviewsList;
    },
    enabled: !!profileUser?.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['pharmacistStats', profileUser?.id],
    queryFn: async () => {
      if (!profileUser?.id) return null;
      try {
        const { data } = await base44.functions.invoke('calculatePharmacistStats', {
          pharmacistId: profileUser.id
        });
        return data;
      } catch (error) {
        console.error('Error loading stats:', error);
        return null;
      }
    },
    enabled: !!profileUser?.id,
  });

  const hasExistingInvitation = (shiftId) => {
    return existingInvitations.some(inv => inv.shift_id === shiftId);
  };

  const isShiftUnavailable = (shift) => {
    if (!shift) return false;
    if (shift.status === 'filled' || shift.status === 'completed') return true;
    if (shift.assigned_to && shift.assigned_to !== '') return true;
    return false;
  };

  const handleHireClick = () => {
    setShowHireDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowHireDrawer(false);
    setSelectedShift(null);
    setInvitationNote("");
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await base44.entities.ShiftInvitation.update(invitationId, {
        status: 'withdrawn',
        responded_at: new Date().toISOString()
      });

      await refetchInvitations();

      toast({
        title: "✓ Invitation Cancelled",
        description: "The invitation has been withdrawn successfully.",
      });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
      });
    }
  };

  const handleSendInvitation = async () => {
    if (!selectedShift) {
      toast({
        title: "No Shift Selected",
        description: "Please select a shift before sending invitation.",
        variant: "destructive",
      });
      return;
    }

    if (isShiftUnavailable(selectedShift)) {
      toast({
        title: "Shift Unavailable",
        description: "This shift is already filled or assigned to another pharmacist.",
        variant: "destructive",
      });
      return;
    }

    if (hasExistingInvitation(selectedShift.id)) {
      toast({
        title: "Already Invited",
        description: "You've already sent an invitation for this shift to this pharmacist.",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);
    try {
      const invitation = await base44.entities.ShiftInvitation.create({
        shift_id: selectedShift.id,
        employer_id: currentUser.id,
        employer_name: currentUser.full_name || currentUser.company_name,
        employer_email: currentUser.email,
        pharmacist_id: profileUser.id,
        pharmacist_email: profileUser.email,
        pharmacist_name: profileUser.full_name,
        message: invitationNote || `You're invited to work this shift at ${selectedShift.pharmacy_name}`,
        status: 'pending',
        invited_at: new Date().toISOString()
      });

      // Send email notification
      try {
        await base44.functions.invoke('sendShiftInvitationEmail', {
          invitation_id: invitation.id
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue even if email fails
      }

      await refetchInvitations();

      toast({
        title: "✓ Invitation Sent",
        description: `${profileUser.full_name} has been invited to work this shift.`,
      });

      handleCloseDrawer();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation. Please try again.",
      });
    }
    setApplying(false);
  };

  const getPaymentMethodIcon = (method) => {
    if (!method) return CreditCard;
    if (method.includes('Direct Deposit')) return Building2;
    if (method.includes('E-Transfer')) return Mail;
    if (method.includes('Cheque')) return CreditCard;
    return DollarSign;
  };

  if (loading) {
    return <LoadingScreen type="profile" />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Profile Not Available"
        message={error}
        onGoBack={() => navigate(-1)}
        showGoBack={true}
      />
    );
  }

  const firstName = profileUser.full_name?.split(' ')[0] || 'Pharmacist';
  const hasAvailability = availability.length > 0;
  const PaymentIcon = getPaymentMethodIcon(paymentMethod?.method);
  
  const completedShifts = stats?.completedShifts || 0;
  const rating = stats?.rating || 0;
  const totalReviews = stats?.totalReviews || 0;
  const ratingPercentages = stats?.ratingPercentages || {};

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Simple Header */}
      <div className="bg-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
        </button>
        <h1 className="text-sm sm:text-base font-semibold text-gray-900">Pharmacist Profile</h1>
        <div className="w-8 sm:w-10" />
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Profile Header Card - Matching Design */}
        <Card className="border-0 shadow-sm overflow-hidden mb-3 sm:mb-4">
          <CardContent className="p-3 sm:p-5">
            {/* Profile Section */}
            <div className="flex items-start gap-3 mb-4 sm:mb-5">
              {/* Large Avatar */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl overflow-hidden flex-shrink-0 shadow-md">
                {profileUser.avatar_url ? (
                  <img 
                    src={profileUser.avatar_url} 
                    alt={profileUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileUser.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                )}
              </div>

              {/* Name & Credentials */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 leading-tight">
                  {profileUser.full_name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  {profileUser.license_number && `License #${profileUser.license_number} • `}
                  {profileUser.years_experience ? `${profileUser.years_experience} years experience` : 'Licensed Pharmacist'}
                </p>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge className="bg-orange-500 text-white border-0 text-[10px] sm:text-xs h-5 sm:h-auto px-2">
                    Licensed
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-700 border-0 text-[10px] sm:text-xs h-5 sm:h-auto px-2">
                    Pharmacist
                  </Badge>
                  {profileUser.is_verified && (
                    <Badge className="bg-teal-100 text-teal-700 border-0 text-[10px] sm:text-xs h-5 sm:h-auto px-2">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Available Card */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-gray-200">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">Available Today</p>
                {hasAvailability ? (
                  <>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1.5 sm:mb-2 leading-tight">
                      {formatTime12Hour(availability[0].start_time)} - {formatTime12Hour(availability[0].end_time)}
                    </p>
                    <Badge className="bg-teal-600 text-white text-[10px] sm:text-xs h-5 px-1.5 sm:px-2">
                      ALL TIMING
                    </Badge>
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500">Check availability</p>
                )}
              </div>

              {/* OCP License Card */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-gray-200">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1.5 sm:mb-2">OCP License</p>
                {profileUser.license_number ? (
                  <>
                    <p className="text-base sm:text-lg font-bold text-gray-900 mb-1 leading-tight">
                      #{profileUser.license_number}
                    </p>
                    <div className="flex items-center gap-1">
                      <FileCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-600" />
                      <p className="text-[10px] sm:text-xs text-teal-600 font-medium">
                        {profileUser.license_verified ? 'Verified' : 'Registered'}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500">Not provided</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hire Button - Employer Only */}
        {currentUser?.user_type === "employer" && (
          <div className="mb-3 sm:mb-4">
            <Button
              onClick={handleHireClick}
              className="w-full h-11 sm:h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-md text-sm sm:text-base"
              disabled={shiftsLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Invite to Shift
            </Button>
          </div>
        )}

        {/* Location Card (if city available) */}
        {profileUser.city && (
          <Card className="border-0 shadow-sm mb-3 sm:mb-4 overflow-hidden">
            <CardContent className="p-0">
              {/* Map Placeholder */}
              <div className="h-32 sm:h-40 bg-gradient-to-br from-teal-100 to-cyan-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600" />
                </div>
              </div>

              {/* Location Info */}
              <div className="p-3 sm:p-4 bg-white">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-0.5 text-sm sm:text-base">Service Location</p>
                    <p className="text-xs sm:text-sm text-gray-600">{profileUser.city}, {profileUser.province || 'ON'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm mb-3 sm:mb-4 h-auto">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs py-2 sm:py-2.5">Overview</TabsTrigger>
            <TabsTrigger value="reviews" className="text-[10px] sm:text-xs py-2 sm:py-2.5">
              Reviews
              {totalReviews > 0 && (
                <Badge className="ml-1 bg-teal-600 text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 min-w-[16px] sm:min-w-[18px] h-3.5 sm:h-4">
                  {totalReviews}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-[10px] sm:text-xs py-2 sm:py-2.5">Skills</TabsTrigger>
            <TabsTrigger value="availability" className="text-[10px] sm:text-xs py-2 sm:py-2.5">Schedule</TabsTrigger>
            <TabsTrigger value="contact" className="text-[10px] sm:text-xs py-2 sm:py-2.5">Contact</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-2.5 sm:space-y-3">
            {/* Stats */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{completedShifts}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Shifts</p>
                  </div>

                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{rating.toFixed(1)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Rating</p>
                  </div>

                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{profileUser.years_experience || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            {profileUser.bio && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    About
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {profileUser.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Preferred Regions */}
            {profileUser.preferred_regions && profileUser.preferred_regions.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    Service Areas
                  </h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {profileUser.preferred_regions.map((region, idx) => (
                      <Badge key={idx} variant="outline" className="border-gray-300 text-gray-700 text-[10px] sm:text-xs h-6 sm:h-auto px-2">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab - NEW */}
          <TabsContent value="reviews" className="space-y-2.5 sm:space-y-3">
            {/* Rating Summary */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-4 sm:gap-6">
                  {/* Overall Rating */}
                  <div className="text-center">
                    <p className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1.5 sm:mb-2">{rating.toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-0.5 mb-1.5 sm:mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            i < Math.floor(rating) 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">{totalReviews} reviews</p>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-xs font-medium text-gray-600 w-6 sm:w-8">{star} ★</span>
                        <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400"
                            style={{ width: `${ratingPercentages[star] || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-600 w-8 sm:w-10 text-right">
                          {ratingPercentages[star] || 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Ratings */}
                {stats?.detailedRatings && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Detailed Ratings</h4>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Professionalism</p>
                        <p className="text-lg sm:text-xl font-bold text-blue-900">{stats.detailedRatings.professionalism.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Punctuality</p>
                        <p className="text-lg sm:text-xl font-bold text-green-900">{stats.detailedRatings.punctuality.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Communication</p>
                        <p className="text-lg sm:text-xl font-bold text-purple-900">{stats.detailedRatings.communication.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Would Hire Again */}
                {stats?.wouldHireAgainPercentage > 0 && (
                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium text-teal-800">Would Hire Again</span>
                      <span className="text-lg sm:text-xl font-bold text-teal-600">{stats.wouldHireAgainPercentage}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Individual Reviews */}
            {reviewsLoading || statsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="h-16 sm:h-20 bg-gray-100 animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))
            ) : reviews.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 sm:p-8 text-center">
                  <Star className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-600">No reviews yet</p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{review.employer_name}</p>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-600 truncate">{review.pharmacy_name}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="flex items-center gap-0.5 mb-0.5 sm:mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                i < Math.floor(review.rating) 
                                  ? 'text-amber-400 fill-amber-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-600">
                          {safeFormat(review.created_date, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Review Text */}
                    {review.review_text && (
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-2 sm:mb-3">
                        "{review.review_text}"
                      </p>
                    )}

                    {/* Detailed Ratings */}
                    {(review.professionalism || review.punctuality || review.communication) && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        {review.professionalism && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2">
                            Professionalism: {review.professionalism}/5
                          </Badge>
                        )}
                        {review.punctuality && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2">
                            Punctuality: {review.punctuality}/5
                          </Badge>
                        )}
                        {review.communication && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2">
                            Communication: {review.communication}/5
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Would Hire Again Badge */}
                    {review.would_hire_again && (
                      <Badge className="bg-teal-100 text-teal-700 border-0 text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                        Would hire again
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-2.5 sm:space-y-3">
            {/* Pharmaceutical Skills */}
            {profileUser.pharmaceutical_skills && profileUser.pharmaceutical_skills.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Services</h3>
                    <span className="text-xs sm:text-sm text-teal-600 font-medium">SEE ALL</span>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    {profileUser.pharmaceutical_skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-teal-600 rounded-full" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Software Experience */}
            {profileUser.software_experience && profileUser.software_experience.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    Software
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {profileUser.software_experience.map((software, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-teal-600 rounded-full" />
                        <span>{software}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {profileUser.languages && profileUser.languages.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    Languages
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {profileUser.languages.map((lang, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-teal-600 rounded-full" />
                        <span>{lang}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Commute Mode (Modified) */}
            {profileUser.commute_mode && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    Transportation
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                    <div className="flex items-center gap-2">
                      {profileUser.commute_mode === 'car' ? (
                        <>
                          <Car className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                          <p className="text-xs sm:text-sm font-semibold text-blue-900">Owns a Car</p>
                        </>
                      ) : profileUser.commute_mode === 'transit' ? (
                        <>
                          <Bus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                          <p className="text-xs sm:text-sm font-semibold text-blue-900">Public Transit</p>
                        </>
                      ) : (
                        <>
                          <Bike className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                          <p className="text-xs sm:text-sm font-semibold text-blue-900">Other Transportation</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-2.5 sm:space-y-3">
            {hasAvailability ? (
              availability.slice(0, 5).map((avail, idx) => (
                <Card key={idx} className="border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                          {safeFormat(avail.date, 'EEEE, MMM d')}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                          <span>{formatTime12Hour(avail.start_time)} - {formatTime12Hour(avail.end_time)}</span>
                        </div>
                      </div>
                      <Badge className="bg-teal-100 text-teal-700 border-0 text-[10px] sm:text-xs h-5 sm:h-auto px-1.5 sm:px-2">
                        Available
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 sm:p-8 text-center">
                  <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-600">No availability scheduled</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-2.5 sm:space-y-3">
            {/* Payment Method - Employer Only */}
            {currentUser?.user_type === "employer" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    Payment Preference
                  </h3>

                  {paymentMethod && paymentMethod.method ? (
                    <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 border border-gray-200">
                      <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                          <PaymentIcon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">{paymentMethod.method}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">
                            {employerHasRelationship ? 'Full details available' : 'Details after hiring'}
                          </p>
                        </div>
                        {!employerHasRelationship && (
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-600">Not configured</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            {(!profileUser.phone_private || employerHasRelationship) && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    Contact Info
                  </h3>

                  <div className="space-y-2">
                    <a 
                      href={`mailto:${profileUser.email}`}
                      className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-teal-50 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                      <span className="text-xs sm:text-sm font-medium text-teal-900">{profileUser.email}</span>
                    </a>
                    
                    {profileUser.phone && (
                      <a
                        href={`tel:${profileUser.phone}`}
                        className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-teal-50 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                        <span className="text-xs sm:text-sm font-medium text-teal-900">{profileUser.phone}</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Hire Drawer */}
      <Sheet open={showHireDrawer} onOpenChange={setShowHireDrawer}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="text-left pb-4 border-b">
            <SheetTitle className="text-xl font-bold">
              Invite {firstName} to a Shift
            </SheetTitle>
            <SheetDescription>
              Select a shift and send an invitation
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6 overflow-y-auto h-[calc(85vh-180px)]">
            {employerShifts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No Open Shifts
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                  Create a shift first before inviting pharmacists.
                </p>
                <Button
                  onClick={() => {
                    handleCloseDrawer();
                    navigate(createPageUrl("PostShift"));
                  }}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Shift
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-bold text-gray-900 mb-3 block">
                    Select a Shift
                  </Label>
                  
                  {invitationsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employerShifts.map((shift) => {
                        const alreadyInvited = hasExistingInvitation(shift.id);
                        const shiftUnavailable = isShiftUnavailable(shift);
                        const isDisabled = alreadyInvited || shiftUnavailable;
                        const existingInvitation = existingInvitations.find(inv => inv.shift_id === shift.id);
                        
                        return (
                          <Card
                            key={shift.id}
                            className={`transition-all border-2 ${
                              isDisabled && !alreadyInvited // If disabled but not invited, make it visually disabled
                                ? 'border-gray-300 bg-gray-50 opacity-60' 
                                : selectedShift?.id === shift.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-orange-300'
                            } ${!isDisabled || alreadyInvited ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                            onClick={() => !isDisabled && setSelectedShift(shift)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 mb-1">
                                    {shift.pharmacy_name}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {shift.pharmacy_city}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge className="bg-emerald-500 text-white">
                                    ${shift.hourly_rate}/hr
                                  </Badge>
                                  {alreadyInvited && (
                                    <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                                      ✉️ Invited
                                    </Badge>
                                  )}
                                  {shiftUnavailable && !alreadyInvited && (
                                    <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
                                      ✓ Filled
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Calendar className="w-4 h-4 text-orange-600" />
                                  <span className="font-medium">
                                    {shift.schedule && shift.schedule.length > 0 
                                      ? safeFormat(shift.schedule[0].date, 'EEEE, MMM d, yyyy') 
                                      : safeFormat(shift.shift_date, 'EEEE, MMM d, yyyy')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Clock className="w-4 h-4 text-orange-600" />
                                  <span>
                                    {shift.schedule && shift.schedule.length > 0
                                      ? `${shift.schedule[0].start_time} - ${shift.schedule[0].end_time}`
                                      : (shift.start_time && shift.end_time ? `${shift.start_time} - ${shift.end_time}` : 'Time N/A')}
                                    {shift.total_hours ? ` (${shift.total_hours}h)` : ''}
                                  </span>
                                </div>
                              </div>

                              {selectedShift?.id === shift.id && !isDisabled && (
                                <div className="mt-3 pt-3 border-t border-orange-200">
                                  <div className="flex items-center gap-2 text-sm text-orange-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="font-medium">Selected</span>
                                  </div>
                                </div>
                              )}

                              {alreadyInvited && existingInvitation && (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 flex-1">
                                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                      <p className="text-xs text-gray-600">
                                        Invitation sent - waiting for response
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelInvitation(existingInvitation.id);
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {shiftUnavailable && !alreadyInvited && (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-gray-600">
                                      Shift no longer available
                                    </p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="invitation-note" className="text-sm font-bold text-gray-900 mb-3 block">
                    Personal Message (Optional)
                  </Label>
                  <Textarea
                    id="invitation-note"
                    placeholder="Add a personal message to your invitation..."
                    value={invitationNote}
                    onChange={(e) => setInvitationNote(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={!selectedShift || hasExistingInvitation(selectedShift?.id) || isShiftUnavailable(selectedShift)}
                  />
                </div>
              </>
            )}
          </div>

          {employerShifts.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseDrawer}
                  className="flex-1 h-12"
                  disabled={applying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvitation}
                  disabled={
                    !selectedShift || 
                    applying || 
                    hasExistingInvitation(selectedShift?.id) ||
                    isShiftUnavailable(selectedShift)
                  }
                  className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
                >
                  {applying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function PublicProfile() {
  return (
    <Authenticated>
      <PublicProfileContent />
    </Authenticated>
  );
}