import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isAfter, isBefore, addDays, differenceInDays, startOfWeek, endOfWeek, isPast, isFuture, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, Edit2, Trash2, Plus, MapPin, X, Building2, PlayCircle, XCircle, Ban, ArrowRight, DollarSign, Repeat, Layers, Copy, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { formatTime12Hour } from "../components/utils/timeUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CalendarView from "../components/schedule/CalendarView";
import BulkAvailabilityDialog from "../components/schedule/BulkAvailabilityDialog";
import RecurringPatternDialog from "../components/schedule/RecurringPatternDialog";
import AvailabilityTemplates from "../components/schedule/AvailabilityTemplates";

function MyScheduleContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [activeTab, setActiveTab] = useState("calendar");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const MAX_DAYS_AHEAD = 30;

  const [availabilityForm, setAvailabilityForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "17:00",
    notes: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: acceptedApps } = useQuery({
    queryKey: ['acceptedShifts', user?.email],
    queryFn: () => base44.entities.ShiftApplication.filter(
      { pharmacist_email: user?.email, status: "accepted" }
    ),
    enabled: !!user,
    initialData: [],
    staleTime: 30000,
  });

  const { data: allShifts } = useQuery({
    queryKey: ['allShiftsForSchedule'],
    queryFn: () => base44.entities.Shift.filter({}, "-created_date", 200),
    initialData: [],
    staleTime: 60000,
  });

  const { data: availability } = useQuery({
    queryKey: ['myAvailability', user?.email],
    queryFn: () => base44.entities.Availability.filter({ pharmacist_email: user?.email }),
    enabled: !!user,
    initialData: [],
    staleTime: 30000,
  });

  const { data: pendingApplications } = useQuery({
    queryKey: ['myPendingApps', user?.email],
    queryFn: async () => {
      const [apps, allShiftsForApps] = await Promise.all([
        base44.entities.ShiftApplication.filter({ 
          pharmacist_email: user?.email, 
          status: "pending" 
        }),
        base44.entities.Shift.filter({ status: "open" }, "-created_date", 100)
      ]);
      
      const shiftsMap = new Map(allShiftsForApps.map(s => [s.id, s]));
      return apps.map(app => ({ ...app, shift: shiftsMap.get(app.shift_id) })).filter(a => a.shift);
    },
    enabled: !!user,
    initialData: [],
    staleTime: 30000,
  });

  const { data: cancelledShifts } = useQuery({
    queryKey: ['myCancelledShifts', user?.id],
    queryFn: () => base44.entities.ShiftCancellation.filter(
      { pharmacist_id: user?.id },
      "-cancelled_at",
      50
    ),
    enabled: !!user,
    initialData: [],
    staleTime: 60000,
  });

  // Auto-cleanup past availabilities on mount and when availability changes
  useEffect(() => {
    if (availability && availability.length > 0) {
      cleanupPastAvailabilities();
    }
  }, [availability]);

  const cleanupPastAvailabilities = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastAvailabilities = availability.filter(avail => {
      const availDate = new Date(avail.date);
      availDate.setHours(0, 0, 0, 0);
      return availDate < today;
    });

    if (pastAvailabilities.length > 0) {
      for (const avail of pastAvailabilities) {
        try {
          await base44.entities.Availability.delete(avail.id);
        } catch (error) {
          console.error('Error deleting past availability:', error);
        }
      }
      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
    }
  };

  const createAvailabilityMutation = useMutation({
    mutationFn: (data) => base44.entities.Availability.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
      setShowAddDialog(false);
      setEditingAvailability(null);
      setAvailabilityForm({ date: format(selectedDate, "yyyy-MM-dd"), start_time: "09:00", end_time: "17:00", notes: "" });
      toast({
        title: "✓ Availability Added",
        description: "Your availability has been saved",
      });
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Availability.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
      setShowAddDialog(false);
      setEditingAvailability(null);
      setAvailabilityForm({ date: format(selectedDate, "yyyy-MM-dd"), start_time: "09:00", end_time: "17:00", notes: "" });
      toast({
        title: "✓ Availability Updated",
      });
    },
  });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: (id) => base44.entities.Availability.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
      toast({
        title: "✓ Availability Removed",
      });
    },
  });

  const myShifts = allShifts.filter(shift =>
    acceptedApps.some(app => app.shift_id === shift.id)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to get primary date from shift_dates array
  const getPrimaryDate = (shift) => {
    if (shift.shift_dates && shift.shift_dates.length > 0) {
      return shift.shift_dates[0];
    }
    return null;
  };

  const upcomingShifts = myShifts.filter(shift => {
    const primaryDate = getPrimaryDate(shift);
    if (!primaryDate?.date) return false;
    const [year, month, day] = primaryDate.date.split('-').map(Number);
    const shiftDate = new Date(year, month - 1, day);
    return isFuture(shiftDate) && (shift.status === 'filled' || shift.status === 'open');
  }).sort((a, b) => {
    const dateA = getPrimaryDate(a)?.date || '';
    const dateB = getPrimaryDate(b)?.date || '';
    return dateA.localeCompare(dateB);
  });

  const activeShifts = myShifts.filter(shift => {
    const primaryDate = getPrimaryDate(shift);
    if (!primaryDate?.date) return false;
    const [year, month, day] = primaryDate.date.split('-').map(Number);
    const shiftDate = new Date(year, month - 1, day);
    return isToday(shiftDate) && (shift.status === 'filled' || shift.status === 'open');
  });

  const completedShifts = myShifts.filter(shift => {
    const primaryDate = getPrimaryDate(shift);
    if (!primaryDate?.date) return false;
    const [year, month, day] = primaryDate.date.split('-').map(Number);
    const shiftDate = new Date(year, month - 1, day);
    const isPastDate = isPast(shiftDate) && !isToday(shiftDate);
    
    // Check if shift has ended (past date + past end time)
    const [endHours, endMinutes] = (primaryDate.end_time || "17:00").split(':').map(Number);
    const shiftEndDateTime = new Date(shiftDate);
    shiftEndDateTime.setHours(endHours, endMinutes, 0, 0);
    const hasEnded = new Date() > shiftEndDateTime;
    
    return (
      shift.status === 'completed' || 
      (isPastDate && (shift.status === 'filled' || shift.status === 'open')) ||
      (hasEnded && (shift.status === 'filled' || shift.status === 'open'))
    );
  }).sort((a, b) => {
    const dateA = getPrimaryDate(a)?.date || '';
    const dateB = getPrimaryDate(b)?.date || '';
    return dateB.localeCompare(dateA);
  });

  // Filter out past availabilities from display
  const futureAvailability = availability.filter(avail => {
    const availDate = new Date(avail.date);
    availDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return availDate >= todayDate;
  });

  const handleAddAvailability = () => {
    setEditingAvailability(null);
    setAvailabilityForm({ 
      date: format(new Date(), "yyyy-MM-dd"),
      start_time: "09:00", 
      end_time: "17:00", 
      notes: "" 
    });
    setShowAddDialog(true);
  };

  const handleEditAvailability = (avail) => {
    setEditingAvailability(avail);
    setAvailabilityForm({
      date: avail.date,
      start_time: avail.start_time,
      end_time: avail.end_time,
      notes: avail.notes || ""
    });
    setShowAddDialog(true);
  };

  const handleDeleteAvailability = (availId) => {
    if (window.confirm('Are you sure you want to delete this availability?')) {
      deleteAvailabilityMutation.mutate(availId);
    }
  };

  const checkConflict = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const hasShift = myShifts.some(s => {
      const primaryDate = getPrimaryDate(s);
      return primaryDate?.date === dateStr && (s.status === 'filled' || s.status === 'open');
    });
    return hasShift;
  };

  const handleSaveAvailability = () => {
    const selectedDate = new Date(availabilityForm.date);
    
    // Check 30-day limit
    const maxDate = addDays(new Date(), MAX_DAYS_AHEAD);
    if (selectedDate > maxDate) {
      toast({
        variant: "destructive",
        title: "Date Out of Range",
        description: `Availability can only be set up to ${MAX_DAYS_AHEAD} days ahead`,
      });
      return;
    }

    // Check for conflicts
    if (!editingAvailability && checkConflict(selectedDate)) {
      setConflictData({
        date: availabilityForm.date,
        start_time: availabilityForm.start_time,
        end_time: availabilityForm.end_time,
        notes: availabilityForm.notes
      });
      setShowConflictWarning(true);
      return;
    }

    saveAvailability();
  };

  const saveAvailability = () => {
    const data = {
      pharmacist_email: user.email,
      date: availabilityForm.date,
      start_time: availabilityForm.start_time,
      end_time: availabilityForm.end_time,
      notes: availabilityForm.notes
    };

    if (editingAvailability) {
      updateAvailabilityMutation.mutate({ id: editingAvailability.id, data });
    } else {
      createAvailabilityMutation.mutate(data);
    }
  };

  const handleBulkSave = async (days, timeData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out conflicts and existing availability
    const validDays = days.filter(day => {
      const dayDate = new Date(day);
      dayDate.setHours(0, 0, 0, 0);
      const dayStr = format(day, "yyyy-MM-dd");
      const hasExisting = availability.some(a => a.date === dayStr);
      return dayDate >= today && !checkConflict(day) && !hasExisting;
    });

    if (validDays.length === 0) {
      toast({
        variant: "destructive",
        title: "No Valid Days",
        description: "All selected days either have conflicts or already have availability set",
      });
      return;
    }

    const skippedCount = days.length - validDays.length;
    
    try {
      // Create individual availability records for each day
      const createPromises = validDays.map(day => 
        base44.entities.Availability.create({
          pharmacist_email: user.email,
          date: format(day, "yyyy-MM-dd"),
          start_time: timeData.start_time,
          end_time: timeData.end_time,
          notes: timeData.notes || ""
        })
      );

      await Promise.all(createPromises);

      queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
      setShowBulkDialog(false);
      setShowRecurringDialog(false);

      toast({
        title: "✓ Availability Added",
        description: `Added ${validDays.length} individual day${validDays.length !== 1 ? 's' : ''}${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Add Availability",
        description: error?.message || "Please try again",
      });
    }
  };

  const handleDayClick = (day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const existingAvail = availability.find(a => a.date === dayStr);
    
    if (existingAvail) {
      handleEditAvailability(existingAvail);
    } else {
      setEditingAvailability(null);
      setAvailabilityForm({ 
        date: dayStr,
        start_time: "09:00", 
        end_time: "17:00", 
        notes: "" 
      });
      setShowAddDialog(true);
    }
  };

  const handleTemplateSelect = (timeData) => {
    setAvailabilityForm({
      ...availabilityForm,
      start_time: timeData.start,
      end_time: timeData.end
    });
  };

  const handleViewShift = (shiftId) => {
    navigate(createPageUrl("PharmacistShiftDetails") + `?id=${shiftId}`);
  };

  const handleViewCompletedShift = (shiftId) => {
    navigate(createPageUrl("PharmacistCompletedShiftDetails") + `?id=${shiftId}`);
  };

  const renderShiftCard = (shift, type) => (
    <Card key={shift.id} className="hover:shadow-lg transition-all border border-gray-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                {shift.pharmacy_name}
              </h4>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{shift.pharmacy_city}</span>
            </div>
          </div>
          
          {type === 'active' && (
            <Badge className="bg-green-600 text-white flex-shrink-0 text-xs">
              <PlayCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
          {type === 'completed' && (
            <Badge className="bg-blue-600 text-white flex-shrink-0 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Done
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-medium text-gray-900">
              {shift.shift_dates?.[0]?.date 
                ? (() => {
                    const [year, month, day] = shift.shift_dates[0].date.split('-').map(Number);
                    return format(new Date(year, month - 1, day), "EEE, MMM d, yyyy");
                  })()
                : 'Date not set'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>
              {formatTime12Hour(shift.shift_dates?.[0]?.start_time || '09:00')} - {formatTime12Hour(shift.shift_dates?.[0]?.end_time || '17:00')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold text-emerald-600">${shift.total_pay}</span>
          </div>
        </div>

        <Button
          onClick={() => type === 'completed' ? handleViewCompletedShift(shift.id) : handleViewShift(shift.id)}
          variant="outline"
          size="sm"
          className="w-full h-8 sm:h-9 text-xs sm:text-sm"
        >
          View {type === 'completed' ? 'Receipt' : 'Details'}
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
                <p className="text-sm text-gray-500 mt-1">Track your shifts & availability</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setShowBulkDialog(true)} className="gap-2">
                  <Layers className="w-4 h-4" />
                  Multiple Days
                </Button>
                <Button variant="outline" onClick={() => setShowRecurringDialog(true)} className="gap-2">
                  <Repeat className="w-4 h-4" />
                  Recurring
                </Button>
                <Button onClick={handleAddAvailability} className="gap-2 bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4" />
                  Add Availability
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <PlayCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{activeShifts.length}</p>
                <p className="text-xs text-gray-500">Active Today</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{upcomingShifts.length}</p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{completedShifts.length}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <CalendarIcon className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{futureAvailability.length}</p>
                <p className="text-xs text-gray-500">Available Days</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Calendar */}
            <div className="col-span-8">
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <CalendarView
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    availability={futureAvailability}
                    acceptedShifts={myShifts.filter(s => s.status === 'filled' || s.status === 'open')}
                    pendingApplications={pendingApplications}
                    cancelledShifts={cancelledShifts}
                    onDayClick={handleDayClick}
                    maxDaysAhead={MAX_DAYS_AHEAD}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-4 space-y-4">
              {/* Upcoming Shifts */}
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    Upcoming Shifts
                  </h3>
                  {upcomingShifts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No upcoming shifts</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {upcomingShifts.slice(0, 5).map(shift => (
                        <div key={shift.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100" onClick={() => handleViewShift(shift.id)}>
                          <p className="font-medium text-sm text-gray-900">{shift.pharmacy_name}</p>
                          <p className="text-xs text-gray-600">{shift.shift_dates?.[0]?.date ? format(new Date(shift.shift_dates[0].date.split('-').map(Number).reduce((d, v, i) => i === 0 ? new Date(v, 0, 1) : i === 1 ? new Date(d.getFullYear(), v - 1, 1) : new Date(d.getFullYear(), d.getMonth(), v), new Date())), "MMM d") : 'TBD'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Availability List */}
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Your Availability
                  </h3>
                  {futureAvailability.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No availability set</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {futureAvailability.slice(0, 5).map(avail => (
                        <div key={avail.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{format(new Date(avail.date), "EEE, MMM d")}</p>
                            <p className="text-xs text-gray-600">{formatTime12Hour(avail.start_time)} - {formatTime12Hour(avail.end_time)}</p>
                          </div>
                          <button onClick={() => handleDeleteAvailability(avail.id)} className="p-1.5 hover:bg-red-100 rounded">
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white px-3 sm:px-4 pt-3 sm:pt-4 pb-5 sm:pb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1">Shift Management</h1>
            <p className="text-xs sm:text-sm text-teal-100">Track your shifts & availability</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 text-center border border-white/20">
            <p className="text-xl sm:text-2xl font-bold">{activeShifts.length}</p>
            <p className="text-[10px] sm:text-xs text-teal-100">Active</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 text-center border border-white/20">
            <p className="text-xl sm:text-2xl font-bold">{upcomingShifts.length}</p>
            <p className="text-[10px] sm:text-xs text-teal-100">Upcoming</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 text-center border border-white/20">
            <p className="text-xl sm:text-2xl font-bold">{completedShifts.length}</p>
            <p className="text-[10px] sm:text-xs text-teal-100">Completed</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2 sm:p-3 text-center border border-white/20">
            <p className="text-xl sm:text-2xl font-bold">{futureAvailability.length}</p>
            <p className="text-[10px] sm:text-xs text-teal-100">Available</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 sm:px-4 -mt-3 mb-3 sm:mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-md grid grid-cols-6 border border-gray-200 h-auto">
            <TabsTrigger value="calendar" className="flex-1 text-[10px] sm:text-xs py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1 text-[10px] sm:text-xs py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              Active
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1 text-[10px] sm:text-xs py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 text-[10px] sm:text-xs py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              Done
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1 text-[10px] sm:text-xs py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Ban className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              Cancelled
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex-1 text-[10px] sm:text-xs py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Layers className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-3 sm:px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-3 mt-0">
            <CalendarView
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              availability={futureAvailability}
              acceptedShifts={myShifts.filter(s => s.status === 'filled' || s.status === 'open')}
              pendingApplications={pendingApplications}
              cancelledShifts={cancelledShifts}
              onDayClick={handleDayClick}
              maxDaysAhead={MAX_DAYS_AHEAD}
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowBulkDialog(true)}
                variant="outline"
                className="h-10 text-xs border-2 border-indigo-200 hover:bg-indigo-50"
              >
                <Layers className="w-4 h-4 mr-2" />
                Multiple Days
              </Button>
              <Button
                onClick={() => setShowRecurringDialog(true)}
                variant="outline"
                className="h-10 text-xs border-2 border-indigo-200 hover:bg-indigo-50"
              >
                <Repeat className="w-4 h-4 mr-2" />
                Recurring
              </Button>
            </div>

            {/* Weekly Summary */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-3">
                <h4 className="text-sm font-bold text-gray-900 mb-2">This Week Summary</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-emerald-600">
                      {futureAvailability.filter(a => {
                        const date = new Date(a.date);
                        const weekStart = startOfWeek(new Date());
                        const weekEnd = endOfWeek(new Date());
                        return date >= weekStart && date <= weekEnd;
                      }).length}
                    </p>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-600">
                      {myShifts.filter(s => {
                        const primaryDate = s.shift_dates?.[0]?.date;
                        if (!primaryDate) return false;
                        const [year, month, day] = primaryDate.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        const weekStart = startOfWeek(new Date());
                        const weekEnd = endOfWeek(new Date());
                        return date >= weekStart && date <= weekEnd;
                      }).length}
                    </p>
                    <p className="text-xs text-gray-600">Booked</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-yellow-600">
                      {pendingApplications.filter(a => {
                        if (!a.shift?.shift_dates?.[0]?.date) return false;
                        const [year, month, day] = a.shift.shift_dates[0].date.split('-').map(Number);
                        const date = new Date(year, month - 1, day);
                        const weekStart = startOfWeek(new Date());
                        const weekEnd = endOfWeek(new Date());
                        return date >= weekStart && date <= weekEnd;
                      }).length}
                    </p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Shifts */}
          <TabsContent value="active" className="space-y-2.5 sm:space-y-3 mt-0">
            {activeShifts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Active Shifts</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  You don't have any shifts happening today
                </p>
              </div>
            ) : (
              activeShifts.map(shift => renderShiftCard(shift, 'active'))
            )}
          </TabsContent>

          {/* Upcoming Shifts */}
          <TabsContent value="upcoming" className="space-y-2.5 sm:space-y-3 mt-0">
            {upcomingShifts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Upcoming Shifts</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Your upcoming confirmed shifts will appear here
                </p>
              </div>
            ) : (
              upcomingShifts.map(shift => renderShiftCard(shift, 'upcoming'))
            )}
          </TabsContent>

          {/* Completed Shifts */}
          <TabsContent value="completed" className="space-y-2.5 sm:space-y-3 mt-0">
            {completedShifts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Completed Shifts</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Your shift history will appear here
                </p>
              </div>
            ) : (
              completedShifts.map(shift => renderShiftCard(shift, 'completed'))
            )}
          </TabsContent>

          {/* Cancelled Shifts */}
          <TabsContent value="cancelled" className="space-y-2.5 sm:space-y-3 mt-0">
            {cancelledShifts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Ban className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Cancelled Shifts</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Cancelled shifts will appear here
                </p>
              </div>
            ) : (
              cancelledShifts.map(cancellation => (
                <Card key={cancellation.id} className="hover:shadow-lg transition-shadow border-gray-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1 truncate">
                          {cancellation.pharmacy_name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{format(new Date(cancellation.shift_date), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          cancellation.status === 'charged' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-teal-50 text-teal-700 border-teal-200'
                        } font-semibold text-xs flex-shrink-0`}
                      >
                        {cancellation.status}
                      </Badge>
                    </div>

                    <div className={`rounded-lg p-2 sm:p-3 border ${
                      cancellation.penalty_total === 0 
                        ? 'bg-teal-50 border-teal-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Penalty:</span>
                        <span className={`text-base sm:text-xl font-bold ${
                          cancellation.penalty_total === 0 ? 'text-teal-600' : 'text-red-600'
                        }`}>
                          ${cancellation.penalty_total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Availability */}
          <TabsContent value="availability" className="space-y-2.5 sm:space-y-3 mt-0">
            <Button
              onClick={handleAddAvailability}
              className="w-full h-10 sm:h-11 bg-indigo-600 hover:bg-indigo-700 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Availability
            </Button>

            {futureAvailability.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CalendarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Availability Set</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Add your availability to let employers know when you're free
                </p>
              </div>
            ) : (
              futureAvailability
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((avail) => (
                  <Card key={avail.id} className="border-gray-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                            {format(new Date(avail.date), "EEEE, MMM d, yyyy")}
                          </p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-1">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600" />
                            <span>
                              {formatTime12Hour(avail.start_time)} - {formatTime12Hour(avail.end_time)}
                            </span>
                          </div>
                          {avail.notes && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{avail.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={() => handleEditAvailability(avail)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center transition-colors"
                          >
                            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteAvailability(avail.id)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-700" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      </div>

      {/* Add/Edit Availability Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingAvailability ? "Edit Availability" : "Add Availability"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="date" className="text-xs sm:text-sm font-medium mb-2 block">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={availabilityForm.date}
                min={format(new Date(), "yyyy-MM-dd")}
                max={format(addDays(new Date(), MAX_DAYS_AHEAD), "yyyy-MM-dd")}
                onChange={(e) => setAvailabilityForm({ ...availabilityForm, date: e.target.value })}
                className="h-10 sm:h-11 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available up to {MAX_DAYS_AHEAD} days ahead
              </p>
            </div>

            {/* Quick Templates */}
            <AvailabilityTemplates onSelectTemplate={handleTemplateSelect} />

            <div>
              <Label htmlFor="start_time" className="text-xs sm:text-sm font-medium mb-2 block">
                Start Time
              </Label>
              <Input
                id="start_time"
                type="time"
                value={availabilityForm.start_time}
                onChange={(e) => setAvailabilityForm({ ...availabilityForm, start_time: e.target.value })}
                className="h-10 sm:h-11 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="end_time" className="text-xs sm:text-sm font-medium mb-2 block">
                End Time
              </Label>
              <Input
                id="end_time"
                type="time"
                value={availabilityForm.end_time}
                onChange={(e) => setAvailabilityForm({ ...availabilityForm, end_time: e.target.value })}
                className="h-10 sm:h-11 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-xs sm:text-sm font-medium mb-2 block">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g., Prefer morning shifts"
                value={availabilityForm.notes}
                onChange={(e) => setAvailabilityForm({ ...availabilityForm, notes: e.target.value })}
                className="min-h-[70px] text-sm"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingAvailability(null);
              }}
              type="button"
              className="text-sm h-9 sm:h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAvailability}
              className="bg-indigo-600 hover:bg-indigo-700 text-sm h-9 sm:h-10"
              disabled={createAvailabilityMutation.isPending || updateAvailabilityMutation.isPending}
              type="button"
            >
              {createAvailabilityMutation.isPending || updateAvailabilityMutation.isPending ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {editingAvailability ? "Update" : "Add"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Availability Dialog */}
      <BulkAvailabilityDialog
        open={showBulkDialog}
        onClose={() => setShowBulkDialog(false)}
        onSave={handleBulkSave}
        maxDaysAhead={MAX_DAYS_AHEAD}
      />

      {/* Recurring Pattern Dialog */}
      <RecurringPatternDialog
        open={showRecurringDialog}
        onClose={() => setShowRecurringDialog(false)}
        onSave={handleBulkSave}
        maxDaysAhead={MAX_DAYS_AHEAD}
      />

      {/* Conflict Warning Dialog */}
      <Dialog open={showConflictWarning} onOpenChange={setShowConflictWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Scheduling Conflict
            </DialogTitle>
            <DialogDescription>
              You already have an accepted shift on this date. Do you still want to add availability?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm font-medium text-amber-900 mb-1">
              {conflictData && format(new Date(conflictData.date), "EEEE, MMM d, yyyy")}
            </p>
            <p className="text-xs text-amber-700">
              Availability: {conflictData?.start_time} - {conflictData?.end_time}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConflictWarning(false);
                setConflictData(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConflictWarning(false);
                saveAvailability();
                setConflictData(null);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Add Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MySchedule() {
  return (
    <PharmacistOnly>
      <MyScheduleContent />
    </PharmacistOnly>
  );
}