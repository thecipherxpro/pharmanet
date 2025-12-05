import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatTime12Hour } from "../components/utils/timeUtils";
import { getScheduleFromShift } from "../components/utils/shiftUtils";
import WelcomeProfileCard from "../components/shared/WelcomeProfileCard";
import {
  Calendar,
  Users,
  Plus,
  AlertCircle,
  CheckCircle2,
  Building2,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Bell,
  TrendingUp,
  Edit3,
  Clock,
  X,
  Shield,
  CheckCircle,
  Wallet,
  CreditCard,
  UserSearch,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  User,
  Mail
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { EmployerOnly } from "../components/auth/RouteProtection";
import EmployerOnboardingGate from "../components/onboarding/EmployerOnboardingGate";
import { Input } from "@/components/ui/input";
import OnboardingTooltip from "../components/shared/OnboardingTooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ErrorMessage from "../components/shared/ErrorMessage";
import DashboardSkeleton from "../components/shared/skeletons/DashboardSkeleton";
import { filterShiftsByStatus } from "../components/utils/shiftUtils";

function EmployerDashboardContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedVerification, setDismissedVerification] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showPostShiftTooltip, setShowPostShiftTooltip] = useState(false);

  useEffect(() => {
    loadUser();

    const dismissed = sessionStorage.getItem('dismissedEmployerVerification');
    setDismissedVerification(dismissed === 'true');

    const handleAvatarUpdate = (event) => {
      if (event.detail?.avatar_url) {
        setUser((prevUser) => ({
          ...prevUser,
          avatar_url: event.detail.avatar_url
        }));
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const handleAvatarUpload = async (newAvatarUrl) => {
    setUser((prevUser) => ({ ...prevUser, avatar_url: newAvatarUrl }));

    window.dispatchEvent(new CustomEvent('avatarUpdated', {
      detail: { avatar_url: newAvatarUrl }
    }));
  };

  const { data: shifts = [], isLoading: shiftsLoading, error: shiftsError, refetch: refetchShifts } = useQuery({
    queryKey: ['employerShifts', user?.id],
    queryFn: () => base44.entities.Shift.filter({ employer_id: user?.id }, "-created_date"),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
    retry: 2
  });

  const { data: allApplications, isLoading: appsLoading, error: appsError } = useQuery({
    queryKey: ['employerApplications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const [myShifts, allApps] = await Promise.all([
        base44.entities.Shift.filter({ created_by: user.email }, "-created_date", 100),
        base44.entities.ShiftApplication.filter({}, "-applied_date", 200)
      ]);
      const shiftIds = new Set(myShifts.map((s) => s.id));
      return allApps.filter((app) => shiftIds.has(app.shift_id));
    },
    enabled: !!user,
    initialData: [],
    retry: 2,
    staleTime: 30000,
  });

  const { data: pharmacies = [], isLoading: pharmaciesLoading } = useQuery({
    queryKey: ['myPharmacies', user?.email],
    queryFn: () => base44.entities.Pharmacy.filter({ created_by: user?.email }),
    enabled: !!user,
    staleTime: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: profileCompletion, isLoading: completionLoading, error: completionError } = useQuery({
    queryKey: ['employerProfileCompletion', user?.id],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('checkEmployerProfileCompletion');
        return response.data;
      } catch (error) {
        console.error('Profile completion check failed:', error);
        // Return default safe state on error
        return {
          completionPercentage: 0,
          allComplete: false,
          checklist: {},
          hasAvatar: false,
          hasPhone: false,
          hasBio: false
        };
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    retry: 1
  });

  const { data: verificationStatus, isLoading: verificationLoading, error: verificationError } = useQuery({
    queryKey: ['employerAccountVerification', user?.id],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('checkEmployerAccountVerification');
        return response.data;
      } catch (error) {
        console.error('Verification check failed:', error);
        // Return default safe state on error
        return {
          completionPercentage: 0,
          allComplete: false,
          checklist: {}
        };
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    retry: 1
  });

  const { data: allPharmacists = [] } = useQuery({
    queryKey: ['activePharmacists'],
    queryFn: () => base44.entities.PublicPharmacistProfile.filter({ is_active: true }, "-created_date", 50),
    staleTime: 120000,
    enabled: !!user
  });

  // Fetch sent invitations
  const { data: sentInvitations = [] } = useQuery({
    queryKey: ['sentInvitations', user?.email],
    queryFn: () => base44.entities.ShiftInvitation.filter({
      employer_email: user?.email
    }, '-invited_at', 50),
    enabled: !!user,
    staleTime: 30000,
  });

  // Use centralized filtering logic
  const openShifts = filterShiftsByStatus(shifts, 'open');
  const filledShifts = filterShiftsByStatus(shifts, 'filled');
  const pendingApps = allApplications.filter((a) => a.status === "pending");
  const pendingInvitations = sentInvitations.filter((inv) => inv.status === "pending");

  const urgentShifts = openShifts.filter((s) => {
    const schedule = getScheduleFromShift(s);
    const primaryDate = schedule[0];
    if (!primaryDate?.date) return false;
    
    // Parse date safely
    const [year, month, day] = primaryDate.date.split('-').map(Number);
    if (!year || !month || !day) return false;
    
    const shiftDate = new Date(year, month - 1, day);
    const now = new Date();
    const daysDiff = Math.ceil((shiftDate - now) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 3;
  });

  const handleDismissVerification = () => {
    setDismissedVerification(true);
    sessionStorage.setItem('dismissedEmployerVerification', 'true');
  };

  const showProfileCard = !completionLoading &&
                             profileCompletion &&
                             !profileCompletion.allComplete;

  const showVerificationCard = !verificationLoading &&
                               verificationStatus &&
                               !verificationStatus.allComplete &&
                               !dismissedVerification &&
                               profileCompletion?.allComplete; // Only show if profile is complete

  // Carousel scroll handlers
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll);
      // Removed checkEl, assuming it was a typo for checkScroll or not defined elsewhere
      return () => scrollEl.removeEventListener('scroll', checkScroll);
    }
  }, [shifts]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (shiftsError || appsError) {
    return (
      <ErrorMessage
        title="Failed to Load Dashboard"
        message="We couldn't load your dashboard data. Please check your connection and try again."
        onRetry={() => {
          refetchShifts();
          window.location.reload();
        }}
        onGoHome={() => navigate(createPageUrl("EmployerDashboard"))}
        showRetry={true}
        showGoHome={false}
      />
    );
  }

  // Replaced LoadingScreen with DashboardSkeleton for initial loading states
  if (shiftsLoading || appsLoading || completionLoading || pharmaciesLoading) {
    return <DashboardSkeleton />;
  }

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  // Show tooltip if no shifts and profile complete
  const shouldShowTooltip = shifts.length === 0 && 
                            profileCompletion?.allComplete && 
                            verificationStatus?.allComplete;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <style>{`
        .carousel-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
        }
        .carousel-container::-webkit-scrollbar {
          display: none;
        }
        .carousel-item {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
        
        /* Ripple effect */
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .card-ripple {
          position: relative;
          overflow: hidden;
        }
        
        .card-ripple::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100px;
          height: 100px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
        }
        
        .card-ripple:active::after {
          animation: ripple 0.6s ease-out;
        }

        /* Glass morphism */
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        /* Pulse animation for urgent */
        @keyframes pulse-ring {
          0% {
            transform: scale(0.95);
            opacity: 1;
          }
          50% {
            transform: scale(1);
            opacity: 0.7;
          }
          100% {
            transform: scale(0.95);
            opacity: 1;
          }
        }
        
        .pulse-urgent {
          animation: pulse-ring 2s ease-in-out infinite;
        }
      `}</style>

      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Desktop Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.full_name?.split(' ')[0] || 'there'}!</h1>
              <p className="text-gray-500 text-sm mt-1">Here's what's happening with your shifts today.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search shifts, pharmacists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-72 h-10 pl-10 pr-4 bg-white border-gray-200 rounded-lg text-sm"
                />
              </div>
              <Link to={createPageUrl("PostShift")}>
                <button className="h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  Post Shift
                </button>
              </Link>
            </div>
          </div>

          {/* Desktop Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Link to={createPageUrl("MyShifts")} className="block">
              <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{openShifts.length}</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">Open Shifts</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </Link>
            <Link to={createPageUrl("ManageApplications")} className="block">
              <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{pendingApps.length}</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">Pending Applications</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            </Link>
            <Link to={createPageUrl("MyShifts")} className="block">
              <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{filledShifts.length}</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">Filled Shifts</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </div>
            </Link>
            <Link to={createPageUrl("Pharmacies")} className="block">
              <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{pharmacies.length}</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">Pharmacies</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-600" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Main Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Alerts & Actions */}
            <div className="space-y-4">
              {/* Profile Completion */}
              {showProfileCard && (
                <div className="bg-white border border-blue-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">Complete Your Profile</h3>
                        <p className="text-xs text-gray-600">{profileCompletion.completionPercentage}% complete</p>
                      </div>
                    </div>
                    <Progress value={profileCompletion.completionPercentage} className="h-1.5 mt-3 bg-blue-100" />
                  </div>
                  <div className="p-3 space-y-2">
                    {Object.entries(profileCompletion.checklist).slice(0, 3).map(([key, item]) => (
                      <button
                        key={key}
                        onClick={() => navigate(createPageUrl(item.route))}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5 ${
                          item.complete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${item.complete ? 'bg-green-500' : 'bg-gray-100'}`}>
                          {item.complete ? <CheckCircle className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-gray-500" />}
                        </div>
                        <span className="text-sm font-medium text-gray-900 flex-1">{item.title}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Card */}
              {showVerificationCard && (
                <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">Account Setup</h3>
                          <p className="text-xs text-gray-600">{verificationStatus.completionPercentage}% complete</p>
                        </div>
                      </div>
                      <button onClick={handleDismissVerification} className="p-1.5 hover:bg-amber-100 rounded-lg">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <Progress value={verificationStatus.completionPercentage} className="h-1.5 mt-3 bg-amber-100" />
                  </div>
                  <div className="p-3 space-y-2">
                    {['profile', 'wallet', 'pharmacy'].map((key) => {
                      const item = verificationStatus.checklist[key];
                      return (
                        <button
                          key={key}
                          onClick={() => navigate(createPageUrl(item.route))}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5 ${
                            item.complete ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${item.complete ? 'bg-teal-500' : 'bg-gray-100'}`}>
                            {item.complete ? <CheckCircle className="w-4 h-4 text-white" /> : 
                              key === 'wallet' ? <CreditCard className="w-4 h-4 text-gray-500" /> :
                              key === 'pharmacy' ? <Building2 className="w-4 h-4 text-gray-500" /> :
                              <Edit3 className="w-4 h-4 text-gray-500" />
                            }
                          </div>
                          <span className="text-sm font-medium text-gray-900 flex-1">{item.title}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Urgent Alerts */}
              {urgentShifts.length > 0 && (
                <Link to={createPageUrl("MyShifts")}>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{urgentShifts.length} Urgent Shift{urgentShifts.length !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-600">Need coverage in next 3 days</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Applications Alert */}
              {pendingApps.length > 0 && (
                <Link to={createPageUrl("ManageApplications")}>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{pendingApps.length} New Application{pendingApps.length !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-600">Review and respond</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Find Pharmacists CTA */}
              <Link to={createPageUrl("FindPharmacists")}>
                <div className="relative h-40 rounded-xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-700"></div>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800')] bg-cover bg-center opacity-20"></div>
                  <div className="relative h-full p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <UserSearch className="w-5 h-5 text-white" />
                        <h3 className="text-lg font-bold text-white">Find Pharmacists</h3>
                      </div>
                      <p className="text-white/80 text-xs">{allPharmacists.length}+ verified professionals</p>
                    </div>
                    <div className="flex justify-end">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Middle Column - Recent Shifts */}
            <div className="col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Recent Shifts</h2>
                  <Link to={createPageUrl("MyShifts")} className="text-sm text-teal-600 font-medium hover:text-teal-700">
                    View All →
                  </Link>
                </div>
                
                {shifts.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">No shifts yet</p>
                    <p className="text-sm text-gray-500 mb-4">Post your first shift to get started</p>
                    <Link to={createPageUrl("PostShift")}>
                      <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm inline-flex items-center gap-2 transition-colors">
                        <Plus size={16} />
                        Post First Shift
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {shifts.slice(0, 6).map((shift) => {
                      const schedule = getScheduleFromShift(shift);
                      const primaryDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };
                      
                      let formattedDate = 'Date not set';
                      let isUrgent = false;
                      
                      if (primaryDate.date && /^\d{4}-\d{2}-\d{2}$/.test(primaryDate.date)) {
                        try {
                          const [year, month, day] = primaryDate.date.split('-').map(Number);
                          const shiftDate = new Date(year, month - 1, day);
                          if (!isNaN(shiftDate.getTime())) {
                            const daysUntil = differenceInDays(shiftDate, new Date());
                            isUrgent = daysUntil >= 0 && daysUntil <= 3;
                            formattedDate = format(shiftDate, "EEE, MMM d");
                          }
                        } catch {}
                      }

                      return (
                        <Link key={shift.id} to={createPageUrl("MyShifts")} className="block hover:bg-gray-50 transition-colors">
                          <div className="px-5 py-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex flex-col items-center justify-center">
                              <Calendar className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-semibold text-gray-900 text-sm">{formattedDate}</p>
                                {isUrgent && (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">Urgent</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">{shift.pharmacy_name}</p>
                              <p className="text-xs text-gray-400">{formatTime12Hour(primaryDate.start_time)} - {formatTime12Hour(primaryDate.end_time)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-teal-600">${shift.hourly_rate}/hr</p>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${
                                shift.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                shift.status === 'filled' ? 'bg-teal-100 text-teal-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Link to={createPageUrl("EmployerInvitations")}>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-purple-200 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900">{pendingInvitations.length}</p>
                        <p className="text-xs text-gray-500">Pending Invites</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link to={createPageUrl("AnalyticsReports")}>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-teal-200 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Analytics</p>
                        <p className="text-xs text-gray-500">View Reports</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link to={createPageUrl("EmployerProfile")}>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Edit3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Profile</p>
                        <p className="text-xs text-gray-500">Edit Details</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">

      {/* Welcome Card */}
      <div className="px-3 pt-4 pb-3">
        <WelcomeProfileCard
          user={user}
          greeting={greeting}
          onAvatarUpload={handleAvatarUpload}
          stats={[
            {
              icon: <Calendar className="w-5 h-5" />,
              value: openShifts.length,
              label: "Open Shifts"
            },
            {
              icon: <Users className="w-5 h-5" />,
              value: pendingApps.length,
              label: "Applications"
            },
            {
              icon: <Building2 className="w-5 h-5" />,
              value: pharmacies.length,
              label: "Pharmacies"
            }
          ]}
          actions={[
            {
              label: "Edit Profile",
              icon: <Edit3 className="w-4 h-4" />,
              onClick: () => navigate(createPageUrl("EmployerProfile")),
              variant: "outline"
            },
            {
              label: "Post Shift",
              icon: <Plus className="w-4 h-4" />,
              onClick: () => navigate(createPageUrl("PostShift")),
              variant: "default",
              id: "post-shift-btn"
            }
          ]}
          tooltips={shouldShowTooltip && (
            <OnboardingTooltip
              id="first_shift_post"
              title="Post Your First Shift"
              message="Start by posting a shift to find qualified pharmacists. It takes less than 2 minutes!"
              position="bottom"
              actions={[
                {
                  label: "Post Shift",
                  onClick: () => navigate(createPageUrl("PostShift"))
                }
              ]}
            />
          )}
        />
      </div>

      {/* Profile Completion Card */}
      {showProfileCard && (
        <div className="px-3 mb-3">
          <Card className="border-2 border-blue-200 shadow-md overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm mb-1">Complete Your Profile</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Finish setup to start posting shifts
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">
                      {profileCompletion.completionPercentage}% Complete
                    </span>
                    <span className="text-gray-600">
                      {Object.values(profileCompletion.checklist).filter(c => c.complete).length} of 4
                    </span>
                  </div>
                  <Progress
                    value={profileCompletion.completionPercentage}
                    className="h-2 bg-white"
                  />
                </div>
              </div>

              <div className="p-3 space-y-2">
                {Object.entries(profileCompletion.checklist).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => navigate(createPageUrl(item.route))}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${
                      item.complete
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.complete ? 'bg-green-500' : 'bg-blue-100'
                      }`}>
                        {item.complete ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <User className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {item.title}
                          </h4>
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Verification - Only show if profile complete */}
      {showVerificationCard && (
        <div className="px-3 mb-3">
          <Card className="border-2 border-amber-200 shadow-md overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm mb-1">Complete Your Account</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Finish setting up to start posting shifts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismissVerification}
                    className="w-8 h-8 rounded-lg hover:bg-amber-100 active:bg-amber-200 flex items-center justify-center transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">
                      {verificationStatus.completionPercentage}% Complete
                    </span>
                    <span className="text-gray-600">
                      {[verificationStatus.profileComplete, verificationStatus.hasCard, verificationStatus.hasPharmacy].filter(Boolean).length} of 3
                    </span>
                  </div>
                  <Progress
                    value={verificationStatus.completionPercentage}
                    className="h-2 bg-white"
                  />
                </div>
              </div>

              <div className="p-3 space-y-2">
                {/* Profile */}
                <button
                  onClick={() => navigate(createPageUrl(verificationStatus.checklist.profile.route))}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${
                    verificationStatus.checklist.profile.complete
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-white border-gray-200 hover:border-teal-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      verificationStatus.checklist.profile.complete ? 'bg-teal-500' : 'bg-blue-100'
                    }`}>
                      {verificationStatus.checklist.profile.complete ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Edit3 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {verificationStatus.checklist.profile.title}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-600">
                        {verificationStatus.checklist.profile.description}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Wallet */}
                <button
                  onClick={() => navigate(createPageUrl(verificationStatus.checklist.wallet.route))}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${
                    verificationStatus.checklist.wallet.complete
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-white border-gray-200 hover:border-teal-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      verificationStatus.checklist.wallet.complete ? 'bg-teal-500' : 'bg-blue-100'
                    }`}>
                      {verificationStatus.checklist.wallet.complete ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {verificationStatus.checklist.wallet.title}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-600">
                        {verificationStatus.checklist.wallet.description}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Pharmacy */}
                <button
                  onClick={() => navigate(createPageUrl(verificationStatus.checklist.pharmacy.route))}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${
                    verificationStatus.checklist.pharmacy.complete
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-white border-gray-200 hover:border-teal-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      verificationStatus.checklist.pharmacy.complete ? 'bg-teal-500' : 'bg-blue-100'
                    }`}>
                      {verificationStatus.checklist.pharmacy.complete ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {verificationStatus.checklist.pharmacy.title}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-600">
                        {verificationStatus.checklist.pharmacy.description}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search shifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-9 pr-3 bg-white border-gray-200 rounded-xl text-sm shadow-sm"
            />
          </div>
          <button className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center active:scale-95 transition-all duration-200 shadow-sm">
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Urgent Alert */}
      {urgentShifts.length > 0 && (
        <div className="px-3 mb-3">
          <Link to={createPageUrl("MyShifts")}>
            <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 active:scale-[0.97] transition-all duration-200 shadow-sm card-ripple pulse-urgent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm mb-0.5 leading-tight">
                    {urgentShifts.length} Urgent Shift{urgentShifts.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-600 leading-tight">
                    Need coverage in next 3 days
                  </p>
                </div>
                <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* New Applications Alert */}
      {pendingApps.length > 0 && (
        <div className="px-3 mb-3">
          <Link to={createPageUrl("ManageApplications")}>
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 active:scale-[0.97] transition-all duration-200 shadow-sm card-ripple">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm mb-0.5 leading-tight">
                    {pendingApps.length} New Application{pendingApps.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-600 leading-tight">
                    Review and respond to applicants
                  </p>
                </div>
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Sent Invitations Alert */}
      {pendingInvitations.length > 0 && (
        <div className="px-3 mb-3">
          <Link to={createPageUrl("EmployerInvitations")}>
            <div className="bg-white border-2 border-purple-200 rounded-2xl p-4 active:scale-[0.97] transition-all duration-200 shadow-sm card-ripple">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm mb-0.5 leading-tight">
                    {pendingInvitations.length} Pending Invitation{pendingInvitations.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-600 leading-tight">
                    Awaiting pharmacist response
                  </p>
                </div>
                <div className="w-9 h-9 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Quick Actions - Professional Cards */}
      <div className="px-3 mb-4">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl("Pharmacies")}>
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gray-200 active:scale-[0.98] transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold text-gray-900">{pharmacies.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Pharmacies</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Manage Locations</span>
                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("MyShifts")}>
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gray-200 active:scale-[0.98] transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold text-gray-900">{openShifts.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Open Shifts</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700">View All Shifts</span>
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("ManageApplications")}>
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gray-200 active:scale-[0.98] transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold text-gray-900">{pendingApps.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Applications</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700">Review Now</span>
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("AnalyticsReports")}>
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gray-200 active:scale-[0.98] transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500 font-medium">View Reports</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-700">Insights & Data</span>
                <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-teal-600" />
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("EmployerInvitations")} className="col-span-2">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{pendingInvitations.length} Pending Invitations</p>
                    <p className="text-sm text-white/80">Track pharmacist responses</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Shifts - Carousel */}
      <div className="mb-4">
        <div className="px-3 mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Recent Shifts</h2>
          <div className="flex items-center gap-2">
            {shifts.length > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    canScrollLeft
                      ? 'bg-white border border-gray-200 text-gray-700 active:scale-95 shadow-sm'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    canScrollRight
                      ? 'bg-white border border-gray-200 text-gray-700 active:scale-95 shadow-sm'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            {shifts.length > 3 && (
              <Link to={createPageUrl("MyShifts")} className="text-xs text-teal-600 font-medium">
                See All
              </Link>
            )}
          </div>
        </div>

        {shifts.length === 0 ? (
          <div className="mx-3 bg-white rounded-2xl p-6 text-center border border-gray-200 shadow-sm">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
              <Calendar className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-bold text-gray-900 mb-1 text-sm">No shifts yet</p>
            <p className="text-xs text-gray-600 mb-3">
              Start by posting your first shift
            </p>
            <Link to={createPageUrl("PostShift")}>
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold active:scale-95 transition-all duration-200 inline-flex items-center gap-2 text-sm shadow-md">
                <Plus size={16} />
                Post First Shift
              </button>
            </Link>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollRef}
              className="carousel-container flex gap-2.5 overflow-x-auto px-3 pb-2"
            >
              {shifts.slice(0, 5).map((shift) => {
                const schedule = getScheduleFromShift(shift);
                const primaryDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };
                
                // Safe date parsing
                let shiftDate = null;
                let daysUntil = 999;
                let isUrgent = false;
                let formattedDate = 'Date not set';
                
                if (primaryDate.date && typeof primaryDate.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(primaryDate.date)) {
                  try {
                    const [year, month, day] = primaryDate.date.split('-').map(Number);
                    if (year && month && day && !isNaN(year) && !isNaN(month) && !isNaN(day)) {
                      shiftDate = new Date(year, month - 1, day);
                      if (!isNaN(shiftDate.getTime())) {
                        daysUntil = differenceInDays(shiftDate, new Date());
                        isUrgent = daysUntil >= 0 && daysUntil <= 3;
                        formattedDate = format(shiftDate, "MMM d, yyyy");
                      }
                    }
                  } catch {
                    formattedDate = 'Date not set';
                  }
                }

                return (
                  <Link key={shift.id} to={createPageUrl("MyShifts")} className="carousel-item">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm active:scale-[0.97] transition-all duration-200 min-w-[280px] w-[280px] card-ripple">
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900 text-sm">
                              {formattedDate}
                            </p>
                            {isUrgent && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {shift.pharmacy_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime12Hour(primaryDate.start_time)} - {formatTime12Hour(primaryDate.end_time)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-teal-600 text-base">${shift.hourly_rate}/hr</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                            shift.status === 'open' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            shift.status === 'filled' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {shift.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Scroll Indicator */}
            {shifts.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {shifts.slice(0, Math.min(5, shifts.length)).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full bg-gray-300 transition-all"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Find Pharmacists CTA - Simple Image Background Card */}
      <div className="px-3 pb-6">
        <Link to={createPageUrl("FindPharmacists")}>
          <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-indigo-700/90"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
            
            {/* Content */}
            <div className="relative h-full p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserSearch className="w-6 h-6 text-white" />
                  <h3 className="text-2xl font-bold text-white">Find Pharmacists</h3>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  Browse {allPharmacists.length}+ verified professionals ready to cover your shifts
                </p>
              </div>

              {/* Arrow Button */}
              <div className="flex justify-end">
                <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
      </div>
    </div>
  );
}

export default function EmployerDashboard() {
  return (
    <EmployerOnly>
      <EmployerOnboardingGate>
        <EmployerDashboardContent />
      </EmployerOnboardingGate>
    </EmployerOnly>
  );
}