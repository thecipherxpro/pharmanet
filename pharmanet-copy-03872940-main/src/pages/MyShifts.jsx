import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, Filter, Ban, RefreshCw, Edit2, CheckCircle, Star, Eye, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UnifiedShiftCard from "../components/shift/UnifiedShiftCard";
import { EmployerOnly } from "../components/auth/RouteProtection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { parseLocalDate } from "../components/utils/timeUtils";
import EmptyState from "../components/shared/EmptyState";
import OnboardingGate from "../components/onboarding/OnboardingGate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TimePicker from "../components/ui/time-picker";
import { useToast } from "@/components/ui/use-toast";
import CardGridSkeleton from "../components/shared/skeletons/CardGridSkeleton";
import { filterShiftsByStatus, getScheduleFromShift } from "../components/utils/shiftUtils";
import EmployerShiftDetailsDrawer from "../components/employer/EmployerShiftDetailsDrawer";

function MyShiftsContent() {
  const [activeTab, setActiveTab] = useState("open");
  const [user, setUser] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const [showRepostDialog, setShowRepostDialog] = useState(false);
  const [repostingShift, setRepostingShift] = useState(null);
  const [repostForm, setRepostForm] = useState({
    new_date: "",
    new_start_time: "09:00",
    new_end_time: "17:00"
  });
  const [selectedShift, setSelectedShift] = useState(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { 
    data, 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['myShifts', user?.email],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const result = await base44.entities.Shift.filter(
        { created_by: user?.email }, 
        "-created_date", 
        limit, 
        pageParam
      );
      const shifts = result || [];
      return { shifts, fetchedCount: shifts.length };
    },
    getNextPageParam: (lastPage, allPages) => {
      const limit = 20;
      if (lastPage.fetchedCount < limit) return undefined;
      return allPages.length * limit;
    },
    enabled: !!user,
    refetchInterval: 60000,
    refetchOnWindowFocus: true
  });

  const shifts = data ? data.pages.flatMap(page => page.shifts) : [];

  const { data: cancellations = [], isLoading: cancellationsLoading } = useQuery({
    queryKey: ['myShiftCancellations', user?.id],
    queryFn: async () => {
      const data = await base44.entities.ShiftCancellation.filter(
        { employer_id: user?.id },
        "-cancelled_at"
      );
      return data;
    },
    enabled: !!user,
    initialData: []
  });

  const repostMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('repostShift', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myShifts'] });
      setShowRepostDialog(false);
      setRepostingShift(null);
      setRepostForm({
        new_date: "",
        new_start_time: "09:00",
        new_end_time: "17:00"
      });
      toast({
        title: "✓ Shift Reposted",
        description: `Shift reposted successfully for ${data.new_shift.shift_date}`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.error || "Failed to repost shift",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (shiftId) => {
      await base44.entities.Shift.delete(shiftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myShifts'] });
      setShowDeleteDialog(false);
      setShiftToDelete(null);
      toast({
        title: "✓ Shift Deleted",
        description: "Shift has been permanently removed",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to delete shift",
      });
    }
  });

  // Use centralized filtering logic
  const openShifts = filterShiftsByStatus(shifts, 'open');
  const closedShifts = filterShiftsByStatus(shifts, 'closed');
  const filledShifts = filterShiftsByStatus(shifts, 'filled');
  const completedShifts = filterShiftsByStatus(shifts, 'completed');
  const cancelledShifts = filterShiftsByStatus(shifts, 'cancelled');

  const currentShifts = activeTab === "open" ? openShifts :
                       activeTab === "closed" ? closedShifts :
                       activeTab === "filled" ? filledShifts :
                       activeTab === "completed" ? completedShifts :
                       cancelledShifts;

  const { data: applications = [] } = useQuery({
    queryKey: ['employerApplications', user?.email],
    queryFn: async () => {
      const shiftIds = shifts.map(s => s.id);
      if (shiftIds.length === 0) return [];
      const apps = await base44.entities.ShiftApplication.filter({});
      return apps.filter(app => shiftIds.includes(app.shift_id));
    },
    enabled: !!user && shifts.length > 0,
    initialData: []
  });

  const handleRepost = (shift) => {
    const schedule = getScheduleFromShift(shift);
    const primaryDate = schedule[0] || { start_time: "09:00", end_time: "17:00" };
    setRepostingShift(shift);
    setRepostForm({
      new_date: "",
      new_start_time: primaryDate.start_time || "09:00",
      new_end_time: primaryDate.end_time || "17:00"
    });
    setShowRepostDialog(true);
  };

  const handleDeleteClick = (shift) => {
    setShiftToDelete(shift);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (shiftToDelete) {
      deleteMutation.mutate(shiftToDelete.id);
    }
  };

  const handleSubmitRepost = () => {
    if (!repostForm.new_date) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a new date",
      });
      return;
    }

    repostMutation.mutate({
      original_shift_id: repostingShift.id,
      new_date: repostForm.new_date,
      new_start_time: repostForm.new_start_time,
      new_end_time: repostForm.new_end_time
    });
  };

  const renderClosedShiftCard = (shift) => {
    const schedule = getScheduleFromShift(shift);
    const primaryDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };
    
    return (
      <Card key={shift.id} className="hover:shadow-lg transition-shadow border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                <h4 className="font-bold text-gray-900 text-lg">
                  {shift.pharmacy_name}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {primaryDate.date && /^\d{4}-\d{2}-\d{2}$/.test(primaryDate.date)
                    ? (() => { try { const [y,m,d] = primaryDate.date.split('-').map(Number); return format(new Date(y,m-1,d), "EEE, MMM d, yyyy"); } catch { return 'Date not set'; } })()
                    : 'Date not set'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {primaryDate.start_time} - {primaryDate.end_time}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-semibold">
              Closed
            </Badge>
          </div>

          <div className="mb-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-800 font-medium mb-1">
              <Ban className="w-3.5 h-3.5 inline mr-1" />
              Expired Unfilled
            </p>
            <p className="text-xs text-gray-600">
              This shift was not filled before the scheduled time
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shift Pay:</span>
              <span className="text-lg font-bold text-gray-900">
                ${shift.total_pay?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => navigate(createPageUrl("ShiftDetails") + `?id=${shift.id}`)}
              variant="outline"
              size="sm"
              className="flex-1 h-10"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            
            <Button
              onClick={() => handleRepost(shift)}
              size="sm"
              className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Repost Shift
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCompletedShiftCard = (shift) => {
    const schedule = getScheduleFromShift(shift);
    const primaryDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };
    
    return (
      <Card key={shift.id} className="hover:shadow-lg transition-shadow border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-gray-900 text-lg">
                  {shift.pharmacy_name}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {primaryDate.date && /^\d{4}-\d{2}-\d{2}$/.test(primaryDate.date)
                    ? (() => { try { const [y,m,d] = primaryDate.date.split('-').map(Number); return format(new Date(y,m-1,d), "EEE, MMM d, yyyy"); } catch { return 'Date not set'; } })()
                    : 'Date not set'}
                </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {primaryDate.start_time} - {primaryDate.end_time}
                </span>
                </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
            </Badge>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 mb-3 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 font-medium">Total Paid:</span>
              <span className="text-xl font-bold text-blue-600">
                ${shift.total_pay?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => navigate(createPageUrl("CompletedShiftDetails") + `?id=${shift.id}`)}
              variant="outline"
              size="sm"
              className="flex-1 h-10"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            
            {!shift.reviewed_by_employer && (
              <Button
                onClick={() => navigate(createPageUrl("CompletedShiftDetails") + `?id=${shift.id}`)}
                size="sm"
                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
              >
                <Star className="w-4 h-4 mr-2" />
                Post Review
              </Button>
            )}
          </div>

          {shift.reviewed_by_employer && (
            <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-800 font-medium">
                ✓ Review submitted
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <CardGridSkeleton itemCount={6} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Shifts</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your posted shifts</p>
              </div>
              <Link to={createPageUrl("PostShift")}>
                <button className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  Post Shift
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Row */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab("open")}>
              <p className="text-3xl font-bold text-gray-900">{openShifts.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Open</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab("closed")}>
              <p className="text-3xl font-bold text-gray-900">{closedShifts.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Closed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab("filled")}>
              <p className="text-3xl font-bold text-gray-900">{filledShifts.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Filled</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab("completed")}>
              <p className="text-3xl font-bold text-gray-900">{completedShifts.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Completed</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveTab("cancelled")}>
              <p className="text-3xl font-bold text-gray-900">{cancelledShifts.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Cancelled</p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {["open", "closed", "filled", "completed", "cancelled"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Desktop Shifts Grid */}
            <div className="p-4">
              {currentShifts.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No {activeTab} shifts</p>
                  {activeTab === "open" && (
                    <Link to={createPageUrl("PostShift")}>
                      <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm inline-flex items-center gap-2">
                        <Plus size={16} />
                        Post First Shift
                      </button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentShifts.map((shift) => (
                    <UnifiedShiftCard
                      key={shift.id}
                      shift={shift}
                      viewType="employer"
                      applications={applications.filter(app => app.shift_id === shift.id)}
                      onEdit={(shift) => navigate(createPageUrl("EditShift") + `?id=${shift.id}`)}
                      onDelete={handleDeleteClick}
                      onViewDetails={(s) => {
                        setSelectedShift(s);
                        setShowDetailsDrawer(true);
                      }}
                    />
                  ))}
                </div>
              )}
              
              {hasNextPage && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading..." : "Load More Shifts"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      <div className="bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 px-4 pt-4 pb-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-2xl font-bold mb-1">My Shifts</h1>
            <p className="text-gray-200 text-sm">Manage your posted shifts</p>
          </div>
          <Link to={createPageUrl("PostShift")}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors">
              <Plus size={24} />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold text-white">{openShifts.length}</p>
            <p className="text-xs text-gray-200">Open</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold text-white">{closedShifts.length}</p>
            <p className="text-xs text-gray-200">Closed</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold text-white">{filledShifts.length}</p>
            <p className="text-xs text-gray-200">Filled</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold text-white">{completedShifts.length}</p>
            <p className="text-xs text-gray-200">Done</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <p className="text-2xl font-bold text-white">{cancelledShifts.length}</p>
            <p className="text-xs text-gray-200">Cancelled</p>
          </div>
        </div>
      </div>

      <div 
        className={`px-4 py-4 bg-white border-b border-gray-100 transition-all duration-300 ${
          isSticky ? 'sticky top-[50px] z-10 shadow-md' : ''
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("open")}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "open" ?
              'bg-blue-600 text-white shadow-sm' :
              'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Open ({openShifts.length})
          </button>
          <button
            onClick={() => setActiveTab("closed")}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "closed" ?
              'bg-orange-600 text-white shadow-sm' :
              'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Closed ({closedShifts.length})
          </button>
          <button
            onClick={() => setActiveTab("filled")}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "filled" ?
              'bg-green-600 text-white shadow-sm' :
              'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Filled ({filledShifts.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "completed" ?
              'bg-blue-600 text-white shadow-sm' :
              'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Done ({completedShifts.length})
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === "cancelled" ?
              'bg-red-600 text-white shadow-sm' :
              'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cancelled ({cancelledShifts.length})
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {cancellationsLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === "closed" ? (
          closedShifts.length === 0 ? (
            <EmptyState
              icon={Ban}
              title="No Closed Shifts"
              description="Shifts that expire without being filled will appear here. Post shifts early to increase your chances of finding pharmacists."
              actionLabel="Post New Shift"
              onAction={() => navigate(createPageUrl("PostShift"))}
            />
          ) : (
            <div className="space-y-3">
              {closedShifts.map((shift) => renderClosedShiftCard(shift))}
            </div>
          )
        ) : activeTab === "cancelled" ? (
          cancelledShifts.length === 0 ? (
            <EmptyState
              icon={Ban}
              title="No Cancelled Shifts"
              description="Shifts that you cancel will appear here. Late cancellations may result in compensation fees paid to pharmacists."
            />
          ) : (
            <div className="space-y-3">
              {cancelledShifts.map((shift) => {
                const cancellation = cancellations.find(c => c.shift_id === shift.id);
                const schedule = getScheduleFromShift(shift);
                const primaryDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };
                
                return (
                  <Card key={shift.id} className="hover:shadow-lg transition-shadow border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">
                            {shift.pharmacy_name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {primaryDate.date && /^\d{4}-\d{2}-\d{2}$/.test(primaryDate.date)
                                ? (() => { try { const [y,m,d] = primaryDate.date.split('-').map(Number); return format(new Date(y,m-1,d), "MMM d, yyyy"); } catch { return 'Date not set'; } })()
                                : 'Date not set'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {primaryDate.start_time} - {primaryDate.end_time}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-semibold">
                          Cancelled
                        </Badge>
                      </div>

                      {shift.cancelled_reason && (
                        <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">Reason:</p>
                          <p className="text-sm text-gray-800">{shift.cancelled_reason}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Shift Pay:</span>
                          <span className="text-lg font-bold text-gray-900">
                            ${shift.total_pay?.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {cancellation && cancellation.penalty_employer_share > 0 && (
                        <div className="mb-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-teal-800">
                              Your Penalty Earnings:
                            </span>
                            <span className="text-lg font-bold text-teal-600">
                              +${cancellation.penalty_employer_share.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handleRepost(shift)}
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Repost Shift
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : activeTab === "completed" ? (
          completedShifts.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No Completed Shifts"
              description="Completed shifts will appear here. Remember to review pharmacists to help build the community."
              actionLabel="View Open Shifts"
              onAction={() => setActiveTab("open")}
            />
          ) : (
            <div className="space-y-3">
              {completedShifts.map((shift) => renderCompletedShiftCard(shift))}
            </div>
          )
        ) : (
          currentShifts.length === 0 ? (
            <EmptyState
              icon={activeTab === "open" ? Calendar : activeTab === "filled" ? Clock : Calendar}
              title={`No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Shifts`}
              description={
                activeTab === "open" 
                  ? "You haven't posted any shifts yet. Create your first shift posting to find qualified pharmacists."
                  : activeTab === "filled"
                  ? "Filled shifts will appear here once pharmacists are assigned."
                  : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} shifts will appear here.`
              }
              actionLabel={activeTab === "open" ? "Post Your First Shift" : "View Open Shifts"}
              onAction={() => activeTab === "open" ? navigate(createPageUrl("PostShift")) : setActiveTab("open")}
            />
          ) : (
            <div className="space-y-3">
              {currentShifts.map((shift) => (
                <UnifiedShiftCard
                  key={shift.id}
                  shift={shift}
                  viewType="employer"
                  applications={applications.filter(app => app.shift_id === shift.id)}
                  onEdit={(shift) => navigate(createPageUrl("EditShift") + `?id=${shift.id}`)}
                  onDelete={handleDeleteClick}
                  onViewDetails={(s) => {
                    setSelectedShift(s);
                    setShowDetailsDrawer(true);
                  }}
                />
              ))}
            </div>
          )
        )}
        
        {hasNextPage && (
          <div className="flex justify-center pt-4 pb-8">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load More Shifts"}
            </Button>
          </div>
        )}
      </div>
      </div>

      <Dialog open={showRepostDialog} onOpenChange={setShowRepostDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Repost Shift</DialogTitle>
            <DialogDescription>
              Repost this shift with a new date and time. All other details will remain the same.
            </DialogDescription>
          </DialogHeader>

          {repostingShift && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Original Shift:</p>
                <p className="text-sm text-gray-700">{repostingShift.pharmacy_name}</p>
                <p className="text-xs text-gray-600">{repostingShift.title}</p>
              </div>

              <div>
                <Label htmlFor="new_date" className="text-sm font-medium mb-2 block">
                  New Date *
                </Label>
                <Input
                  id="new_date"
                  type="date"
                  value={repostForm.new_date}
                  onChange={(e) => setRepostForm({ ...repostForm, new_date: e.target.value })}
                  className="h-11"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div>
                <Label htmlFor="new_start_time" className="text-sm font-medium mb-2 block">
                  Start Time
                </Label>
                <TimePicker
                  value={repostForm.new_start_time}
                  onChange={(val) => setRepostForm({ ...repostForm, new_start_time: val })}
                />
              </div>

              <div>
                <Label htmlFor="new_end_time" className="text-sm font-medium mb-2 block">
                  End Time
                </Label>
                <TimePicker
                  value={repostForm.new_end_time}
                  onChange={(val) => setRepostForm({ ...repostForm, new_end_time: val })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRepostDialog(false)}
              disabled={repostMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRepost}
              disabled={repostMutation.isPending || !repostForm.new_date}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {repostMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Reposting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Repost Shift
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Details Drawer */}
      <EmployerShiftDetailsDrawer
        open={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedShift(null);
        }}
        shift={selectedShift}
        onEditClick={(shift) => {
          navigate(createPageUrl("EditShift") + `?id=${shift.id}`);
          setShowDetailsDrawer(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md mx-3">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Shift?</DialogTitle>
            <DialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete the shift.
            </DialogDescription>
          </DialogHeader>

          {shiftToDelete && (() => {
            const schedule = getScheduleFromShift(shiftToDelete);
            const primaryDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };
            return (
              <div className="py-3 px-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {shiftToDelete.pharmacy_name}
                </p>
                <p className="text-xs text-gray-600">
                  {primaryDate.date && /^\d{4}-\d{2}-\d{2}$/.test(primaryDate.date)
                    ? (() => { try { const [y,m,d] = primaryDate.date.split('-').map(Number); return format(new Date(y,m-1,d), "MMM d, yyyy"); } catch { return 'N/A'; } })()
                    : 'N/A'} • {primaryDate.start_time} - {primaryDate.end_time}
                </p>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
              className="flex-1 sm:flex-none h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 sm:flex-none h-10 bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Shift"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      );
      }

      export default function MyShifts() {
        return (
          <EmployerOnly>
            <OnboardingGate userType="employer" minimumCompletion={80}>
              <MyShiftsContent />
            </OnboardingGate>
          </EmployerOnly>
        );
      }