import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Building2, 
  ChevronDown,
  ChevronUp,
  Layers,
  Users,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Send,
  Share2,
  Layers2
} from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../utils/timeUtils";
import { RateCalculator } from "./RateCalculator";
import { getScheduleFromShift } from "../utils/shiftUtils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Unified Shift Card Component
 * Works consistently for both Employer and Pharmacist views
 * 
 * Props:
 * - shift: The shift object (must have shift_dates array)
 * - viewType: 'employer' | 'pharmacist'
 * - applications: Array of applications (employer view)
 * - hasApplied: Boolean if current user applied (pharmacist view)
 * - applicationStatus: Status of user's application (pharmacist view)
 * - onEdit: Edit handler (employer view)
 * - onDelete: Delete handler (employer view)
 * - onViewDetails: View details handler
 * - onApply: Apply handler (pharmacist view)
 * - onMessage: Message handler
 */
export default function UnifiedShiftCard({ 
  shift, 
  viewType = 'pharmacist',
  applications = [],
  hasApplied = false,
  applicationStatus = null,
  onEdit,
  onDelete,
  onViewDetails,
  onApply
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (!shift) return null;

  const isEmployer = viewType === 'employer';

  // Get schedule from shift (handles both new 'schedule' and legacy 'shift_dates')
  const schedule = getScheduleFromShift(shift);
  
  // Fallback if no schedule
  const dates = schedule.length > 0 
    ? schedule 
    : [{
        date: '',
        start_time: '09:00',
        end_time: '17:00'
      }];

  const isMultiDate = dates.length > 1;
  const primaryDate = dates[0];
  const config = RateCalculator.getUrgencyConfig(shift.pricing_tier || shift.urgency_level);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(shift);
    } else if (isEmployer) {
      navigate(createPageUrl("FilledShiftDetails") + `?id=${shift.id}`);
    }
    // For pharmacist without onViewDetails handler, do nothing - drawer should be used
  };

  const handleEdit = (e) => {
    e?.stopPropagation();
    if (onEdit) onEdit(shift);
  };

  const handleDelete = (e) => {
    e?.stopPropagation();
    if (onDelete) onDelete(shift);
  };

  const handleApply = () => {
    // Always use onViewDetails to open drawer for pharmacists
    if (onViewDetails) {
      onViewDetails(shift);
    } else if (onApply) {
      onApply(shift);
    }
    // Never navigate to ShiftDetails page for unapplied shifts
  };

  const handleWhatsAppShare = (e) => {
    e?.stopPropagation();
    
    // Use PublicShift URL for sharing
    const publicUrl = `https://shifts.pharmanet.ca/PublicShift?id=${shift.id}`;
    
    let scheduleText = "Shift Dates :";
    if (schedule.length > 0) {
      scheduleText += schedule.map(s => {
        const d = formatDateSafe(s.date, "EEE, MMM d");
        const t = `${formatTime12Hour(s.start_time)} - ${formatTime12Hour(s.end_time)}`;
        return `\n\n→ ${d}\n[${t}]`;
      }).join("");
    } else {
      scheduleText += "\nDate TBD";
    }
    
    const message = `🏥 *Shift Available*\n\n📍 ${shift.pharmacy_name}\n🏙️ ${shift.pharmacy_city}\n\n📋 *${shift.title || 'Shift Details'}*\n📝 ${shift.description || 'No description provided'}\n\n${scheduleText}\n\nTo View Hourly Rates, More Details & Apply, Click Here --> ${publicUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Format date safely - validates before calling format()
  const formatDateSafe = (dateString, formatStr = "EEE, MMM d") => {
    if (!dateString || typeof dateString !== 'string') return 'Date not set';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return 'Date not set';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      if (!year || !month || !day) return 'Date not set';
      return format(new Date(year, month - 1, day), formatStr);
    } catch {
      return 'Date not set';
    }
  };

  return (
    <Card className={`border-0 shadow-sm bg-white rounded-2xl overflow-hidden ring-1 ring-gray-100 hover:shadow-md transition-all ${
      isMultiDate ? 'ring-teal-200' : ''
    }`}>
      <CardContent className="p-4">
        {/* Multi-Date Badge */}
        {isMultiDate && (
          <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0 text-xs mb-3 shadow-sm">
            <Layers className="w-3 h-3 mr-1" />
            {dates.length} Dates
          </Badge>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <h3 className="font-bold text-base text-gray-900 truncate">
                {shift.pharmacy_name}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{shift.pharmacy_city}, {shift.pharmacy_province}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={`${config.color} border whitespace-nowrap text-xs`}>
              {config.label}
            </Badge>
            
            {/* Employer Edit/Delete Actions */}
            {isEmployer && shift.status === 'open' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleEdit}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-600 hover:text-blue-600" />
                </button>
                <button
                  onClick={handleDelete}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-600" />
                </button>
              </div>
            )}

            {/* Pharmacist Applied Badge */}
            {!isEmployer && hasApplied && (
              <Badge className={`shadow-sm ${
                applicationStatus === 'accepted' ? 'bg-green-600' :
                applicationStatus === 'pending' ? 'bg-blue-600' :
                applicationStatus === 'rejected' ? 'bg-red-600' : 'bg-gray-600'
              }`}>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {applicationStatus === 'accepted' ? 'Accepted' : 
                 applicationStatus === 'rejected' ? 'Rejected' : 'Applied'}
              </Badge>
            )}
          </div>
        </div>

        {/* Shift Title */}
        {shift.title && (
          <p className="text-sm font-medium text-gray-700 mb-3 truncate">{shift.title}</p>
        )}

        {/* Rate & Pay Summary */}
        <div className="rounded-xl p-3 mb-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-600" />
              <div>
                <span className="text-xl font-bold text-gray-900">
                  ${shift.hourly_rate || 50}
                </span>
                <span className="text-sm text-gray-600">/hr</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{isMultiDate ? 'Total (All)' : 'Total Pay'}</p>
              <p className="font-bold text-teal-700">
                ${shift.total_pay?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          
          {/* Time Range */}
          <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {formatTime12Hour(primaryDate.start_time)} - {formatTime12Hour(primaryDate.end_time)}
              {shift.total_hours && <span className="text-gray-400 ml-1">({shift.total_hours}h)</span>}
            </span>
          </div>
        </div>

        {/* Date List */}
        <div className="space-y-2 mb-3">
          {/* Show first date always */}
          <DateItem 
            dateInfo={primaryDate} 
            onClick={handleViewDetails}
          />

          {/* Show additional dates when expanded */}
          {isMultiDate && (
            <>
              {expanded && dates.slice(1).map((dateInfo, idx) => (
                <DateItem 
                  key={idx} 
                  dateInfo={dateInfo} 
                  onClick={handleViewDetails}
                />
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full h-8 text-teal-600 hover:bg-teal-50 text-xs"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    +{dates.length - 1} More Date{dates.length - 1 > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Shift Features */}
        {shift.shift_includes && Object.values(shift.shift_includes).some(v => v) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {shift.shift_includes.assistant_on_site && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Assistant
              </Badge>
            )}
            {shift.shift_includes.vaccination_injections && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Vaccinations
              </Badge>
            )}
            {shift.shift_includes.methadone_suboxone && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                Methadone
              </Badge>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {isEmployer ? (
            <>
              {/* Employer: Applications count + View */}
              <Badge variant="outline" className="flex items-center gap-1 h-8 px-3">
                <Users className="w-3.5 h-3.5" />
                {applications.length} applicant{applications.length !== 1 ? 's' : ''}
              </Badge>
              
              <Badge 
                className={`h-8 px-3 ${
                  shift.status === 'open' ? 'bg-gray-900' : 
                  shift.status === 'filled' ? 'bg-green-600' : 
                  shift.status === 'completed' ? 'bg-blue-600' : 'bg-gray-500'
                }`}
              >
                {shift.status}
              </Badge>
              
              <div className="flex-1" />

              <button
                onClick={handleWhatsAppShare}
                className="h-8 w-8 rounded-lg bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
                title="Share on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-white" />
              </button>
              
              <Button
                onClick={handleViewDetails}
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Details
              </Button>
            </>
          ) : (
            <>
              {/* Pharmacist: Apply/View */}
              {hasApplied ? (
                <Button
                  onClick={handleViewDetails}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  View Details
                </Button>
              ) : (
                <Button
                  onClick={handleApply}
                  size="sm"
                  className="flex-1 h-9 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {isMultiDate ? 'View & Apply' : 'Apply Now'}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Date item sub-component
function DateItem({ dateInfo, onClick }) {
  const formatDateSafe = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return 'Date not set';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return 'Date not set';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      if (!year || !month || !day) return 'Date not set';
      return format(new Date(year, month - 1, day), "EEE, MMM d");
    } catch {
      return 'Date not set';
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all text-left"
    >
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="font-medium text-sm text-gray-900">
          {formatDateSafe(dateInfo.date)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {dateInfo.start_time} - {dateInfo.end_time}
      </div>
    </button>
  );
}