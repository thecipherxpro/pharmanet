import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatTime12Hour, parseLocalDate } from "../components/utils/timeUtils";
import { getScheduleFromShift } from "../components/utils/shiftUtils";
import WelcomeProfileCard from "../components/shared/WelcomeProfileCard";
import DashboardSkeleton from "../components/shared/skeletons/DashboardSkeleton";
import ShiftReadinessChecklist from "../components/pharmacist/ShiftReadinessChecklist";
import { 
  Search, 
  Calendar, 
  Clock,
  DollarSign,
  MapPin,
  FileText,
  ChevronRight,
  Star,
  CheckCircle2,
  Bell,
  Activity,
  User as UserIcon, 
  Edit3,
  ArrowRight,
  Wallet,
  Building2,
  Mail
} from "lucide-react";
import { format, isToday } from "date-fns";
import { Link } from "react-router-dom";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function PharmacistDashboardContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    
    const handleAvatarUpdate = (event) => {
      if (event.detail?.avatar_url) {
        setUser(prevUser => ({
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
    
    // Check if onboarding is incomplete
    const needsOnboarding = !userData.onboarding_completed &&
      (!userData.avatar_url ||
       !userData.phone ||
       !userData.license_number ||
       !userData.years_experience ||
       !userData.bio ||
       !userData.software_experience ||
       !userData.preferred_regions);
    
    if (needsOnboarding) {
      navigate(createPageUrl("PharmacistOnboarding"), { replace: true });
    }
  };

  const handleAvatarUpload = async (newAvatarUrl) => {
    setUser(prevUser => ({ ...prevUser, avatar_url: newAvatarUrl }));
    window.dispatchEvent(new CustomEvent('avatarUpdated', { 
      detail: { avatar_url: newAvatarUrl } 
    }));
  };

  // Consolidated: Fetch all user applications in one query
  const { data: allApplications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['allMyApplications', user?.email],
    queryFn: () => base44.entities.ShiftApplication.filter(
      { pharmacist_email: user?.email }, 
      "-applied_date",
      100
    ),
    enabled: !!user?.email,
    staleTime: 30000,
  });

  // Derive accepted and pending from single query
  const myApplications = allApplications.filter(app => app.status === "accepted");
  const pendingApplications = allApplications.filter(app => app.status === "pending");
  const acceptedShiftIds = new Set(myApplications.map(app => app.shift_id));

  // Fetch pending invitations count
  const { data: invitationStats = { pending: 0 } } = useQuery({
    queryKey: ['myInvitationsCount', user?.email],
    queryFn: async () => {
      if (!user?.email) return { pending: 0 };
      const response = await base44.functions.invoke('getPharmacistInvitations', {
        pharmacistEmail: user.email,
        status: 'pending'
      });
      return response.data?.stats || { pending: 0 };
    },
    enabled: !!user?.email,
    retry: 1,
    staleTime: 60000,
  });

  // Fetch reviews for the pharmacist
  const { data: myReviews = [] } = useQuery({
    queryKey: ['pharmacistReviews', user?.id],
    queryFn: () => base44.entities.Review.filter(
      { pharmacist_id: user.id, is_visible: true },
      '-created_date',
      20
    ),
    enabled: !!user?.id,
    staleTime: 120000,
  });

  // Single optimized shifts query - fetch open shifts only (covers both available and upcoming needs)
  const { data: openShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['dashboardShifts'],
    queryFn: () => base44.entities.Shift.filter(
      { status: "open" },
      '-created_date',
      50
    ),
    enabled: !!user,
    staleTime: 30000,
  });

  // Fetch only accepted shifts (filled status) for upcoming - much smaller query
  const { data: acceptedShifts = [] } = useQuery({
    queryKey: ['myAcceptedShifts', user?.email],
    queryFn: async () => {
      if (acceptedShiftIds.size === 0) return [];
      // Fetch shifts that are filled and assigned to this user
      const shifts = await base44.entities.Shift.filter(
        { assigned_to: user?.email },
        '-created_date',
        20
      );
      return shifts;
    },
    enabled: !!user?.email && acceptedShiftIds.size > 0,
    staleTime: 30000,
  });

  // Available shifts = open shifts (already filtered)
  const availableShiftsData = openShifts;

  // Helper to get primary date from shift
  const getShiftPrimaryDate = (shift) => {
    const schedule = getScheduleFromShift(shift);
    return schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };
  };

  // Compute upcoming shifts from accepted shifts (already filtered by assigned_to)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingShifts = acceptedShifts
    .filter(shift => {
      const primaryDate = getShiftPrimaryDate(shift);
      if (!primaryDate.date) return false;
      const shiftDate = parseLocalDate(primaryDate.date);
      return shiftDate >= today;
    })
    .sort((a, b) => {
      const dateA = getShiftPrimaryDate(a);
      const dateB = getShiftPrimaryDate(b);
      return parseLocalDate(dateA.date) - parseLocalDate(dateB.date);
    })
    .slice(0, 5);

  // Get active shift (today's shift) - derived from already computed upcomingShifts
  const activeShift = upcomingShifts.find(shift => {
    const primaryDate = getShiftPrimaryDate(shift);
    if (!primaryDate.date) return false;
    const shiftDate = parseLocalDate(primaryDate.date);
    return isToday(shiftDate);
  });

  // Calculate stats
  const totalEarnings = upcomingShifts.reduce((sum, shift) => sum + (shift.total_pay || 0), 0);
  const completedShifts = user?.completed_shifts || 0;
  const averageRating = myReviews.length > 0 
    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
    : 0;

  if (appsLoading || shiftsLoading) {
    return <DashboardSkeleton />;
  }

  const nextShiftData = upcomingShifts[0];
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Section 1: Welcome Card + Stats */}
          <div className="grid grid-cols-12 gap-5 mb-6">
            {/* Welcome Profile Card - Left (5 cols) */}
            <Card className="col-span-5 border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 p-5">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-lg">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user?.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-white">
                          {user?.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                        </span>
                      )}
                    </div>
                    {user?.is_verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 font-medium">{greeting}</p>
                    <h1 className="text-xl font-bold text-white truncate">
                      {user?.full_name?.split(' ')[0] || 'Pharmacist'}
                    </h1>
                    <p className="text-xs text-white/60 truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link to={createPageUrl("Profile")} className="flex-1">
                    <Button size="sm" variant="secondary" className="w-full h-9 bg-white/15 hover:bg-white/25 text-white border-0 text-xs font-medium">
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Link to={createPageUrl("BrowseShifts")} className="flex-1">
                    <Button size="sm" className="w-full h-9 bg-white text-teal-700 hover:bg-white/90 text-xs font-semibold">
                      <Search className="w-3.5 h-3.5 mr-1.5" />
                      Browse Shifts
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50/80 grid grid-cols-4 gap-2">
                <Link to={createPageUrl("MySchedule")} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white transition-colors group">
                  <Calendar className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                  <span className="text-[11px] text-gray-600 group-hover:text-teal-600 font-medium">Schedule</span>
                </Link>
                <Link to={createPageUrl("MyApplications")} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white transition-colors group relative">
                  <FileText className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                  <span className="text-[11px] text-gray-600 group-hover:text-teal-600 font-medium">Apps</span>
                  {pendingApplications.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {pendingApplications.length}
                    </span>
                  )}
                </Link>
                <Link to={createPageUrl("PharmacistInvitations")} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white transition-colors group relative">
                  <Mail className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                  <span className="text-[11px] text-gray-600 group-hover:text-teal-600 font-medium">Invites</span>
                  {invitationStats.pending > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {invitationStats.pending}
                    </span>
                  )}
                </Link>
                <Link to={createPageUrl("PharmacistWallet")} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white transition-colors group">
                  <Wallet className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                  <span className="text-[11px] text-gray-600 group-hover:text-teal-600 font-medium">Wallet</span>
                </Link>
              </div>
            </Card>

            {/* Stats Card - Right (7 cols) */}
            <Card className="col-span-7 border border-gray-200">
              <CardContent className="p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Your Performance</h2>
                  <Link to={createPageUrl("PharmacistReviews")} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                    View Details →
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{upcomingShifts.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Upcoming Shifts</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(0)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Total Earnings</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-100/50 rounded-xl p-4 border border-teal-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{completedShifts}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Completed</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-100/50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{averageRating || '0.0'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Shift Alert */}
          {activeShift && (() => {
            const activePrimaryDate = getShiftPrimaryDate(activeShift);
            return (
              <Link to={createPageUrl("PharmacistShiftDetails") + `?id=${activeShift.id}`} className="block mb-6">
                <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg transition-all border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center animate-pulse">
                        <Activity className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold flex items-center gap-2">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          Active Shift Today
                        </p>
                        <p className="text-sm text-green-100">{activeShift.pharmacy_name} • {formatTime12Hour(activePrimaryDate.start_time)} - {formatTime12Hour(activePrimaryDate.end_time)}</p>
                      </div>
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })()}

          {/* Section 2: Recent Shifts Horizontal Carousel */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent & Upcoming Shifts</h2>
              <Link to={createPageUrl("MySchedule")} className="text-sm text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {upcomingShifts.length === 0 && availableShiftsData.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-2">No shifts yet</p>
                  <Link to={createPageUrl("BrowseShifts")}>
                    <Button className="bg-teal-600 hover:bg-teal-700">Browse Available Shifts</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {/* Upcoming Shifts */}
                {upcomingShifts.map((shift) => {
                  const shiftPrimary = getShiftPrimaryDate(shift);
                  return (
                    <Link key={shift.id} to={createPageUrl("PharmacistShiftDetails") + `?id=${shift.id}`} className="flex-shrink-0 w-72">
                      <Card className="h-full border border-gray-200 hover:shadow-lg transition-all overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3">
                          <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Upcoming</span>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-gray-900 mb-1 truncate">{shift.pharmacy_name}</h3>
                          <p className="text-xs text-gray-500 mb-3">{shift.pharmacy_city}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {shiftPrimary.date ? format(new Date(shiftPrimary.date.split('-').map(Number).reduce((d, v, i) => i === 0 ? new Date(v, 0, 1) : i === 1 ? new Date(d.getFullYear(), v - 1, 1) : new Date(d.getFullYear(), d.getMonth(), v), new Date())), "EEE, MMM d") : 'TBD'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {formatTime12Hour(shiftPrimary.start_time)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total Pay</span>
                            <span className="text-xl font-bold text-teal-600">${shift.total_pay}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}

                {/* Available Shifts */}
                {availableShiftsData.slice(0, 5).map((shift) => {
                  const availPrimary = getShiftPrimaryDate(shift);
                  return (
                    <Link key={shift.id} to={createPageUrl("BrowseShifts") + `?openShift=${shift.id}`} className="flex-shrink-0 w-72">
                      <Card className="h-full border border-gray-200 hover:shadow-lg transition-all overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-3">
                          <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">Available</span>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-gray-900 mb-1 truncate">{shift.pharmacy_name}</h3>
                          <p className="text-xs text-gray-500 mb-3">{shift.pharmacy_city}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {availPrimary.date ? format(new Date(availPrimary.date.split('-').map(Number).reduce((d, v, i) => i === 0 ? new Date(v, 0, 1) : i === 1 ? new Date(d.getFullYear(), v - 1, 1) : new Date(d.getFullYear(), d.getMonth(), v), new Date())), "EEE, MMM d") : 'TBD'}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              ${shift.hourly_rate}/hr
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Total Pay</span>
                            <span className="text-xl font-bold text-emerald-600">${shift.total_pay}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}

                {/* View All Card */}
                <Link to={createPageUrl("BrowseShifts")} className="flex-shrink-0 w-48">
                  <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all border-2 border-dashed border-gray-300">
                    <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-3">
                      <ArrowRight className="w-6 h-6 text-teal-600" />
                    </div>
                    <p className="font-bold text-gray-700">View All</p>
                    <p className="text-sm text-gray-500">{availableShiftsData.length} available</p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Section 3: Bento Grid Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[320px]">
              {/* Browse Shifts - Large */}
              <Link to={createPageUrl("BrowseShifts")} className="col-span-2 row-span-2">
                <div className="relative h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-cyan-700"></div>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative h-full p-6 flex flex-col justify-between">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <Search className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-2xl mb-2">Browse Shifts</h3>
                      <p className="text-white/90 mb-3">
                        {availableShiftsData.length > 0 ? `${availableShiftsData.length} shifts available now` : 'Find your next opportunity'}
                      </p>
                      <div className="flex items-center text-white font-semibold text-lg">
                        <span>Explore Now</span>
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* My Schedule */}
              <Link to={createPageUrl("MySchedule")}>
                <div className="relative h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative h-full p-4 flex flex-col justify-between">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">My Schedule</h3>
                      <p className="text-sm text-white/80">{upcomingShifts.length} upcoming</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Invitations */}
              <Link to={createPageUrl("PharmacistInvitations")}>
                <div className="relative h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600"></div>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative h-full p-4 flex flex-col justify-between">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center relative">
                      <Mail className="w-5 h-5 text-white" />
                      {invitationStats.pending > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {invitationStats.pending}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Invitations</h3>
                      <p className="text-sm text-white/80">{invitationStats.pending} pending</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Applications */}
              <Link to={createPageUrl("MyApplications")}>
                <div className="relative h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700"></div>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative h-full p-4 flex flex-col justify-between">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center relative">
                      <FileText className="w-5 h-5 text-white" />
                      {pendingApplications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {pendingApplications.length}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Applications</h3>
                      <p className="text-sm text-white/80">{pendingApplications.length} pending</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Wallet */}
              <Link to={createPageUrl("PharmacistWallet")}>
                <div className="relative h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-green-700"></div>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative h-full p-4 flex flex-col justify-between">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Wallet</h3>
                      <p className="text-sm text-white/80">${totalEarnings.toFixed(0)} earned</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Secondary Actions Row */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <Link to={createPageUrl("PharmacistReviews")}>
                <Card className="hover:shadow-md transition-all border border-gray-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Reviews</h3>
                      <p className="text-xs text-gray-500">{averageRating}⭐ ({myReviews.length})</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl("BrowseEmployers")}>
                <Card className="hover:shadow-md transition-all border border-gray-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Employers</h3>
                      <p className="text-xs text-gray-500">Browse pharmacies</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl("Profile")}>
                <Card className="hover:shadow-md transition-all border border-gray-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Profile</h3>
                      <p className="text-xs text-gray-500">Update details</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to={createPageUrl("PharmacistSettings")}>
                <Card className="hover:shadow-md transition-all border border-gray-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Settings</h3>
                      <p className="text-xs text-gray-500">Preferences</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Professional Medical Welcome Card */}
      <div className="px-3 pt-4 pb-3">
        <WelcomeProfileCard
          user={user}
          onAvatarUpload={handleAvatarUpload}
          greeting={greeting}
          stats={[
            { 
              icon: <Calendar className="w-5 h-5" />,
              value: upcomingShifts.length, 
              label: "Upcoming" 
            },
            { 
              icon: <DollarSign className="w-5 h-5" />,
              value: `$${totalEarnings.toFixed(0)}`, 
              label: "Earnings" 
            },
            { 
              icon: <CheckCircle2 className="w-5 h-5" />,
              value: completedShifts, 
              label: "Completed" 
            }
          ]}
          actions={[
            {
              label: "Edit Profile",
              icon: <Edit3 className="w-4 h-4" />,
              onClick: () => navigate(createPageUrl("Profile")),
              variant: "outline"
            },
            {
              label: "Browse Shifts",
              icon: <Search className="w-4 h-4" />,
              onClick: () => navigate(createPageUrl("BrowseShifts")),
              variant: "default"
            }
          ]}
        />
      </div>

      {/* Shift Readiness Checklist */}
      <div className="px-3 mb-3">
        <ShiftReadinessChecklist />
      </div>

      {/* Search Bar - Links to Browse Shifts */}
      <div className="px-3 mb-3">
        <button 
          onClick={() => navigate(createPageUrl("BrowseShifts"))}
          className="w-full flex items-center gap-2 h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">Search shifts...</span>
        </button>
      </div>

      {/* Active Shift Alert - NEW */}
      {activeShift && (() => {
        const activePrimaryDate = getShiftPrimaryDate(activeShift);
        return (
          <div className="px-3 mb-3">
            <Link to={createPageUrl("PharmacistShiftDetails") + `?id=${activeShift.id}`}>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 active:scale-[0.98] transition-all shadow-lg border-2 border-green-400">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm mb-0.5 leading-tight flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Active Shift Today
                    </p>
                    <p className="text-xs text-green-100 leading-tight truncate">
                      {activeShift.pharmacy_name} • {formatTime12Hour(activePrimaryDate.start_time)} - {formatTime12Hour(activePrimaryDate.end_time)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })()}

      {/* Medical-themed Pending Applications Alert */}
      {pendingApplications.length > 0 && (
        <div className="px-3 mb-3">
          <Link to={createPageUrl("MyApplications")}>
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 active:scale-[0.98] transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm mb-0.5 leading-tight">
                    {pendingApplications.length} Pending Application{pendingApplications.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-600 leading-tight">
                    Waiting for employer response
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Medical-themed Next Shift Alert */}
      {nextShiftData && !activeShift && (() => {
        const nextPrimaryDate = getShiftPrimaryDate(nextShiftData);
        const formatNextDate = () => {
          if (!nextPrimaryDate.date) return 'TBD';
          try {
            const [y,m,d] = nextPrimaryDate.date.split('-').map(Number);
            return format(new Date(y, m-1, d), "MMM d");
          } catch { return 'TBD'; }
        };
        return (
          <div className="px-3 mb-3">
            <Link to={createPageUrl("MySchedule")}>
              <div className="bg-white border-2 border-teal-200 rounded-2xl p-4 active:scale-[0.98] transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm mb-0.5 leading-tight">
                      Next Shift: {formatNextDate()}
                    </p>
                    <p className="text-xs text-gray-600 leading-tight truncate">
                      {nextShiftData.pharmacy_name} • ${nextShiftData.total_pay}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-teal-600" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })()}

      {/* Professional Upcoming Shifts Carousel */}
      {upcomingShifts.length > 0 && (
        <div className="px-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Upcoming Shifts</h2>
            <Link to={createPageUrl("MySchedule")} className="text-sm text-blue-600 font-medium hover:text-blue-700">
              See All
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory touch-pan-x">
            {upcomingShifts.map((shift) => {
              const shiftPrimary = getShiftPrimaryDate(shift);
              const formatShiftDate = () => {
                if (!shiftPrimary.date) return 'Date TBD';
                try {
                  const [y,m,d] = shiftPrimary.date.split('-').map(Number);
                  return format(new Date(y, m-1, d), "MMM d, yyyy");
                } catch { return 'Date TBD'; }
              };
              return (
                <Link 
                  key={shift.id} 
                  to={createPageUrl("PharmacistShiftDetails") + `?id=${shift.id}`}
                  className="flex-shrink-0 w-72 snap-start"
                >
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all active:scale-[0.98]">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                            {shift.pharmacy_name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>{shift.pharmacy_city}</span>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1 border border-gray-200">
                          <p className="text-xs text-gray-500 leading-none">Rate</p>
                          <p className="font-bold text-blue-600">${shift.hourly_rate}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">
                              {formatShiftDate()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>
                              {formatTime12Hour(shiftPrimary.start_time)} - {formatTime12Hour(shiftPrimary.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Total Pay</span>
                        <span className="text-lg font-bold text-teal-600">${shift.total_pay}</span>
                      </div>

                      <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Shifts Carousel */}
      {availableShiftsData.length > 0 && (
        <div className="px-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Available Shifts</h2>
              <p className="text-xs text-gray-500">{availableShiftsData.length} shifts near you</p>
            </div>
            <Link 
              to={createPageUrl("BrowseShifts")} 
              className="flex items-center gap-1 text-sm text-teal-600 font-semibold hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory touch-pan-x">
            {availableShiftsData.slice(0, 8).map((shift) => {
              const availPrimary = getShiftPrimaryDate(shift);
              const formatAvailDate = () => {
                if (!availPrimary.date) return 'Date TBD';
                try {
                  const [y,m,d] = availPrimary.date.split('-').map(Number);
                  return format(new Date(y, m-1, d), "EEE, MMM d");
                } catch { return 'Date TBD'; }
              };
              return (
                <Link 
                  key={shift.id} 
                  to={createPageUrl("BrowseShifts") + `?openShift=${shift.id}`}
                  className="flex-shrink-0 w-64 snap-start"
                >
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all active:scale-[0.98] h-full">
                    {/* Rate Banner */}
                    <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">${shift.hourly_rate}</span>
                        <span className="text-xs text-zinc-400">/hr</span>
                      </div>
                      {(shift.pricing_tier === 'emergency' || shift.urgency_level === 'emergency') && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Urgent
                        </span>
                      )}
                      {(shift.pricing_tier === 'very_urgent' || shift.urgency_level === 'very_urgent') && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Hot
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 truncate">
                        {shift.pharmacy_name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{shift.pharmacy_city}, ON</span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-medium text-gray-900">
                            {formatAvailDate()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>
                            {formatTime12Hour(availPrimary.start_time)} - {formatTime12Hour(availPrimary.end_time)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-sm font-bold text-emerald-600">${shift.total_pay}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* View All Card */}
            <Link 
              to={createPageUrl("BrowseShifts")}
              className="flex-shrink-0 w-40 snap-start"
            >
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl h-full min-h-[200px] flex flex-col items-center justify-center p-4 hover:shadow-lg transition-all active:scale-[0.98]">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-bold text-sm text-center">View All</p>
                <p className="text-white/80 text-xs text-center mt-1">{availableShiftsData.length} shifts</p>
              </div>
            </Link>
          </div>
        </div>
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

      {/* Professional Quick Action Cards - Image Backgrounds */}
      <div className="px-3 mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Link to={createPageUrl("MySchedule")}>
            <div className="relative h-32 rounded-2xl overflow-hidden shadow-md active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5 text-sm">My Schedule</h3>
                  <p className="text-xs text-white/80 mb-1">
                    {upcomingShifts.length > 0 
                      ? `${upcomingShifts.length} upcoming`
                      : 'No shifts'
                    }
                  </p>
                  <div className="flex items-center text-white/90 text-xs font-medium">
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("BrowseShifts")}>
            <div className="relative h-32 rounded-2xl overflow-hidden shadow-md active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-800"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5 text-sm">Browse Shifts</h3>
                  <p className="text-xs text-white/80 mb-1">
                    {availableShiftsData.length > 0 
                      ? `${availableShiftsData.length} available`
                      : 'No shifts'
                    }
                  </p>
                  <div className="flex items-center text-white/90 text-xs font-medium">
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("PharmacistInvitations")}>
            <div className="relative h-32 rounded-2xl overflow-hidden shadow-md active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg relative">
                  <Mail className="w-5 h-5 text-white" />
                  {invitationStats.pending > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {invitationStats.pending}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5 text-sm">Invitations</h3>
                  <p className="text-xs text-white/80 mb-1">
                    {invitationStats.pending > 0 
                      ? `${invitationStats.pending} pending`
                      : 'No pending'
                    }
                  </p>
                  <div className="flex items-center text-white/90 text-xs font-medium">
                    <span>View</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("BrowseEmployers")}>
            <div className="relative h-32 rounded-2xl overflow-hidden shadow-md active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-violet-800"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5 text-sm">Employers</h3>
                  <p className="text-xs text-white/80 mb-1">Browse pharmacies</p>
                  <div className="flex items-center text-white/90 text-xs font-medium">
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("MyApplications")}>
            <div className="relative h-32 rounded-2xl overflow-hidden shadow-md active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5 text-sm">Applications</h3>
                  <p className="text-xs text-white/80 mb-1">
                    {pendingApplications.length > 0 
                      ? `${pendingApplications.length} pending`
                      : 'No pending'
                    }
                  </p>
                  <div className="flex items-center text-white/90 text-xs font-medium">
                    <span>Review</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("PharmacistWallet")}>
            <div className="relative h-32 rounded-2xl overflow-hidden shadow-md active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5 text-sm">Wallet</h3>
                  <p className="text-xs text-white/80 mb-1">
                    {totalEarnings > 0 
                      ? `$${totalEarnings.toFixed(0)} earned`
                      : 'Manage payments'
                    }
                  </p>
                  <div className="flex items-center text-white/90 text-xs font-medium">
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("PharmacistReviews")}>
            <div className="relative h-32 rounded-2xl overflow-hidden shadow-md active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-700"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5 text-sm">My Reviews</h3>
                  <p className="text-xs text-white/80 mb-1">
                    {myReviews.length > 0 
                      ? `${averageRating}⭐ (${myReviews.length})`
                      : 'No reviews yet'
                    }
                  </p>
                  <div className="flex items-center text-white/90 text-xs font-medium">
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link to={createPageUrl("Profile")}>
            <div className="relative h-32 rounded-2xl overflow-hidden shadow-md active:scale-[0.97] active:brightness-95 transition-all duration-200 group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400')] bg-cover bg-center opacity-30 group-active:opacity-40 transition-opacity"></div>
              <div className="relative h-full p-3 flex flex-col justify-between">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-0.5 text-sm">Profile</h3>
                  <p className="text-xs text-white/80 mb-1">Update details</p>
                  <div className="flex items-center text-white/90 text-xs font-medium">
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function PharmacistDashboard() {
  return (
    <PharmacistOnly>
      <PharmacistDashboardContent />
    </PharmacistOnly>
  );
}