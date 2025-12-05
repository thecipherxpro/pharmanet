import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  Users, 
  CheckCircle, 
  Building2, 
  ArrowRight,
  Edit2,
  Trash2,
  Eye,
  Layers
} from "lucide-react";
import { format } from "date-fns";
import { RateCalculator } from "./RateCalculator";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatTime12Hour, parseLocalDate } from "../utils/timeUtils";
import { getShiftDates, getPrimaryDate, isMultiDateShift, getDateCount } from "../utils/shiftDateUtils";
import DeleteShiftModal from "./DeleteShiftModal";
import { toast } from "@/components/ui/use-toast";

export default function ShiftCard({ shift, isEmployer, userEmail }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Use unified shift date utilities
  const dates = getShiftDates(shift);
  const isMultiDate = isMultiDateShift(shift);
  const primaryDate = getPrimaryDate(shift) || {
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    status: 'open',
    hourly_rate: shift.hourly_rate,
    total_pay: shift.total_pay,
    urgency_level: shift.urgency_level,
    total_hours: shift.total_hours
  };

  const { data: applications } = useQuery({
    queryKey: ['applications', shift.id],
    queryFn: () => base44.entities.ShiftApplication.filter({ shift_id: shift.id }),
    enabled: isEmployer,
    initialData: [],
  });

  const { data: myApplication } = useQuery({
    queryKey: ['myApplication', shift.id, userEmail],
    queryFn: () => base44.entities.ShiftApplication.filter({ 
      shift_id: shift.id, 
      pharmacist_email: userEmail 
    }),
    enabled: !isEmployer && !!userEmail,
    initialData: [],
  });

  const hasApplied = myApplication && myApplication.length > 0;
  const applicationStatus = hasApplied ? myApplication[0].status : null;
  const config = RateCalculator.getUrgencyConfig(primaryDate.urgency_level || shift.urgency_level);

  const handleViewDetails = () => {
    if (shift.status === "filled" && isEmployer) {
      // Go to filled shift details page for employers
      navigate(createPageUrl("FilledShiftDetails") + `?id=${shift.id}`);
    } else {
      // Go to regular shift details page
      navigate(createPageUrl("ShiftDetails") + `?id=${shift.id}`);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(createPageUrl("EditShift") + `?id=${shift.id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['myShifts'] });
    queryClient.invalidateQueries({ queryKey: ['employerShifts'] });
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all border border-gray-200 relative">
        {/* Applied Badge - Top Right Corner */}
        {hasApplied && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className={`shadow-md ${
              applicationStatus === 'accepted' ? 'bg-green-600 hover:bg-green-700' :
              applicationStatus === 'pending' ? 'bg-blue-600 hover:bg-blue-700' :
              'bg-gray-600 hover:bg-gray-700'
            }`}>
              <CheckCircle className="w-3 h-3 mr-1" />
              {applicationStatus === 'accepted' ? 'Accepted' : 
               applicationStatus === 'pending' ? 'Applied' : 'Applied'}
            </Badge>
          </div>
        )}

        <CardContent className="p-4 sm:p-5">
          {/* Multi-Date Badge */}
          {isMultiDate && (
            <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0 text-xs mb-3">
              <Layers className="w-3 h-3 mr-1" />
              {getDateCount(shift)} Dates
            </Badge>
          )}

          {/* Header with Edit/Delete for Employers */}
          <div className="flex justify-between items-start mb-3 gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                  {shift.pharmacy_name}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{shift.pharmacy_city}, {shift.pharmacy_province}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={`${config.color} border-2 whitespace-nowrap text-xs sm:text-sm`}>
                {config.label}
              </Badge>
              
              {/* Edit & Delete Icons for Employers */}
              {isEmployer && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleEdit}
                    className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors group"
                    title="Edit Shift"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors group"
                    title="Delete Shift"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Shift Type & Title */}
          {shift.title && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900">{shift.title}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {shift.shift_type?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Rate & Date */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    ${primaryDate.hourly_rate}
                  </span>
                  <span className="text-sm text-gray-600">/hr</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{isMultiDate ? 'Total (All)' : 'Total Pay'}</p>
                <p className="font-bold text-gray-900 text-sm sm:text-base">
                  ${shift.total_pay?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Shift Details */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">
                {isMultiDate 
                  ? `${getDateCount(shift)} dates starting ${primaryDate.date ? format(parseLocalDate(primaryDate.date), "MMM d") : 'N/A'}`
                  : primaryDate.date ? format(parseLocalDate(primaryDate.date), "EEEE, MMM d, yyyy") : 'No date set'
                }
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>
                {formatTime12Hour(primaryDate.start_time)} - {formatTime12Hour(primaryDate.end_time)} ({primaryDate.total_hours}h)
              </span>
            </div>
          </div>

          {/* Shift Includes Badges */}
          {shift.shift_includes && Object.values(shift.shift_includes).some(v => v) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {shift.shift_includes.assistant_on_site && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Assistant On Site
                </Badge>
              )}
              {shift.shift_includes.vaccination_injections && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Vaccinations
                </Badge>
              )}
              {shift.shift_includes.methadone_suboxone && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  Methadone/Suboxone
                </Badge>
              )}
            </div>
          )}

          {/* Status & View Details Button */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {isEmployer ? (
                <>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {applications?.length || 0} applicants
                  </Badge>
                  <Badge 
                    variant={shift.status === "open" || shift.status === "filled" ? "default" : "secondary"}
                    className={
                      shift.status === "open" ? "bg-gray-900" : 
                      shift.status === "filled" ? "bg-green-600" : 
                      ""
                    }
                  >
                    {shift.status}
                  </Badge>
                </>
              ) : null}
            </div>

            {/* View Details Button */}
            <Button
              onClick={handleViewDetails}
              variant={shift.status === "filled" && isEmployer ? "default" : "outline"}
              size="sm"
              className={`gap-2 transition-colors ${
                shift.status === "filled" && isEmployer 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "hover:bg-gray-900 hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4" />
              {shift.status === "filled" && isEmployer ? "View Filled Shift" : "View Details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Modal with Validation */}
      <DeleteShiftModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        shift={shift}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}