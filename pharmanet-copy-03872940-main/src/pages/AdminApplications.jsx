import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Building2,
  Mail
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminOnly } from "../components/auth/RouteProtection";
import { format } from "date-fns";
import { getScheduleFromShift } from "../components/utils/shiftUtils";
import { parseLocalDate } from "../components/utils/timeUtils";
import { motion, AnimatePresence } from "framer-motion";

function AdminApplicationsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['adminApplications'],
    queryFn: async () => {
      const res = await base44.entities.ShiftApplication.list('-applied_date');
      return res || [];
    },
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['adminShifts'],
    queryFn: async () => {
      const res = await base44.entities.Shift.list();
      return res || [];
    },
  });

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.pharmacist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.pharmacist_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "pending" && app.status === "pending") ||
      (activeTab === "accepted" && app.status === "accepted") ||
      (activeTab === "rejected" && app.status === "rejected");

    return matchesSearch && matchesTab;
  });

  const stats = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    accepted: applications.filter(a => a.status === "accepted").length,
  };

  const getShift = (shiftId) => shifts.find(s => s.id === shiftId);

  // Accept application mutation
  const acceptMutation = useMutation({
    mutationFn: async ({ applicationId, shiftId }) => {
      await base44.entities.ShiftApplication.update(applicationId, { status: 'accepted' });
      await base44.entities.Shift.update(shiftId, { status: 'filled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminApplications']);
      queryClient.invalidateQueries(['adminShifts']);
      toast({ title: "Application Accepted" });
      setShowDetails(false);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: (applicationId) => 
      base44.entities.ShiftApplication.update(applicationId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminApplications']);
      toast({ title: "Application Rejected" });
      setShowDetails(false);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Applications</h1>
            <p className="text-xs text-zinc-500">
              {stats.all} total • {stats.pending} pending • {stats.accepted} accepted
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 max-w-[1600px] mx-auto mt-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications..."
              className="pl-9 bg-white border-zinc-200"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-zinc-100 border border-zinc-200 p-1 h-10 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs px-3">Pending</TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs px-3">Accepted</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs px-3">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Applications Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
            <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-500 font-medium">No applications found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredApplications.map((app, i) => {
                const shift = getShift(app.shift_id);
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      setSelectedApp({ ...app, shift });
                      setShowDetails(true);
                    }}
                  >
                    <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold text-zinc-600">
                            {app.pharmacist_name?.[0]?.toUpperCase() || "P"}
                          </div>
                          <div>
                            <h3 className="font-semibold text-zinc-900 text-sm leading-tight">{app.pharmacist_name}</h3>
                            <p className="text-[10px] text-zinc-500 leading-tight">
                              {app.applied_date ? format(new Date(app.applied_date), 'MMM d') : '-'}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      {shift && (
                        <div className="mt-auto bg-zinc-50 rounded-lg p-2 border border-zinc-100">
                          <p className="text-xs font-medium text-zinc-900 mb-0.5 truncate">{shift.pharmacy_name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            {(() => {
                              const schedule = getScheduleFromShift(shift) || [];
                              const primaryDate = schedule[0]?.date;
                              return primaryDate ? format(parseLocalDate(primaryDate), 'MMM d, yyyy') : 'No date';
                            })()} • ${shift.total_pay || 0}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedApp && (
            <>
              <SheetHeader className="mb-6 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center text-lg font-bold text-zinc-600">
                    {selectedApp.pharmacist_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle className="text-lg font-bold">{selectedApp.pharmacist_name}</SheetTitle>
                    <div className="flex gap-2 mt-1">
                      {getStatusBadge(selectedApp.status)}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-zinc-900">{selectedApp.pharmacist_email}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-zinc-900">
                        Applied: {selectedApp.applied_date ? format(new Date(selectedApp.applied_date), 'PPP p') : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedApp.shift && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shift Details</h4>
                    <div className="p-4 bg-white border border-zinc-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-zinc-900" />
                        <span className="font-semibold text-sm">{selectedApp.shift.pharmacy_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-zinc-500">Date</p>
                          <p>{(() => {
                            const schedule = getScheduleFromShift(selectedApp.shift) || [];
                            const primaryDate = schedule[0]?.date;
                            return primaryDate ? format(parseLocalDate(primaryDate), 'MMM d, yyyy') : 'No date';
                          })()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Pay</p>
                          <p className="font-medium">${selectedApp.shift.total_pay || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedApp.cover_letter && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cover Letter</h4>
                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm text-zinc-700 leading-relaxed">
                      {selectedApp.cover_letter}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {selectedApp.status === 'pending' && (
                  <div className="space-y-3 pt-4 border-t border-zinc-100">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          if (confirm('Accept this application?')) {
                            acceptMutation.mutate({ 
                              applicationId: selectedApp.id, 
                              shiftId: selectedApp.shift_id 
                            });
                          }
                        }}
                        disabled={acceptMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Reject this application?')) {
                            rejectMutation.mutate(selectedApp.id);
                          }
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AdminApplications() {
  return (
    <AdminOnly>
      <AdminApplicationsContent />
    </AdminOnly>
  );
}