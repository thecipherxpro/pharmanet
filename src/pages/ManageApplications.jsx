import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, DollarSign, GitCompare, RefreshCw, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { EmployerOnly } from "../components/auth/RouteProtection";
import { useToast } from "@/components/ui/use-toast";
import ApplicationCard from "../components/applications/ApplicationCard";
import ApplicationDetailsModal from "../components/applications/ApplicationDetailsModal";
import AcceptConfirmationModal from "../components/applications/AcceptConfirmationModal";
import CompareApplicantsModal from "../components/applications/CompareApplicantsModal";
import PaymentCardGate from "../components/wallet/PaymentCardGate";
import EmptyState from "../components/shared/EmptyState";
import OnboardingGate from "../components/onboarding/OnboardingGate";
import BulkActionsBar from "../components/applications/BulkActionsBar";
import { Checkbox } from "@/components/ui/checkbox";
import SearchWithHistory from "../components/shared/SearchWithHistory";

function ManageApplicationsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showAcceptanceSuccessModal, setShowAcceptanceSuccessModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [acceptingApp, setAcceptingApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPaymentCard, setHasPaymentCard] = useState(false);
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    professional: true,
    shift: true,
    payroll: false,
    message: true
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: myShifts = [], refetch: refetchShifts } = useQuery({
    queryKey: ['myShiftsForApps', user?.email],
    queryFn: async () => {
      const res = await base44.entities.Shift.filter({ created_by: user?.email });
      return res || [];
    },
    enabled: !!user,
    initialData: [],
  });

  const shiftIds = (myShifts || []).map(s => s.id);

  const { data: allApplications = [], isLoading, refetch: refetchApps } = useQuery({
    queryKey: ['allApplications', user?.email],
    queryFn: async () => {
      const allApps = await base44.entities.ShiftApplication.list("-applied_date");
      return (allApps || []).filter(app => shiftIds.includes(app.shift_id));
    },
    enabled: shiftIds.length > 0,
    initialData: [],
  });

  const { data: applicantProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['applicantProfiles', allApplications],
    queryFn: async () => {
      const uniqueEmails = [...new Set(allApplications.map(app => app.pharmacist_email))];
      const profilePromises = uniqueEmails.map(email =>
        base44.functions.invoke('getPharmacistPublicProfile', { pharmacistEmail: email })
          .then(response => response.data)
          .catch(err => null)
      );
      const profiles = await Promise.all(profilePromises);
      return profiles.filter(p => p !== null);
    },
    enabled: allApplications.length > 0,
    initialData: [],
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchShifts(), refetchApps()]);
    setIsRefreshing(false);
    toast({
      title: "✓ Refreshed",
      description: "Applications updated",
      duration: 2000
    });
  };

  const acceptMutation = useMutation({
    mutationFn: async ({ appId, shiftId, pharmacistEmail, pharmacistName, pharmacistId }) => {
      const feeResponse = await base44.functions.invoke('chargeEmployerForAcceptanceV2', {
        shift_id: shiftId,
        pharmacist_id: pharmacistId,
        pharmacist_name: pharmacistName
      });

      if (!feeResponse.data.success) {
        throw new Error(feeResponse.data.error || 'Failed to process acceptance fee');
      }

      await base44.entities.ShiftApplication.update(appId, { status: "accepted" });

      // Grant employer access to pharmacist's payroll preference
      const payrollPrefs = await base44.entities.PayrollPreference.filter({ user_id: pharmacistId });
      if (payrollPrefs.length > 0) {
        await base44.entities.PayrollPreference.update(payrollPrefs[0].id, {
          employer_email: user.email
        });
      }
      
      const shifts = await base44.entities.Shift.filter({ id: shiftId });
      const shift = shifts[0];

      // Update shift status - handle multi-date by updating first open date
      if (shift.is_multi_date && shift.shift_dates) {
        const updatedDates = shift.shift_dates.map((d, idx) => 
          idx === 0 && d.status === 'open' ? { ...d, status: 'filled', assigned_to: pharmacistEmail } : d
        );
        await base44.entities.Shift.update(shiftId, {
          shift_dates: updatedDates,
          status: updatedDates.every(d => d.status !== 'open') ? 'filled' : 'open'
        });
      } else {
        await base44.entities.Shift.update(shiftId, {
          status: "filled",
          assigned_to: pharmacistEmail
        });
      }

      const otherApps = allApplications.filter(
        a => a.shift_id === shiftId && a.id !== appId && a.status === "pending"
      );
      
      await Promise.all(
        otherApps.map(async (app) => {
          await base44.entities.ShiftApplication.update(app.id, { status: "rejected" });
          await base44.functions.invoke('sendShiftNotification', {
            notification_type: 'application_rejected',
            shift_data: { shift_date: shift.shift_date, pharmacy_name: shift.pharmacy_name },
            recipient_email: app.pharmacist_email
          }).catch(err => console.error('Failed to send rejection email:', err));
        })
      );

      const acceptShiftDate = shift.is_multi_date && shift.shift_dates?.[0]
        ? shift.shift_dates[0].date
        : shift.shift_date;
      const acceptStartTime = shift.is_multi_date && shift.shift_dates?.[0]
        ? shift.shift_dates[0].start_time
        : shift.start_time;
      const acceptEndTime = shift.is_multi_date && shift.shift_dates?.[0]
        ? shift.shift_dates[0].end_time
        : shift.end_time;
      const acceptHourlyRate = shift.is_multi_date && shift.shift_dates?.[0]
        ? shift.shift_dates[0].hourly_rate
        : shift.hourly_rate;

      await base44.functions.invoke('sendShiftNotification', {
        notification_type: 'application_accepted',
        shift_data: {
          shift_date: acceptShiftDate,
          start_time: acceptStartTime,
          end_time: acceptEndTime,
          pharmacy_name: shift.pharmacy_name,
          pharmacy_city: shift.pharmacy_city,
          pharmacy_address: shift.pharmacy_address,
          pharmacy_software: shift.pharmacy_software?.[0] || 'N/A',
          hourly_rate: acceptHourlyRate
        },
        recipient_email: pharmacistEmail
      }).catch(err => console.error('Failed to send acceptance email:', err));

      const notifShiftDate = shift.is_multi_date && shift.shift_dates?.[0] 
        ? shift.shift_dates[0].date 
        : shift.shift_date;
      const notifStartTime = shift.is_multi_date && shift.shift_dates?.[0]
        ? shift.shift_dates[0].start_time
        : shift.start_time;
      const notifEndTime = shift.is_multi_date && shift.shift_dates?.[0]
        ? shift.shift_dates[0].end_time
        : shift.end_time;

      await base44.functions.invoke('sendShiftNotification', {
        notification_type: 'shift_filled',
        shift_data: {
          shift_date: notifShiftDate,
          start_time: notifStartTime,
          end_time: notifEndTime,
          pharmacy_name: shift.pharmacy_name,
          assigned_pharmacist: pharmacistName
        },
        recipient_email: user.email
      }).catch(err => console.error('Failed to send filled email:', err));

      return feeResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allApplications'] });
      queryClient.invalidateQueries({ queryKey: ['myShiftsForApps'] });
      queryClient.invalidateQueries({ queryKey: ['employerShifts'] });
      
      toast({
        title: "✓ Application Accepted",
        description: "Pharmacist assigned - $50 fee charged to your card.",
        duration: 5000
      });
      
      setShowDetails(false);
      setShowAcceptModal(false);
      setShowAcceptanceSuccessModal(true);
      setAcceptingApp(null);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.error || error.message || 'Failed to accept application';
      
      if (error?.response?.status === 402 || errorMsg.toLowerCase().includes('payment')) {
        toast({
          variant: "destructive",
          title: "Payment Required",
          description: errorMsg + " Please add a payment card in your wallet.",
          duration: 5000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMsg,
        });
      }
      
      setAcceptingApp(null);
      setShowAcceptModal(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ appId, pharmacistEmail, shiftId }) => {
      await base44.entities.ShiftApplication.update(appId, { status: "rejected" });
      
      const shifts = await base44.entities.Shift.filter({ id: shiftId });
      const shift = shifts[0];

      await base44.functions.invoke('sendShiftNotification', {
        notification_type: 'application_rejected',
        shift_data: { shift_date: shift.shift_date, pharmacy_name: shift.pharmacy_name },
        recipient_email: pharmacistEmail
      }).catch(err => console.error('Failed to send rejection email:', err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allApplications'] });
      setShowDetails(false);
      toast({
        title: "✓ Application Rejected",
        description: "The pharmacist has been notified.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject application",
      });
    }
  });

  const pendingApps = allApplications.filter(a => a.status === "pending");
  const acceptedApps = allApplications.filter(a => a.status === "accepted");
  const rejectedApps = allApplications.filter(a => a.status === "rejected");

  const filteredApps = (activeTab === "pending" ? pendingApps :
                       activeTab === "accepted" ? acceptedApps :
                       rejectedApps).filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return app.pharmacist_name.toLowerCase().includes(query) ||
           app.pharmacist_email.toLowerCase().includes(query);
  });

  const getShiftForApp = (appId) => {
    const app = allApplications.find(a => a.id === appId);
    return myShifts.find(s => s.id === app?.shift_id);
  };

  const getApplicantProfile = (email) => {
    return applicantProfiles.find(p => p.email === email);
  };

  const toggleSelectApp = (appId) => {
    setSelectedApps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedApps.size === filteredApps.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(filteredApps.map(app => app.id)));
    }
  };

  const handleAccept = (app) => {
    if (!hasPaymentCard) {
      toast({
        variant: "destructive",
        title: "Payment Card Required",
        description: "Please add a payment card before accepting applications.",
      });
      return;
    }
    
    const shift = getShiftForApp(app.id);
    if (!shift) return;
    
    setAcceptingApp(app);
    setShowAcceptModal(true);
  };

  const handleBulkAccept = async () => {
    if (!hasPaymentCard || selectedApps.size === 0) return;
    
    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const appId of selectedApps) {
      const app = allApplications.find(a => a.id === appId);
      if (!app) continue;

      const shift = getShiftForApp(app.id);
      const profile = getApplicantProfile(app.pharmacist_email);

      try {
        await acceptMutation.mutateAsync({
          appId: app.id,
          shiftId: shift.id,
          pharmacistEmail: app.pharmacist_email,
          pharmacistName: app.pharmacist_name,
          pharmacistId: profile?.id
        });
        successCount++;
      } catch (error) {
        failCount++;
        console.error('Failed to accept application:', error);
      }
    }

    setIsBulkProcessing(false);
    setSelectedApps(new Set());

    toast({
      title: successCount > 0 ? "✓ Applications Processed" : "Error",
      description: `${successCount} accepted${failCount > 0 ? `, ${failCount} failed` : ''}`,
      variant: failCount > 0 ? "destructive" : "default"
    });
  };

  const handleBulkReject = async () => {
    if (selectedApps.size === 0) return;

    setIsBulkProcessing(true);
    let successCount = 0;

    for (const appId of selectedApps) {
      const app = allApplications.find(a => a.id === appId);
      if (!app) continue;

      const shift = getShiftForApp(app.id);

      try {
        await rejectMutation.mutateAsync({
          appId: app.id,
          pharmacistEmail: app.pharmacist_email,
          shiftId: shift.id
        });
        successCount++;
      } catch (error) {
        console.error('Failed to reject application:', error);
      }
    }

    setIsBulkProcessing(false);
    setSelectedApps(new Set());

    toast({
      title: "✓ Applications Rejected",
      description: `${successCount} application${successCount !== 1 ? 's' : ''} rejected`,
    });
  };

  const confirmAccept = () => {
    if (!acceptingApp) return;
    
    const shift = getShiftForApp(acceptingApp.id);
    const profile = getApplicantProfile(acceptingApp.pharmacist_email);
    
    acceptMutation.mutate({
      appId: acceptingApp.id,
      shiftId: shift.id,
      pharmacistEmail: acceptingApp.pharmacist_email,
      pharmacistName: acceptingApp.pharmacist_name,
      pharmacistId: profile?.id
    });
  };

  const handleReject = (app) => {
    const shift = getShiftForApp(app.id);
    rejectMutation.mutate({
      appId: app.id,
      pharmacistEmail: app.pharmacist_email,
      shiftId: shift.id
    });
  };

  const handleViewFullProfile = (email) => {
    const profile = applicantProfiles.find(p => p.email === email);
    if (profile) {
      navigate(createPageUrl("PublicProfile") + `?id=${profile.id}`);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getInitials = (name) => {
    if (!name) return "P";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  if (isLoading || profilesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 pt-5 pb-6">
          <Skeleton className="h-8 w-48 bg-white/20 mb-2" />
          <Skeleton className="h-4 w-64 bg-white/20" />
        </div>
        <div className="px-3 pt-4 space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Show payment card gate if no card
  if (!hasPaymentCard) {
    return (
      <PaymentCardGate 
        userType="employer"
        actionType="accept"
        onHasCard={setHasPaymentCard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
                <p className="text-sm text-gray-500 mt-1">Review & manage pharmacist applications</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-10"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                {pendingApps.length > 1 && (
                  <Button
                    onClick={() => setShowCompareModal(true)}
                    variant="outline"
                    className="h-10"
                  >
                    <GitCompare className="w-4 h-4 mr-2" />
                    Compare
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("pending")}>
              <p className="text-3xl font-bold text-gray-900">{pendingApps.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Pending</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("accepted")}>
              <p className="text-3xl font-bold text-green-600">{acceptedApps.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Accepted</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("rejected")}>
              <p className="text-3xl font-bold text-gray-900">{rejectedApps.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Rejected</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-3xl font-bold text-gray-900">{allApplications.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Total</p>
            </div>
          </div>

          {/* Desktop Tabs & Content */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {["pending", "accepted", "rejected"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    activeTab === tab
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === "pending" && pendingApps.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {pendingApps.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4">
              {filteredApps.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No {activeTab} applications</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredApps.map(app => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      shift={getShiftForApp(app.id)}
                      profile={getApplicantProfile(app.pharmacist_email)}
                      onViewDetails={() => {
                        setSelectedApp(app);
                        setShowDetails(true);
                      }}
                      onAccept={() => handleAccept(app)}
                      onViewProfile={() => handleViewFullProfile(app.pharmacist_email)}
                      isAccepting={acceptMutation.isPending && acceptingApp?.id === app.id}
                      getInitials={getInitials}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Modern Teal Header */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 text-white px-3 pt-4 pb-6 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">Applications</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-[10px] text-white/80 mb-4 font-medium">Review & manage pharmacist applications</p>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 text-center border border-white/30 shadow-sm">
            <p className="text-2xl font-bold leading-none mb-1">{pendingApps.length}</p>
            <p className="text-[9px] text-white/90 font-semibold uppercase tracking-wide">Pending</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 text-center border border-white/30 shadow-sm">
            <p className="text-2xl font-bold leading-none mb-1">{acceptedApps.length}</p>
            <p className="text-[9px] text-white/90 font-semibold uppercase tracking-wide">Accepted</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-2.5 text-center border border-white/30 shadow-sm">
            <p className="text-2xl font-bold leading-none mb-1">{allApplications.length}</p>
            <p className="text-[9px] text-white/90 font-semibold uppercase tracking-wide">Total</p>
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="px-3 -mt-3 mb-3">
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <SearchWithHistory
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name or email..."
              className="bg-white shadow-sm h-10 text-sm border-gray-300 focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
          {pendingApps.length > 1 && (
            <Button
              onClick={() => setShowCompareModal(true)}
              variant="outline"
              size="sm"
              className="bg-white shadow-sm h-10 px-3 border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 font-semibold"
            >
              <GitCompare className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Bulk Selection Controls */}
        {activeTab === "pending" && filteredApps.length > 0 && (
          <div className="flex items-center gap-3 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
            <Checkbox
              checked={selectedApps.size === filteredApps.length && filteredApps.length > 0}
              onCheckedChange={toggleSelectAll}
              className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
            />
            <span className="text-xs font-medium text-gray-700">
              {selectedApps.size > 0 
                ? `${selectedApps.size} selected` 
                : `Select all (${filteredApps.length})`}
            </span>
          </div>
        )}
      </div>

      {/* Modern Tabs */}
      <div className="px-3 mb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-md grid grid-cols-3 h-auto border border-gray-200 rounded-xl">
            <TabsTrigger value="pending" className="text-[10px] py-2.5 font-bold data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-l-xl">
              Pending
              {pendingApps.length > 0 && (
                <Badge className="ml-1 bg-blue-600 text-white text-[9px] px-1.5 h-4 rounded-full">
                  {pendingApps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-[10px] py-2.5 font-bold data-[state=active]:bg-teal-600 data-[state=active]:text-white border-x border-gray-200">
              Accepted
              {acceptedApps.length > 0 && (
                <Badge className="ml-1 bg-green-600 text-white text-[9px] px-1.5 h-4 rounded-full">
                  {acceptedApps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-[10px] py-2.5 font-bold data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-r-xl">
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Applications List */}
      <div className="px-3 space-y-2.5">
        {filteredApps.length === 0 ? (
          <EmptyState
            icon={User}
            title={searchQuery ? 'No Results Found' : `No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Applications`}
            description={
              searchQuery 
                ? 'Try adjusting your search terms to find applications.'
                : activeTab === "pending"
                ? "When pharmacists apply to your shifts, their applications will appear here for review."
                : activeTab === "accepted"
                ? "Accepted applications will appear here once you approve pharmacists."
                : "Rejected applications will be shown here."
            }
            actionLabel={!searchQuery && activeTab === "pending" ? "View My Shifts" : searchQuery ? "Clear Search" : undefined}
            onAction={!searchQuery && activeTab === "pending" ? () => navigate(createPageUrl("MyShifts")) : searchQuery ? () => setSearchQuery("") : undefined}
          />
        ) : (
          filteredApps.map(app => (
            <div key={app.id} className="flex items-start gap-2">
              {activeTab === "pending" && (
                <Checkbox
                  checked={selectedApps.has(app.id)}
                  onCheckedChange={() => toggleSelectApp(app.id)}
                  className="mt-4 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
              )}
              <div className="flex-1">
                <ApplicationCard
                  app={app}
                  shift={getShiftForApp(app.id)}
                  profile={getApplicantProfile(app.pharmacist_email)}
                  onViewDetails={() => {
                    setSelectedApp(app);
                    setShowDetails(true);
                  }}
                  onAccept={() => handleAccept(app)}
                  onViewProfile={() => handleViewFullProfile(app.pharmacist_email)}
                  isAccepting={acceptMutation.isPending && acceptingApp?.id === app.id}
                  getInitials={getInitials}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Application Details Modal */}
      <ApplicationDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        selectedApp={selectedApp}
        shift={selectedApp ? getShiftForApp(selectedApp.id) : null}
        profile={selectedApp ? getApplicantProfile(selectedApp.pharmacist_email) : null}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
        onViewFullProfile={handleViewFullProfile}
        onAccept={() => handleAccept(selectedApp)}
        onReject={() => handleReject(selectedApp)}
        isAccepting={acceptMutation.isPending && acceptingApp?.id === selectedApp?.id}
        isRejecting={rejectMutation.isPending}
        getInitials={getInitials}
      />

      {/* Accept Confirmation Modal */}
      <AcceptConfirmationModal
        open={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setAcceptingApp(null);
        }}
        onConfirm={confirmAccept}
        isAccepting={acceptMutation.isPending}
        pharmacistName={acceptingApp?.pharmacist_name}
        shift={acceptingApp ? getShiftForApp(acceptingApp.id) : null}
      />

      {/* Acceptance Success Modal */}
      <Dialog open={showAcceptanceSuccessModal} onOpenChange={setShowAcceptanceSuccessModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              🎉 Pharmacist Confirmed!
            </DialogTitle>
            <DialogDescription className="text-center pt-2 text-sm text-gray-600">
              Successfully assigned to your shift
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full flex items-center justify-center shadow-md">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Platform Fee</p>
                  <p className="text-[10px] text-teal-700 font-medium">Charged to your account</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-teal-900 text-center">$50.00</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-[10px] text-gray-700 leading-relaxed">
                View this charge in your <span className="font-bold text-teal-600">Wallet → Transactions</span> tab.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowAcceptanceSuccessModal(false)}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 h-11 font-bold shadow-md"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedApps.size}
        onAcceptSelected={handleBulkAccept}
        onRejectSelected={handleBulkReject}
        onClearSelection={() => setSelectedApps(new Set())}
        isProcessing={isBulkProcessing}
      />

      {/* Compare Modal */}
      <CompareApplicantsModal
        open={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        applications={pendingApps}
        profiles={applicantProfiles}
        onSelectApplicant={(app) => {
          setShowCompareModal(false);
          setSelectedApp(app);
          setShowDetails(true);
        }}
        getInitials={getInitials}
      />
      </div>
    </div>
  );
}

export default function ManageApplications() {
  return (
    <EmployerOnly>
      <OnboardingGate userType="employer" minimumCompletion={80}>
        <ManageApplicationsContent />
      </OnboardingGate>
    </EmployerOnly>
  );
}