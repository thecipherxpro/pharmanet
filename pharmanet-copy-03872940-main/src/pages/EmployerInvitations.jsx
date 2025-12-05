import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Search, 
  RefreshCw, 
  User, 
  Calendar, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
} from "lucide-react";
import { EmployerOnly } from "../components/auth/RouteProtection";
import EmptyState from "../components/shared/EmptyState";
import OnboardingGate from "../components/onboarding/OnboardingGate";
import { useToast } from "@/components/ui/use-toast";
import ProfileAvatar from "../components/shared/ProfileAvatar";
import { format, formatDistanceToNow } from "date-fns";
import { formatTime12Hour, parseLocalDate, safeFormat } from "../components/utils/timeUtils";
import { getScheduleFromShift } from "../components/utils/shiftUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

function EmployerInvitationsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingInvitation, setCancellingInvitation] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  const { data: invitations = [], isLoading, refetch } = useQuery({
    queryKey: ['sentInvitations', user?.email],
    queryFn: async () => {
      // Fetch invitations and shifts in parallel
      const [invites, myShifts] = await Promise.all([
        base44.entities.ShiftInvitation.filter({
          employer_email: user?.email
        }, '-invited_at', 100),
        base44.entities.Shift.filter({
          employer_email: user?.email
        }, '-created_date', 200)
      ]);
      
      // Create a map of shifts for quick lookup
      const shiftsMap = new Map(myShifts.map(s => [s.id, s]));
      
      // Attach shift details to each invitation
      return invites.map(invite => ({
        ...invite,
        shift: shiftsMap.get(invite.shift_id) || null
      }));
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId) => {
      const response = await base44.functions.invoke('cancelInvitation', {
        invitationId,
        reason: 'Cancelled by employer'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentInvitations'] });
      setShowCancelModal(false);
      setCancellingInvitation(null);
      toast({
        title: "Invitation Cancelled",
        description: "The pharmacist has been notified.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cancel invitation",
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

  const handleCancelInvitation = (invitation) => {
    setCancellingInvitation(invitation);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    if (cancellingInvitation) {
      cancelInvitationMutation.mutate(cancellingInvitation.id);
    }
  };

  const pendingInvites = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvites = invitations.filter(inv => inv.status === 'accepted');
  const declinedInvites = invitations.filter(inv => inv.status === 'declined');
  const expiredInvites = invitations.filter(inv => inv.status === 'expired' || inv.status === 'cancelled');

  const filteredInvitations = (
    activeTab === 'pending' ? pendingInvites :
    activeTab === 'accepted' ? acceptedInvites :
    activeTab === 'declined' ? declinedInvites :
    expiredInvites
  ).filter(inv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return inv.pharmacist_name.toLowerCase().includes(query) ||
           inv.pharmacist_email.toLowerCase().includes(query);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'accepted': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      case 'expired': return 'bg-gray-400';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'accepted': return CheckCircle;
      case 'declined': return XCircle;
      case 'expired': return AlertCircle;
      case 'cancelled': return X;
      default: return Mail;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-4 pt-5 pb-6">
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
        {/* Search Skeleton */}
        <div className="px-3 -mt-3 mb-3">
          <div className="h-10 bg-white rounded-lg shadow-md animate-pulse" />
        </div>
        {/* Tabs Skeleton */}
        <div className="px-3 mb-3">
          <div className="h-10 bg-white rounded-lg shadow-lg animate-pulse" />
        </div>
        {/* Cards Skeleton */}
        <div className="px-3 space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded mb-3 animate-pulse" />
                  <div className="bg-gray-100 rounded-lg p-2 space-y-1.5">
                    <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
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
                <h1 className="text-2xl font-bold text-gray-900">Sent Invitations</h1>
                <p className="text-sm text-gray-500 mt-1">Track your shift invitations</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search pharmacist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 text-sm"
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
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("pending")}>
              <p className="text-3xl font-bold text-amber-600">{pendingInvites.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Pending</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("accepted")}>
              <p className="text-3xl font-bold text-green-600">{acceptedInvites.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Accepted</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("declined")}>
              <p className="text-3xl font-bold text-red-600">{declinedInvites.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Declined</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-3xl font-bold text-gray-900">{invitations.length}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Total</p>
            </div>
          </div>

          {/* Desktop Tabs & Grid */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {["pending", "accepted", "declined", "expired"].map((tab) => (
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
                </button>
              ))}
            </div>

            <div className="p-4">
              {filteredInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No {activeTab} invitations</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInvitations.map(invitation => {
                    const StatusIcon = getStatusIcon(invitation.status);
                    const shift = invitation.shift;
                    return (
                      <Card key={invitation.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-teal-600" />
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(invitation.status)} rounded-full flex items-center justify-center border-2 border-white`}>
                                <StatusIcon className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 truncate">{invitation.pharmacist_name}</h4>
                              <Badge className={`${getStatusColor(invitation.status)} text-white text-[10px] mt-1`}>
                                {invitation.status}
                              </Badge>
                            </div>
                          </div>

                          {shift && (() => {
                            const schedule = getScheduleFromShift(shift);
                            const primaryDate = schedule[0] || {};
                            return (
                              <div className="bg-gray-50 rounded-lg p-2 space-y-1.5 mb-3">
                                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                                  <MapPin className="w-3 h-3 text-teal-600" />
                                  <span className="font-medium truncate">{shift.pharmacy_name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  <span>{safeFormat(primaryDate.date, 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(createPageUrl("PublicProfile") + `?id=${invitation.pharmacist_id}`)}
                              className="flex-1 h-8 text-xs"
                            >
                              View Profile
                            </Button>
                            {invitation.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelInvitation(invitation)}
                                className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white px-3 pt-4 pb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">Sent Invitations</h1>
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
        <p className="text-xs text-teal-100 mb-4">Track your shift invitations</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{pendingInvites.length}</p>
            <p className="text-[10px] text-teal-100">Pending</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{acceptedInvites.length}</p>
            <p className="text-[10px] text-teal-100">Accepted</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{declinedInvites.length}</p>
            <p className="text-[10px] text-teal-100">Declined</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{invitations.length}</p>
            <p className="text-[10px] text-teal-100">Total</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 -mt-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search pharmacist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white shadow-md h-10 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 mb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-lg grid grid-cols-4 h-auto">
            <TabsTrigger value="pending" className="text-xs py-2.5 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              Pending
              {pendingInvites.length > 0 && (
                <Badge className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] px-1.5 h-4">
                  {pendingInvites.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs py-2.5 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              Accepted
            </TabsTrigger>
            <TabsTrigger value="declined" className="text-xs py-2.5 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              Declined
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs py-2.5 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              Expired
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invitations List */}
      <div className="px-3 space-y-2.5">
        {filteredInvitations.length === 0 ? (
          <EmptyState
            icon={Mail}
            title={`No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Invitations`}
            description={
              activeTab === 'pending'
                ? "You haven't sent any pending invitations yet. Find pharmacists and invite them to your shifts."
                : activeTab === 'accepted'
                ? "Accepted invitations will appear here when pharmacists confirm."
                : activeTab === 'declined'
                ? "Declined invitations will appear here."
                : "Expired or cancelled invitations will appear here."
            }
            actionLabel={activeTab === 'pending' ? "Find Pharmacists" : undefined}
            onAction={activeTab === 'pending' ? () => navigate(createPageUrl("FindPharmacists")) : undefined}
          />
        ) : (
          filteredInvitations.map(invitation => {
            const StatusIcon = getStatusIcon(invitation.status);
            const shift = invitation.shift;
            
            return (
              <Card key={invitation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(invitation.status)} rounded-full flex items-center justify-center border-2 border-white`}>
                        <StatusIcon className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 truncate">
                            {invitation.pharmacist_name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Invited {formatDistanceToNow(new Date(invitation.invited_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(invitation.status)} text-white text-[10px] px-2 py-0.5`}>
                          {invitation.status}
                        </Badge>
                      </div>

                      {/* Shift Details */}
                      {shift && (() => {
                        const schedule = getScheduleFromShift(shift);
                        const primaryDate = schedule[0] || {};
                        return (
                          <div className="bg-gray-50 rounded-lg p-2 mt-2 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-700">
                              <MapPin className="w-3 h-3 text-teal-600" />
                              <span className="font-medium">{shift.pharmacy_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {safeFormat(primaryDate.date, 'MMM d, yyyy')}
                                {schedule.length > 1 && ` (+${schedule.length - 1} more)`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime12Hour(primaryDate.start_time)} - {formatTime12Hour(primaryDate.end_time)}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Message Preview */}
                      {invitation.message && (
                        <p className="text-xs text-gray-600 mt-2 italic line-clamp-2">
                          "{invitation.message}"
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(createPageUrl("PublicProfile") + `?id=${invitation.pharmacist_id}`)}
                          className="flex-1 h-8 text-xs"
                        >
                          <User className="w-3 h-3 mr-1" />
                          Profile
                        </Button>
                        {invitation.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelInvitation(invitation)}
                            className="flex-1 h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Cancel Invitation?
            </DialogTitle>
            <DialogDescription className="pt-3 text-sm">
              Are you sure you want to cancel this invitation? The pharmacist will be notified.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelInvitationMutation.isPending}
              className="flex-1"
            >
              Keep
            </Button>
            <Button
              onClick={confirmCancel}
              disabled={cancelInvitationMutation.isPending}
              variant="destructive"
              className="flex-1"
            >
              {cancelInvitationMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Cancel Invitation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

export default function EmployerInvitations() {
  return (
    <EmployerOnly>
      <OnboardingGate userType="employer" minimumCompletion={80}>
        <EmployerInvitationsContent />
      </OnboardingGate>
    </EmployerOnly>
  );
}