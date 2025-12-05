import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, XCircle, Ban, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import ApplicationCard from "../components/shift/ApplicationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PharmacistOnly } from "../components/auth/RouteProtection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "../components/shared/EmptyState";
import OnboardingGate from "../components/onboarding/OnboardingGate";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function MyApplicationsContent() {
  const [activeTab, setActiveTab] = useState("pending");
  const [user, setUser] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawingApp, setWithdrawingApp] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ['myApplications', user?.email],
    queryFn: async () => {
      const res = await base44.entities.ShiftApplication.filter(
        { pharmacist_email: user?.email }, 
        "-applied_date"
      );
      return res || [];
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: cancelledShifts = [], isLoading: cancelledLoading } = useQuery({
    queryKey: ['myCancelledShifts', user?.id],
    queryFn: async () => {
      const cancellations = await base44.entities.ShiftCancellation.filter(
        { pharmacist_id: user?.id },
        "-cancelled_at"
      );
      return cancellations || [];
    },
    enabled: !!user,
    initialData: [],
  });

  const withdrawMutation = useMutation({
    mutationFn: async (appId) => {
      await base44.entities.ShiftApplication.update(appId, { status: "withdrawn" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      setShowWithdrawModal(false);
      setWithdrawingApp(null);
      toast({
        title: "Application Withdrawn",
        description: "Your application has been successfully withdrawn.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to withdraw application",
      });
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "✓ Refreshed",
      description: "Applications updated",
      duration: 2000
    });
  };

  const handleWithdraw = (app) => {
    setWithdrawingApp(app);
    setShowWithdrawModal(true);
  };

  const confirmWithdraw = () => {
    if (withdrawingApp) {
      withdrawMutation.mutate(withdrawingApp.id);
    }
  };

  const pendingApps = applications.filter(a => a.status === "pending");
  const acceptedApps = applications.filter(a => a.status === "accepted");
  const rejectedApps = applications.filter(a => a.status === "rejected");

  const currentApps = activeTab === "pending" ? pendingApps :
                     activeTab === "accepted" ? acceptedApps :
                     activeTab === "rejected" ? rejectedApps :
                     [];

  const isLoadingContent = isLoading || (activeTab === "cancelled" && cancelledLoading);

  return (
    <div className="pb-8 md:pb-8">
      {/* ============ DESKTOP LAYOUT ============ */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
                <p className="text-sm text-gray-500 mt-1">Track your shift applications</p>
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
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{pendingApps.length}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("accepted")}>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{acceptedApps.length}</p>
                <p className="text-xs text-gray-500">Accepted</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("rejected")}>
              <CardContent className="p-4 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{rejectedApps.length}</p>
                <p className="text-xs text-gray-500">Rejected</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab("cancelled")}>
              <CardContent className="p-4 text-center">
                <Ban className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{cancelledShifts.length}</p>
                <p className="text-xs text-gray-500">Cancelled</p>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Tabs & Content */}
          <Card className="border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Pending ({pendingApps.length})
                  </TabsTrigger>
                  <TabsTrigger value="accepted" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Accepted ({acceptedApps.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Rejected ({rejectedApps.length})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Cancelled ({cancelledShifts.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="p-4">
              {isLoadingContent ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              ) : activeTab === "cancelled" ? (
                cancelledShifts.length === 0 ? (
                  <div className="text-center py-12">
                    <Ban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No cancelled shifts</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {cancelledShifts.map(cancellation => (
                      <Card key={cancellation.id} className="border-l-4 border-red-500">
                        <CardContent className="p-4">
                          <h4 className="font-bold text-gray-900 mb-2">{cancellation.pharmacy_name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{format(new Date(cancellation.shift_date), "MMM d, yyyy")}</p>
                          <div className={`p-2 rounded-lg ${cancellation.penalty_total === 0 ? 'bg-teal-50' : 'bg-red-50'}`}>
                            <span className={`font-bold ${cancellation.penalty_total === 0 ? 'text-teal-600' : 'text-red-600'}`}>
                              Penalty: ${cancellation.penalty_total.toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : currentApps.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No {activeTab} applications</p>
                  {activeTab === "pending" && (
                    <Button className="mt-4" onClick={() => navigate(createPageUrl("BrowseShifts"))}>
                      Browse Shifts
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentApps.map(app => (
                    <ApplicationCard 
                      key={app.id} 
                      application={app}
                      onWithdraw={activeTab === "pending" ? () => handleWithdraw(app) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="md:hidden">
      {/* Professional Medical Header */}
      <div className="bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 text-white p-4 pb-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">My Applications</h1>
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
        <p className="text-gray-200 text-xs mb-3">Track your shift applications</p>

        {/* Stats - 3 columns for better mobile fit */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{pendingApps.length}</p>
            <p className="text-[10px] text-gray-200">Pending</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{acceptedApps.length}</p>
            <p className="text-[10px] text-gray-200">Accepted</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 text-center border border-white/20">
            <p className="text-xl font-bold">{rejectedApps.length}</p>
            <p className="text-[10px] text-gray-200">Rejected</p>
          </div>
        </div>
      </div>

      {/* Professional Tabs */}
      <div className="px-3 -mt-3 mb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-md grid grid-cols-4 border border-gray-200 h-auto">
            <TabsTrigger value="pending" className="flex-col gap-0.5 py-2 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px]">Pending</span>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex-col gap-0.5 py-2 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[10px]">Accepted</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-col gap-0.5 py-2 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <XCircle className="w-3.5 h-3.5" />
              <span className="text-[10px]">Rejected</span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-col gap-0.5 py-2 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Ban className="w-3.5 h-3.5" />
              <span className="text-[10px]">Cancelled</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Applications List */}
      <div className="px-3 space-y-2.5">
        {isLoadingContent ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))
        ) : activeTab === "cancelled" ? (
          // Cancelled Shifts View
          cancelledShifts.length === 0 ? (
            <EmptyState
              icon={Ban}
              title="No Cancelled Shifts"
              description="You haven't cancelled any accepted shifts. Remember to give employers at least 5 days notice to avoid penalties."
              actionLabel="View My Schedule"
              onAction={() => navigate(createPageUrl("MySchedule"))}
            />
          ) : (
            cancelledShifts.map(cancellation => (
              <Card key={cancellation.id} className="hover:shadow-lg transition-shadow border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-base mb-1 truncate">
                        {cancellation.pharmacy_name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {format(new Date(cancellation.shift_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        cancellation.status === 'charged' ? 'bg-red-50 text-red-700 border-red-200' :
                        cancellation.status === 'waived' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                        'bg-gray-100 text-gray-700 border-gray-300'
                      } font-semibold text-xs`}
                    >
                      {cancellation.status}
                    </Badge>
                  </div>

                  {/* Cancellation Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Cancelled:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(cancellation.cancelled_at), "MMM d 'at' h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Notice:</span>
                      <span className="font-semibold text-gray-900">
                        {Math.floor(cancellation.hours_before_start / 24)} days
                      </span>
                    </div>
                  </div>

                  {/* Penalty Amount */}
                  <div className={`rounded-lg p-3 border ${
                    cancellation.penalty_total === 0 
                      ? 'bg-teal-50 border-teal-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Penalty:</span>
                      <span className={`text-lg font-bold ${
                        cancellation.penalty_total === 0 ? 'text-teal-600' : 'text-red-600'
                      }`}>
                        ${cancellation.penalty_total.toFixed(2)}
                      </span>
                    </div>
                    {cancellation.penalty_total > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 space-y-1 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-gray-600">To Employer:</span>
                          <span className="font-semibold text-gray-900">
                            ${cancellation.penalty_employer_share.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Fee:</span>
                          <span className="font-semibold text-gray-900">
                            ${cancellation.penalty_app_share.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {cancellation.penalty_total === 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-[10px] text-blue-800">
                        ✓ No penalty - cancelled 5+ days in advance
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )
        ) : (
          // Regular Applications View
          currentApps.length === 0 ? (
            <EmptyState
              icon={activeTab === "pending" ? Clock : activeTab === "accepted" ? CheckCircle : XCircle}
              title={`No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Applications`}
              description={
                activeTab === "pending" 
                  ? "Start applying for shifts to see them here. Browse available shifts now."
                  : activeTab === "accepted" 
                  ? "Accepted applications will appear here. Keep applying to increase your chances."
                  : "Rejected applications will appear here."
              }
              actionLabel={activeTab === "pending" ? "Browse Shifts" : "View All Applications"}
              onAction={() => activeTab === "pending" ? navigate(createPageUrl("BrowseShifts")) : setActiveTab("pending")}
            />
          ) : (
            currentApps.map(app => (
              <ApplicationCard 
                key={app.id} 
                application={app}
                onWithdraw={activeTab === "pending" ? () => handleWithdraw(app) : undefined}
              />
            ))
          )
        )}
      </div>
      </div>

      {/* Withdraw Confirmation Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Withdraw Application?
            </DialogTitle>
            <DialogDescription className="pt-3 text-sm">
              Are you sure you want to withdraw your application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowWithdrawModal(false)}
              disabled={withdrawMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmWithdraw}
              disabled={withdrawMutation.isPending}
              variant="destructive"
              className="flex-1"
            >
              {withdrawMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Withdrawing...
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MyApplications() {
  return (
    <PharmacistOnly>
      <OnboardingGate userType="pharmacist" minimumCompletion={80}>
        <MyApplicationsContent />
      </OnboardingGate>
    </PharmacistOnly>
  );
}