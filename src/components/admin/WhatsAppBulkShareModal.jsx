import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Send,
  CheckCircle2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { parseLocalDate, formatTime12Hour } from "../utils/timeUtils";
import { getScheduleFromShift } from "../utils/shiftUtils";

// WhatsApp icon component
function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function safeGetSchedule(shift) {
  try {
    const schedule = getScheduleFromShift(shift);
    return Array.isArray(schedule) ? schedule : [];
  } catch {
    return [];
  }
}

function safeFormatDate(dateStr, formatStr = 'MMM d') {
  try {
    if (!dateStr) return 'No date';
    const parsed = parseLocalDate(dateStr);
    if (!parsed || isNaN(parsed.getTime())) return 'Invalid date';
    return format(parsed, formatStr);
  } catch {
    return 'Invalid date';
  }
}

export default function WhatsAppBulkShareModal({ open, onOpenChange, shifts = [] }) {
  const [selectedCount, setSelectedCount] = useState(5);
  const [selectedShiftIds, setSelectedShiftIds] = useState(new Set());

  // Get open shifts sorted by created date (most recent first)
  const openShifts = shifts
    .filter(s => s?.status === "open")
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 10);

  // Auto-select shifts based on count
  React.useEffect(() => {
    const autoSelected = new Set(openShifts.slice(0, selectedCount).map(s => s.id));
    setSelectedShiftIds(autoSelected);
  }, [selectedCount, openShifts.length]);

  const toggleShift = (shiftId) => {
    setSelectedShiftIds(prev => {
      const next = new Set(prev);
      if (next.has(shiftId)) {
        next.delete(shiftId);
      } else {
        next.add(shiftId);
      }
      return next;
    });
  };

  const handleShare = () => {
    const selectedShifts = openShifts.filter(s => selectedShiftIds.has(s.id));
    
    if (selectedShifts.length === 0) return;

    // Build the message
    let message = `🏥 *Hello Pharmacist!*\n\nThere are shifts with *Great Pay* awaiting your review!\n\n`;
    message += `📋 *${selectedShifts.length} Available Shift${selectedShifts.length > 1 ? 's' : ''}:*\n\n`;

    selectedShifts.forEach((shift, idx) => {
      const schedule = safeGetSchedule(shift);
      const primaryDate = schedule[0] || {};
      const dateCount = schedule.length;
      
      message += `*${idx + 1}. ${shift.pharmacy_name || 'Pharmacy'}*\n`;
      message += `📍 ${shift.pharmacy_city || 'Ontario'}\n`;
      message += `📅 ${safeFormatDate(primaryDate.date, 'EEE, MMM d')}${dateCount > 1 ? ` (+${dateCount - 1} more)` : ''}\n`;
      message += `⏰ ${formatTime12Hour(primaryDate.start_time || '09:00')} - ${formatTime12Hour(primaryDate.end_time || '17:00')}\n`;
      message += `💰 *$${shift.hourly_rate || 50}/hr* (Total: $${shift.total_pay || 0})\n`;
      
      // Generate public shift link
      const baseUrl = window.location.origin;
      const shiftLink = `${baseUrl}/PublicShift?id=${shift.id}`;
      message += `🔗 ${shiftLink}\n\n`;
    });

    message += `\n✨ Apply now before they're filled!\n`;
    message += `📲 View all shifts: ${window.location.origin}/BrowseShifts`;

    // Open WhatsApp with the message
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <WhatsAppIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">Share Shifts on WhatsApp</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">Select shifts to share with pharmacists</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Quick Select Buttons */}
          <div className="flex items-center gap-2 py-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-600">Quick select:</span>
            <div className="flex gap-2">
              {[5, 10].map(count => (
                <button
                  key={count}
                  onClick={() => setSelectedCount(count)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCount === count
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Last {count}
                </button>
              ))}
            </div>
            <Badge variant="outline" className="ml-auto text-xs">
              {selectedShiftIds.size} selected
            </Badge>
          </div>

          {/* Shifts List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {openShifts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No open shifts available</p>
              </div>
            ) : (
              openShifts.map((shift) => {
                const schedule = safeGetSchedule(shift);
                const primaryDate = schedule[0] || {};
                const isSelected = selectedShiftIds.has(shift.id);

                return (
                  <div
                    key={shift.id}
                    onClick={() => toggleShift(shift.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isSelected 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {shift.pharmacy_name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate mb-2">{shift.title}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {shift.pharmacy_city || 'Ontario'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {safeFormatDate(primaryDate.date)}
                            {schedule.length > 1 && <span className="text-gray-400">(+{schedule.length - 1})</span>}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-green-700">
                            <DollarSign className="w-3 h-3" />
                            ${shift.hourly_rate || 50}/hr
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100">
            <Button
              onClick={handleShare}
              disabled={selectedShiftIds.size === 0}
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl gap-2"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Share {selectedShiftIds.size} Shift{selectedShiftIds.size !== 1 ? 's' : ''} on WhatsApp
            </Button>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Opens WhatsApp with a pre-filled message containing shift details
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}