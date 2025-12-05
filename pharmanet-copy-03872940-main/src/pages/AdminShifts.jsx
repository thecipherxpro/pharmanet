import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Calendar,
  Search,
  MapPin,
  Trash2,
  XCircle,
  Building2,
  AlertTriangle,
  Clock,
  DollarSign,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminOnly } from "../components/auth/RouteProtection";
import WhatsAppShareButton from "../components/shift/WhatsAppShareButton";
import { format } from "date-fns";
import { formatTime12Hour, parseLocalDate } from "../components/utils/timeUtils";
import { getScheduleFromShift } from "../components/utils/shiftUtils";
import { motion, AnimatePresence } from "framer-motion";
import WhatsAppBulkShareModal from "../components/admin/WhatsAppBulkShareModal";

// Safe schedule getter with extra protection
function safeGetSchedule(shift) {
  try {
    const schedule = getScheduleFromShift(shift);
    return Array.isArray(schedule) ? schedule : [];
  } catch {
    return [];
  }
}

// Safe date formatter
function safeFormatDate(dateStr, formatStr = 'MMM d, yyyy') {
  try {
    if (!dateStr) return 'No date';
    const parsed = parseLocalDate(dateStr);
    if (!parsed || isNaN(parsed.getTime())) return 'Invalid date';
    return format(parsed, formatStr);
  } catch {
    return 'Invalid date';
  }
}

// Error display component
function InlineError({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-red-700 font-medium mb-2">Something went wrong</p>
      <p className="text-red-600 text-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Try Again
        </Button>
      )}
    </div>
  );
}

function AdminShiftsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedShift, setSelectedShift] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: shifts = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['adminShifts'],
    queryFn: async () => {
      const result = await base44.entities.Shift.list('-created_date', 500);
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: cancellations = [] } = useQuery({
    queryKey: ['adminCancellations'],
    queryFn: () => base44.entities.ShiftCancellation.list('-cancelled_at'),
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (shiftId) => base44.entities.Shift.delete(shiftId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminShifts']);
      toast({ title: "Shift Deleted" });
      setShowDetails(false);
    }
  });

  const cancelShiftMutation = useMutation({
    mutationFn: (shiftId) => base44.entities.Shift.update(shiftId, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminShifts']);
      toast({ title: "Shift Cancelled" });
      setShowDetails(false);
    }
  });

  // Safely filter shifts
  const safeShifts = Array.isArray(shifts) ? shifts : [];
  
  const filteredShifts = safeShifts.filter(shift => {
    if (!shift) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (shift.pharmacy_name || '').toLowerCase().includes(searchLower) ||
      (shift.title || '').toLowerCase().includes(searchLower) ||
      (shift.pharmacy_city || '').toLowerCase().includes(searchLower);
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "open" && shift.status === "open") ||
      (activeTab === "filled" && shift.status === "filled") ||
      (activeTab === "completed" && shift.status === "completed") ||
      (activeTab === "closed" && shift.status === "closed") ||
      (activeTab === "cancelled" && shift.status === "cancelled");

    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case "open":
        return <Badge variant="outline" className="border-zinc-300 text-zinc-700 bg-white">Open</Badge>;
      case "filled":
        return <Badge className="bg-zinc-900 text-white hover:bg-zinc-800 border-0">Filled</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-zinc-200 text-zinc-800 hover:bg-zinc-300 border-0">Done</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Closed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    all: safeShifts.length,
    open: safeShifts.filter(s => s?.status === "open").length,
    filled: safeShifts.filter(s => s?.status === "filled").length,
    cancelled: safeShifts.filter(s => s?.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-zinc-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Shift Management</h1>
              <p className="text-xs text-zinc-500">
                {stats.all} shifts • {stats.open} open • {stats.filled} filled
              </p>
            </div>
          </div>
          
          {/* WhatsApp Bulk Share Button */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="w-10 h-10 rounded-xl bg-green-100 hover:bg-green-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Share shifts on WhatsApp"
          >
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* WhatsApp Bulk Share Modal */}
      <WhatsAppBulkShareModal
        open={showWhatsAppModal}
        onOpenChange={setShowWhatsAppModal}
        shifts={safeShifts}
      />

      <div className="px-6 max-w-[1600px] mx-auto mt-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shifts..."
              className="pl-9 bg-white border-zinc-200"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-zinc-100 border border-zinc-200 p-1 h-10 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="open" className="text-xs px-3">Open</TabsTrigger>
              <TabsTrigger value="filled" className="text-xs px-3">Filled</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-3">Done</TabsTrigger>
              <TabsTrigger value="closed" className="text-xs px-3">Closed</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs px-3">Void</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Shifts Grid */}
        {isError ? (
          <InlineError 
            message={error?.message || "Failed to load shifts"} 
            onRetry={() => refetch()} 
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
             {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
            <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <p className="text-zinc-500 font-medium">No shifts found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <AnimatePresence>
              {filteredShifts.map((shift, i) => (
                <motion.div
                  key={shift.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => {
                    setSelectedShift(shift);
                    setShowDetails(true);
                  }}
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-zinc-900 text-sm line-clamp-1">{shift.pharmacy_name}</h3>
                      {getStatusBadge(shift.status)}
                    </div>
                    
                    <p className="text-xs text-zinc-500 mb-3 line-clamp-1">{shift.title}</p>
                    
                    <div className="mt-auto space-y-1.5">
                      {(() => {
                        const schedule = safeGetSchedule(shift);
                        const dateCount = schedule.length;
                        const primaryDate = schedule[0] || {};
                        return (
                          <>
                            <div className="flex items-center gap-2 text-xs text-zinc-600">
                               <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                               <span>
                                 {safeFormatDate(primaryDate.date)}
                                 {dateCount > 1 && <span className="text-zinc-400 ml-1">(+{dateCount - 1} more)</span>}
                               </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-600">
                               <Clock className="w-3.5 h-3.5 text-zinc-400" />
                               <span>{formatTime12Hour(primaryDate.start_time || '09:00')} - {formatTime12Hour(primaryDate.end_time || '17:00')}</span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="flex items-center gap-2 text-xs text-zinc-600 pt-1">
                         <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                         <span className="font-medium text-zinc-900">${shift.total_pay || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          </>
        )}
      </div>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedShift && (
            <>
              <SheetHeader className="mb-6 border-b border-zinc-100 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-zinc-600" />
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-lg font-bold text-zinc-900 leading-tight mb-1">
                      {selectedShift.pharmacy_name}
                    </SheetTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedShift.status)}
                      <span className="text-xs text-zinc-500">
                        {selectedShift.pharmacy_city}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {/* Schedule Section - Shows ALL dates */}
                {(() => {
                  const schedule = safeGetSchedule(selectedShift);
                  const dateCount = schedule.length;
                  return (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Schedule ({dateCount} {dateCount === 1 ? 'date' : 'dates'})
                      </h4>
                      
                      {dateCount === 0 ? (
                        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-center">
                          <p className="text-sm text-zinc-500">No dates scheduled</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {schedule.map((dateItem, idx) => (
                            <div key={idx} className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-200 rounded-md flex items-center justify-center text-xs font-bold text-zinc-700">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-zinc-900">
                                    {safeFormatDate(dateItem?.date, 'EEE, MMM d, yyyy')}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {formatTime12Hour(dateItem?.start_time || '09:00')} - {formatTime12Hour(dateItem?.end_time || '17:00')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Rate</p>
                      <p className="text-sm font-medium">${selectedShift.hourly_rate || 0}/hr</p>
                   </div>
                   <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Total Pay</p>
                      <p className="text-sm font-bold text-zinc-900">${selectedShift.total_pay || 0}</p>
                   </div>
                   <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Total Hours</p>
                      <p className="text-sm font-medium">{selectedShift.total_hours || 0}h</p>
                   </div>
                   <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs text-zinc-500 mb-1">Shift Type</p>
                      <p className="text-sm font-medium capitalize">{selectedShift.shift_type || 'N/A'}</p>
                   </div>
                </div>

                {selectedShift.description && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</h4>
                    <p className="text-sm text-zinc-700 leading-relaxed p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      {selectedShift.description}
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-zinc-100">
                   <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin Actions</h4>
                   
                   {/* WhatsApp Share */}
                   <div className="flex items-center gap-2">
                     <WhatsAppShareButton shift={selectedShift} />
                     <span className="text-sm text-zinc-600">Share on WhatsApp</span>
                   </div>
                   
                   {selectedShift.status !== "cancelled" && (
                     <Button 
                       variant="outline" 
                       className="w-full justify-start"
                       onClick={() => {
                         if(confirm('Cancel this shift?')) cancelShiftMutation.mutate(selectedShift.id);
                       }}
                     >
                       <XCircle className="w-4 h-4 mr-2" /> Cancel Shift
                     </Button>
                   )}

                   <Button 
                     variant="destructive" 
                     className="w-full justify-start bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                     onClick={() => {
                       if(confirm('Delete shift permanently?')) deleteShiftMutation.mutate(selectedShift.id);
                     }}
                   >
                     <Trash2 className="w-4 h-4 mr-2" /> Delete Shift
                   </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AdminShifts() {
  return (
    <AdminOnly>
      <AdminShiftsContent />
    </AdminOnly>
  );
}