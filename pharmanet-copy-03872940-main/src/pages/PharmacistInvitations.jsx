import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  RefreshCw,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { useToast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { formatTime12Hour, parseLocalDate } from "../components/utils/timeUtils";
import { getScheduleFromShift } from "../components/utils/shiftUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

function PharmacistInvitationsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  const { data: allInvitations = [], isLoading, refetch } = useQuery({
    queryKey: ['allInvitations', user?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('getPharmacistInvitations', {
        pharmacistEmail: user.email
      });
      return response.data.invitations || [];
    },
    enabled: !!user,
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId) => {
      const response = await base44.functions.invoke('acceptShiftInvitation', {
        invitationId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['mySchedule'] });
      setShowAcceptModal(false);
      setSelectedInvitation(null);
      toast({
        title: "✓ Invitation Accepted",
        description: "You've been assigned to this shift!",
      });
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.error || error.message || 'Failed to accept invitation';
      toast({
        variant: "destructive",
        title: "Acceptance Failed",
        description: errorMsg,
        duration: 5000,
      });
    }
  });

  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId) => {
      const response = await base44.functions.invoke('declineShiftInvitation', {
        invitationId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allInvitations'] });
      setShowDeclineModal(false);
      setSelectedInvitation(null);
      toast({
        title: "Invitation Declined",
        description: "The employer has been notified.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to decline invitation",
      });
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Invitations updated",
    });
  };

  const pendingInvites = allInvitations.filter(inv => inv.invitation.status === 'pending');
  const acceptedInvites = allInvitations.filter(inv => inv.invitation.status === 'accepted');
  const declinedInvites = allInvitations.filter(inv => inv.invitation.status === 'declined');
  const expiredInvites = allInvitations.filter(inv => 
    inv.invitation.status === 'expired' || inv.invitation.status === 'cancelled'
  );

  const currentInvitations = 
    activeTab === 'pending' ? pendingInvites :
    activeTab === 'accepted' ? acceptedInvites :
    activeTab === 'declined' ? declinedInvites :
    expiredInvites;

  const getExpiryInfo = (invitation) => {
    if (!invitation.expires_at) return null;
    
    const expiryDate = parseLocalDate(invitation.expires_at);
    if (!expiryDate || isNaN(expiryDate.getTime())) return null;
    
    const now = new Date();
    const daysLeft = differenceInDays(expiryDate, now);
    
    if (daysLeft < 0) return { text: 'Expired', color: 'text-red-600', bgColor: 'bg-red-50', urgent: true };
    if (daysLeft === 0) return { text: 'Expires today', color: 'text-red-600', bgColor: 'bg-red-50', urgent: true };
    if (daysLeft === 1) return { text: 'Expires tomorrow', color: 'text-amber-600', bgColor: 'bg-amber-50', urgent: true };
    if (daysLeft <= 3) return { text: `${daysLeft} days left`, color: 'text-amber-600', bgColor: 'bg-amber-50', urgent: false };
    
    return { text: `${daysLeft} days left`, color: 'text-gray-600', bgColor: 'bg-gray-50', urgent: false };
  };

  // Safe date formatting helper
  const safeFormatDate = (dateValue, formatStr = 'EEEE, MMM d, yyyy') => {
    if (!dateValue) return 'Date not set';
    const parsed = parseLocalDate(dateValue);
    if (!parsed || isNaN(parsed.getTime())) return 'Date not set';
    try {
      return format(parsed, formatStr);
    } catch {
      return 'Date not set';
    }
  };

  const safeFormatDistanceToNow = (dateValue) => {
    if (!dateValue) return 'recently';
    const parsed = parseLocalDate(dateValue);
    if (!parsed || isNaN(parsed.getTime())) return 'recently';
    try {
      return formatDistanceToNow(parsed, { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-orange-600 to-amber-600 p-4 pt-5 pb-6">
          <div className="h-7 w-40 bg-white/20 rounded mb-2 animate-pulse" />
          <div className="h-4 w-48 bg-white/20 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-2.5 border border-white/20">
                <div className="h-6 w-8 bg-white/20 rounded mx-auto mb-1 animate-pulse" />
                <div className="h-3 w-12 bg-white/20 rounded mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Tabs Skeleton */}
        <div className="px-3 -mt-3 mb-3">
          <div className="h-10 bg-white rounded-lg shadow-lg animate-pulse" />
        </div>
        {/* Cards Skeleton */}
        <div className="px-3 space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border-2 border-orange-200 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-20 bg-orange-200 rounded-full animate-pulse" />
                <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-36 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-11 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1 h-11 bg-orange-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
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
                <h1 className="text-2xl font-bold text-gray-900">My Invitations</h1>
                <p className="text-sm text-gray-500 mt-1">Direct invitations from employers</p>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="border border-gray-200 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("pending")}>
              <CardContent className="p-4 text-center">
                <Mail className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{pendingInvites.length}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("accepted")}>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{acceptedInvites.length}</p>
                <p className="text-xs text-gray-500">Accepted</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("declined")}>
              <CardContent className="p-4 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{declinedInvites.length}</p>
                <p className="text-xs text-gray-500">Declined</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("expired")}>
              <CardContent className="p-4 text-center">
                <AlertCircle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{expiredInvites.length}</p>
                <p className="text-xs text-gray-500">Expired</p>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Tabs & Content */}
          <Card className="border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="pending" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                    Pending {pendingInvites.length > 0 && `(${pendingInvites.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="accepted" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                    Accepted
                  </TabsTrigger>
                  <TabsTrigger value="declined" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                    Declined
                  </TabsTrigger>
                  <TabsTrigger value="expired" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                    Expired
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="p-4">
              {currentInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No {activeTab} invitations</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentInvitations.map(invitationItem => {
                    const { invitation, shift } = invitationItem;
                    if (!shift) return null;
                    const expiryInfo = invitation.status === 'pending' ? getExpiryInfo(invitation) : null;
                    const schedule = getScheduleFromShift(shift);
                    const primaryDate = schedule[0] || {};
                    
                    return (
                      <Card key={invitation.id} className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`${
                              invitation.status === 'pending' ? 'bg-amber-500' :
                              invitation.status === 'accepted' ? 'bg-green-500' :
                              invitation.status === 'declined' ? 'bg-red-500' :
                              'bg-gray-500'
                            } text-white border-0 text-xs`}>
                              {invitation.status}
                            </Badge>
                            {expiryInfo && (
                              <Badge variant="outline" className={`${expiryInfo.color} text-xs`}>
                                {expiryInfo.text}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 mb-1">{shift.pharmacy_name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{shift.pharmacy_city}</p>
                          <div className="text-sm mb-3">
                            <p>{safeFormatDate(primaryDate.date, 'MMM d, yyyy')}</p>
                            <p className="font-bold text-green-600">${shift.total_pay}</p>
                          </div>
                          {invitation.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedInvitation(invitationItem);
                                  setShowDeclineModal(true);
                                }}
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-orange-500 hover:bg-orange-600"
                                onClick={() => {
                                  setSelectedInvitation(invitationItem);
                                  setShowAcceptModal(true);
                                }}
                              >
                                Accept
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white px-3 pt-4 pb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">My Invitations</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-orange-100 mb-4">Direct invitations from employers</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{pendingInvites.length}</p>
            <p className="text-[10px] text-orange-100">Pending</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{acceptedInvites.length}</p>
            <p className="text-[10px] text-orange-100">Accepted</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{declinedInvites.length}</p>
            <p className="text-[10px] text-orange-100">Declined</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{allInvitations.length}</p>
            <p className="text-[10px] text-orange-100">Total</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 -mt-3 mb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-lg grid grid-cols-4 h-auto">
            <TabsTrigger value="pending" className="text-xs py-2.5 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Pending
              {pendingInvites.length > 0 && (
                <Badge className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] px-1.5 h-4">
                  {pendingInvites.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs py-2.5 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Accepted
            </TabsTrigger>
            <TabsTrigger value="declined" className="text-xs py-2.5 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Declined
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs py-2.5 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Expired
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invitations List */}
      <div className="px-3 space-y-2.5">
        {currentInvitations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No {activeTab} invitations
              </h3>
              <p className="text-sm text-gray-600">
                {activeTab === 'pending' && 'Pending invitations will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          currentInvitations.map(invitationItem => {
            const { invitation, shift } = invitationItem;
            if (!shift) return null;

            const expiryInfo = invitation.status === 'pending' ? getExpiryInfo(invitation) : null;

            return (
              <Card key={invitation.id} className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${
                      invitation.status === 'pending' ? 'bg-amber-500' :
                      invitation.status === 'accepted' ? 'bg-green-500' :
                      invitation.status === 'declined' ? 'bg-red-500' :
                      'bg-gray-500'
                    } text-white border-0 text-xs`}>
                      <Mail className="w-3 h-3 mr-1" />
                      {invitation.status}
                    </Badge>
                    {expiryInfo && (
                      <Badge variant="outline" className={`${expiryInfo.color} text-xs font-medium ${expiryInfo.urgent ? 'animate-pulse' : ''}`}>
                        ⏰ {expiryInfo.text}
                      </Badge>
                    )}
                  </div>

                  {/* Pharmacy Info */}
                  <div className="mb-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Building2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-1">{shift.pharmacy_name}</h3>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{shift.pharmacy_city}, {shift.pharmacy_province}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shift Details - Multi-date support */}
                  <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
                    <div className="space-y-2">
                      {(() => {
                        const schedule = getScheduleFromShift(shift);
                        if (schedule.length === 0) {
                          return (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-orange-600" />
                              <span className="text-gray-500">No dates scheduled</span>
                            </div>
                          );
                        }
                        return schedule.slice(0, 3).map((dateInfo, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="font-semibold text-gray-900">
                              {safeFormatDate(dateInfo.date)}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-700">
                              {formatTime12Hour(dateInfo.start_time)} - {formatTime12Hour(dateInfo.end_time)}
                            </span>
                          </div>
                        ));
                      })()}
                      {(() => {
                        const schedule = getScheduleFromShift(shift);
                        if (schedule.length > 3) {
                          return (
                            <p className="text-xs text-orange-600 font-medium">
                              +{schedule.length - 3} more date{schedule.length - 3 > 1 ? 's' : ''}
                            </p>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex items-center gap-2 text-sm pt-1 border-t border-gray-100">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                        <span className="font-bold text-gray-900">
                          ${shift.hourly_rate}/hr • ${shift.total_pay?.toFixed(2)} total ({shift.total_hours}h)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Employer Info */}
                  <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <p className="text-xs font-semibold text-gray-700">From: {invitation.employer_name}</p>
                    </div>
                    {invitation.message && (
                      <p className="text-sm text-gray-600 italic pl-6 line-clamp-2">"{invitation.message}"</p>
                    )}
                  </div>

                  {/* Timing */}
                  <p className="text-xs text-gray-500 mb-3">
                    Invited {safeFormatDistanceToNow(invitation.invited_at)}
                  </p>

                  {/* Actions */}
                  {invitation.status === 'pending' && (
                    <>
                      {expiryInfo && expiryInfo.urgent && (
                        <div className={`mb-3 p-2 ${expiryInfo.bgColor} rounded-lg border border-current`}>
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`w-4 h-4 ${expiryInfo.color} flex-shrink-0 mt-0.5`} />
                            <p className={`text-xs ${expiryInfo.color} font-medium`}>
                              This invitation is expiring soon! Respond before it expires.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedInvitation(invitationItem);
                            setShowDeclineModal(true);
                          }}
                          disabled={declineInvitationMutation.isPending}
                          className="flex-1 h-11 border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedInvitation(invitationItem);
                            setShowAcceptModal(true);
                          }}
                          disabled={acceptInvitationMutation.isPending}
                          className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    </>
                  )}

                  {invitation.status === 'accepted' && invitation.responded_at && (
                    <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-800 font-medium">
                        ✓ Accepted {safeFormatDistanceToNow(invitation.responded_at)}
                      </p>
                    </div>
                  )}

                  {invitation.status === 'declined' && invitation.responded_at && (
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-700">
                        Declined {safeFormatDistanceToNow(invitation.responded_at)}
                      </p>
                    </div>
                  )}

                  {(invitation.status === 'cancelled' || invitation.status === 'expired') && (
                    <div className="p-2 bg-gray-100 rounded-lg border border-gray-300">
                      <p className="text-xs text-gray-600">
                        {invitation.status === 'cancelled' ? 'Cancelled by employer' : 'Expired'}
                        {invitation.cancellation_reason && `: ${invitation.cancellation_reason}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      </div>

      {/* Accept Confirmation Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Accept Invitation?</DialogTitle>
            <DialogDescription className="pt-3 text-sm">
              This will add the shift to your schedule. Make sure you're available!
            </DialogDescription>
          </DialogHeader>

          {selectedInvitation?.shift && (() => {
            const schedule = getScheduleFromShift(selectedInvitation.shift);
            const primaryDate = schedule[0] || {};
            return (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="font-semibold text-gray-900 mb-2">{selectedInvitation.shift.pharmacy_name}</p>
                <p className="text-sm text-gray-700">
                  {safeFormatDate(primaryDate.date, 'MMM d, yyyy')}
                  {schedule.length > 1 && ` (+${schedule.length - 1} more)`}
                </p>
                <p className="text-sm text-gray-700">
                  {formatTime12Hour(primaryDate.start_time)} - {formatTime12Hour(primaryDate.end_time)}
                </p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  ${selectedInvitation.shift.total_pay}
                </p>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAcceptModal(false)}
              disabled={acceptInvitationMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => acceptInvitationMutation.mutate(selectedInvitation.invitation.id)}
              disabled={acceptInvitationMutation.isPending}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {acceptInvitationMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Accepting...
                </>
              ) : (
                'Confirm Accept'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Confirmation Modal */}
      <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Decline Invitation?
            </DialogTitle>
            <DialogDescription className="pt-3 text-sm">
              The employer will be notified that you declined this invitation.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeclineModal(false)}
              disabled={declineInvitationMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => declineInvitationMutation.mutate(selectedInvitation.invitation.id)}
              disabled={declineInvitationMutation.isPending}
              variant="destructive"
              className="flex-1"
            >
              {declineInvitationMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Declining...
                </>
              ) : (
                'Decline'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PharmacistInvitations() {
  return (
    <PharmacistOnly>
      <PharmacistInvitationsContent />
    </PharmacistOnly>
  );
}