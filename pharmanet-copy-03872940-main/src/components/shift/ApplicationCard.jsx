import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar, Clock, MapPin, DollarSign, Building2, X, XCircle, Layers, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../utils/timeUtils";

export default function ApplicationCard({ application, onWithdraw }) {
  const [showDetails, setShowDetails] = useState(false);

  const { data: shift, isLoading } = useQuery({
    queryKey: ['shiftForApp', application.shift_id],
    queryFn: async () => {
      const shifts = await base44.entities.Shift.filter({ id: application.shift_id });
      return shifts[0];
    },
    enabled: !!application.shift_id,
  });

  if (isLoading || !shift) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Handle multi-date shifts
  const isMultiDate = shift.is_multi_date && shift.shift_dates && shift.shift_dates.length > 1;
  const displayDate = isMultiDate ? shift.shift_dates[0] : {
    date: shift.shift_date,
    start_time: shift.start_time,
    end_time: shift.end_time,
    hourly_rate: shift.hourly_rate,
    total_pay: shift.total_pay,
    total_hours: shift.total_hours
  };

  const statusConfig = {
    pending: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Pending' },
    accepted: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: 'Accepted' },
    rejected: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Rejected' },
    withdrawn: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', label: 'Withdrawn' }
  };

  const config = statusConfig[application.status] || statusConfig.pending;

  return (
    <>
      <Card className={`hover:shadow-lg transition-all border-2 ${config.border}`}>
        <CardContent className="p-3">
          {isMultiDate && (
            <Badge className="bg-teal-600 text-white text-xs mb-2">
              {shift.shift_dates.length} Dates
            </Badge>
          )}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base mb-1 truncate">
                {shift.pharmacy_name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{shift.pharmacy_city}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {isMultiDate 
                    ? `${shift.shift_dates.length} dates starting ${format(new Date(displayDate.date), "MMM d")}`
                    : format(new Date(shift.shift_date), "MMM d, yyyy")
                  }
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={`${config.bg} ${config.text} ${config.border} font-semibold text-xs whitespace-nowrap`}>
                {config.label}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-bold text-xs">
                ${displayDate.hourly_rate}/hr
              </Badge>
            </div>
          </div>

          {application.cover_letter && (
            <div className="bg-gray-50 rounded-lg p-2.5 mb-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1 font-medium">Your Message:</p>
              <p className="text-xs text-gray-700 line-clamp-2 italic">
                "{application.cover_letter}"
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="flex-1 h-9 text-xs"
            >
              View Details
            </Button>
            {onWithdraw && application.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onWithdraw}
                className="h-9 px-3 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Bottom Sheet Drawer */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0 flex flex-col">
          {/* Modern Header */}
          <div className={`${config.bg} text-gray-900 px-3 py-3 rounded-t-3xl border-b-2 ${config.border}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDetails(false)}
                className={`w-9 h-9 rounded-lg bg-white/80 hover:bg-white backdrop-blur flex items-center justify-center transition-colors active:scale-95`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold truncate leading-tight">Application Details</h2>
                <p className="text-xs opacity-75 truncate mt-0.5">
                  {shift.pharmacy_name}
                </p>
              </div>
              <Badge variant="outline" className={`${config.bg} ${config.text} ${config.border} font-semibold text-xs whitespace-nowrap border-2`}>
                {config.label}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {/* Status Card */}
            <div className={`${config.bg} ${config.border} border-2 rounded-xl p-3 text-center shadow-sm`}>
              <p className="text-[10px] text-gray-600 mb-0.5 font-medium">Application Status</p>
              <p className={`text-lg font-bold ${config.text}`}>{config.label}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                Applied {format(new Date(application.applied_date), 'MMM d, yyyy')}
              </p>
            </div>

            {/* Shift Info */}
            <div className="bg-white rounded-xl p-3 space-y-2.5 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-600 mb-0.5">Pharmacy</p>
                  <p className="font-bold text-sm text-gray-900 truncate">{shift.pharmacy_name}</p>
                  <p className="text-[10px] text-gray-600 truncate">{shift.pharmacy_address}</p>
                </div>
              </div>

              {isMultiDate ? (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <p className="text-[10px] text-gray-600 font-bold">Dates Applied:</p>
                  {shift.shift_dates.map((dateInfo, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-teal-50 rounded-lg p-2 border border-teal-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-teal-600" />
                        <span className="text-[10px] font-medium">{format(new Date(dateInfo.date), 'MMM d, yyyy')}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200 h-5 px-1.5">
                        ${dateInfo.total_pay}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-600 mb-0.5">Date</p>
                      <p className="font-semibold text-xs text-gray-900">
                        {format(new Date(shift.shift_date), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-600 mb-0.5">Time</p>
                      <p className="font-semibold text-xs text-gray-900">
                        {formatTime12Hour(shift.start_time)} - {formatTime12Hour(shift.end_time)}
                      </p>
                      <p className="text-[10px] text-gray-600">{shift.total_hours} hours</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                <DollarSign className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-600 mb-0.5">Pay</p>
                  <p className="font-bold text-sm text-green-600">
                    ${displayDate.hourly_rate}/hr
                  </p>
                  <p className="text-[10px] text-gray-600">Total: ${shift.total_pay}</p>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            {application.cover_letter && (
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 shadow-sm">
                <p className="text-[10px] text-blue-700 font-bold mb-2">Your Message:</p>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {application.cover_letter}
                </p>
              </div>
            )}

            {/* Rejection Reason */}
            {application.status === 'rejected' && application.rejection_reason && (
              <div className="bg-red-50 rounded-xl p-3 border border-red-200 shadow-sm">
                <p className="text-[10px] text-red-700 font-bold mb-2">Rejection Reason:</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {application.rejection_reason}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}