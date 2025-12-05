import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Building2,
  Send,
  CheckCircle,
  Phone,
  Mail,
  Layers,
  ExternalLink,
  ArrowLeft,
  X,
  Layers2
} from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour, parseLocalDate } from "../utils/timeUtils";
import { getScheduleFromShift } from "../utils/shiftUtils";
import ApplicationDialog from "../shift/ApplicationDialog";

export default function PharmacistShiftDetailsDrawer({ open, onClose, shift, userEmail }) {
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  // Use unified schedule getter (must be above all hooks)
  const schedule = React.useMemo(() => shift ? getScheduleFromShift(shift) : [], [shift]);
  const isMultiDate = schedule.length > 1;
  const displayDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };

  const { data: myApplication = [] } = useQuery({
    queryKey: ['myApplication', shift?.id, userEmail],
    queryFn: () => base44.entities.ShiftApplication.filter({
      shift_id: shift?.id,
      pharmacist_email: userEmail
    }),
    enabled: !!shift && !!userEmail && open,
    initialData: []
  });

  const { data: pharmacy } = useQuery({
    queryKey: ['pharmacy', shift?.pharmacy_id],
    queryFn: async () => {
      const pharmacies = await base44.entities.Pharmacy.filter({ id: shift.pharmacy_id });
      return pharmacies[0];
    },
    enabled: !!shift?.pharmacy_id && open
  });

  const hasApplied = myApplication.length > 0;
  const applicationStatus = hasApplied ? myApplication[0].status : null;

  if (!shift) return null;

  const handleApply = () => {
    setShowApplicationDialog(true);
  };

  const handleDirections = () => {
    if (pharmacy) {
      const address = `${pharmacy.address}, ${pharmacy.city}, ${pharmacy.province}, ${pharmacy.postal_code}`;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-hidden flex flex-col bg-zinc-50">
          {/* Teal Branded Header */}
          <div className="bg-gradient-to-br from-teal-600 via-cyan-700 to-teal-800 text-white px-5 py-5 sticky top-0 z-10">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate leading-tight">
                  {shift.pharmacy_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-white/70" />
                  <p className="text-sm text-white/70 truncate">{shift.pharmacy_city}, ON</p>
                </div>
              </div>
              <Badge 
                className={`${
                  shift.status === 'open' 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'bg-white/10 text-white/80 border-white/20'
                } text-xs px-3 py-1.5 font-medium uppercase tracking-wide`}
              >
                {shift.status}
              </Badge>
            </div>
            
            {/* Rate Display */}
            <div className="backdrop-blur-sm rounded-2xl px-5 py-4 flex items-center justify-between border bg-white/10 border-white/20">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${shift.hourly_rate || 50}</span>
                  <span className="text-base text-white/70">/hr</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wide mb-1">{isMultiDate ? 'Total All' : 'Total Pay'}</p>
                <p className="text-xl font-bold">${shift.total_pay || 0}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {/* Application Status Banner */}
            {hasApplied && (
              <div className={`rounded-2xl p-4 ${
                applicationStatus === 'accepted' ? 'bg-emerald-50 border border-emerald-200' :
                applicationStatus === 'pending' ? 'bg-amber-50 border border-amber-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    applicationStatus === 'accepted' ? 'bg-emerald-100' :
                    applicationStatus === 'pending' ? 'bg-amber-100' :
                    'bg-red-100'
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${
                      applicationStatus === 'accepted' ? 'text-emerald-600' :
                      applicationStatus === 'pending' ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${
                      applicationStatus === 'accepted' ? 'text-emerald-900' :
                      applicationStatus === 'pending' ? 'text-amber-900' :
                      'text-red-900'
                    }`}>
                      {applicationStatus === 'accepted' && 'Application Accepted! 🎉'}
                      {applicationStatus === 'pending' && 'Application Under Review'}
                      {applicationStatus === 'rejected' && 'Application Not Selected'}
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      applicationStatus === 'accepted' ? 'text-emerald-700' :
                      applicationStatus === 'pending' ? 'text-amber-700' :
                      'text-red-700'
                    }`}>
                      {applicationStatus === 'accepted' && 'Contact the pharmacy for details'}
                      {applicationStatus === 'pending' && 'The employer is reviewing your application'}
                      {applicationStatus === 'rejected' && 'You were not selected for this shift'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Date Badge */}
            {isMultiDate && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                <Layers className="w-4 h-4" />
                {schedule.length} Dates Available
              </div>
            )}

            {/* Schedule */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200">
              <h3 className="font-semibold text-sm text-zinc-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                </div>
                Schedule
              </h3>

              {isMultiDate ? (
                <div className="space-y-3">
                  {schedule.map((dateInfo, idx) => (
                    <div key={idx} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-zinc-900">
                          {dateInfo.date && /^\d{4}-\d{2}-\d{2}$/.test(dateInfo.date)
                            ? (() => { try { const [y,m,d] = dateInfo.date.split('-').map(Number); return format(new Date(y,m-1,d), "EEE, MMM d"); } catch { return 'Date not set'; } })()
                            : 'Date not set'}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {dateInfo.start_time} - {dateInfo.end_time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-zinc-50 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-zinc-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Date</p>
                      <p className="font-semibold text-zinc-900 text-sm truncate">
                        {displayDate.date && /^\d{4}-\d{2}-\d{2}$/.test(displayDate.date)
                          ? (() => { try { const [y,m,d] = displayDate.date.split('-').map(Number); return format(new Date(y,m-1,d), "EEE, MMM d, yyyy"); } catch { return 'Date not set'; } })()
                          : 'Date not set'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-zinc-50 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-zinc-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Time</p>
                      <p className="font-semibold text-zinc-900 text-sm">
                        {formatTime12Hour(displayDate.start_time)} - {formatTime12Hour(displayDate.end_time)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{shift.total_hours || 8} hours</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pharmacy Location */}
            {pharmacy && (
              <div className="bg-white rounded-2xl p-5 border border-zinc-200">
                <h3 className="font-semibold text-sm text-zinc-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-zinc-600" />
                  </div>
                  Pharmacy Location
                </h3>
                <div className="bg-zinc-50 rounded-xl p-4 mb-4">
                  <p className="font-semibold text-zinc-900 text-sm mb-2">{pharmacy.pharmacy_name}</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {pharmacy.address}<br />
                      {pharmacy.city}, {pharmacy.province} {pharmacy.postal_code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {pharmacy.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `tel:${pharmacy.phone}`}
                      className="flex-1 h-11 text-xs font-semibold border-zinc-300 hover:bg-zinc-100"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDirections}
                    className="flex-1 h-11 text-xs font-semibold border-zinc-300 hover:bg-zinc-100"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                </div>
              </div>
            )}

            {/* Description */}
            {shift.description && (
              <div className="bg-white rounded-2xl p-5 border border-zinc-200">
                <h3 className="font-semibold text-sm text-zinc-900 mb-3">Description</h3>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {shift.description}
                </p>
              </div>
            )}

            {/* Shift Includes */}
            {shift.shift_includes && Object.values(shift.shift_includes).some(v => v) && (
              <div className="bg-white rounded-2xl p-5 border border-zinc-200">
                <h3 className="font-semibold text-sm text-zinc-900 mb-4">Shift Includes</h3>
                <div className="space-y-3">
                  {shift.shift_includes.assistant_on_site && (
                    <div className="flex items-center gap-3 text-sm text-zinc-700">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Assistant / Technician On Site</span>
                    </div>
                  )}
                  {shift.shift_includes.vaccination_injections && (
                    <div className="flex items-center gap-3 text-sm text-zinc-700">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Vaccination / Injection Services</span>
                    </div>
                  )}
                  {shift.shift_includes.addiction_dispensing && (
                    <div className="flex items-center gap-3 text-sm text-zinc-700">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Addiction Medication Dispensing</span>
                    </div>
                  )}
                  {shift.shift_includes.methadone_suboxone && (
                    <div className="flex items-center gap-3 text-sm text-zinc-700">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span>Methadone / Suboxone Dispensing</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requirements */}
            {(shift.requirements?.years_experience > 0 || shift.requirements?.software_experience?.length > 0) && (
              <div className="bg-white rounded-2xl p-5 border border-zinc-200">
                <h3 className="font-semibold text-sm text-zinc-900 mb-4">Requirements</h3>
                {shift.requirements.years_experience > 0 && (
                  <p className="text-sm text-zinc-700 mb-3">
                    • {shift.requirements.years_experience} year{shift.requirements.years_experience > 1 ? 's' : ''} experience
                  </p>
                )}
                {shift.requirements.software_experience?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {shift.requirements.software_experience.map((software, idx) => (
                      <Badge key={idx} className="bg-zinc-100 text-zinc-700 text-xs px-3 py-1.5 font-medium">
                        {software}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {shift.status === 'open' && !hasApplied && (
            <div className="border-t border-zinc-200 px-5 py-5 bg-white sticky bottom-0">
              <Button
                onClick={handleApply}
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold text-sm rounded-xl active:scale-[0.98] transition-all shadow-md"
              >
                <Send className="w-4 h-4 mr-2" />
                Apply for This Shift
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ApplicationDialog
        shift={shift}
        open={showApplicationDialog}
        onClose={() => setShowApplicationDialog(false)}
        userEmail={userEmail}
      />
    </>
  );
}