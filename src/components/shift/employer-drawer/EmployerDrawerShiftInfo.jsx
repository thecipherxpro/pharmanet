import React from "react";
import { Calendar, Clock, DollarSign, Layers, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../../utils/timeUtils";
import { getScheduleFromShift } from "../../utils/shiftUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'filled': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />;
    case 'cancelled': return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    default: return <AlertCircle className="w-3.5 h-3.5 text-gray-400" />;
  }
};

export default function EmployerDrawerShiftInfo({ shift }) {
  // Use unified schedule getter
  const schedule = getScheduleFromShift(shift);
  const isMultiDate = schedule.length > 1;
  const displayDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold text-sm text-gray-900">Schedule & Pay</h3>
          
          {/* Rate Section */}
          <div className="flex items-center justify-between rounded-xl p-3 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Hourly Rate</p>
                <p className="text-lg font-bold text-gray-900">${shift.hourly_rate || 50}/hr</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Total Pay</p>
              <p className="text-sm font-bold text-gray-900">${shift.total_pay?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Dates List */}
          {isMultiDate ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-medium text-gray-700">{schedule.length} Scheduled Shifts</span>
              </div>
              <div className="space-y-2 pl-1">
                {schedule.map((dateInfo, idx) => {
                  let formattedDate = 'Date not set';
                  if (dateInfo.date && /^\d{4}-\d{2}-\d{2}$/.test(dateInfo.date)) {
                    const [year, month, day] = dateInfo.date.split('-').map(Number);
                    if (year && month && day) {
                      try {
                        formattedDate = format(new Date(year, month - 1, day), "MMM d, yyyy");
                      } catch (e) {
                        formattedDate = 'Date not set';
                      }
                    }
                  }
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-blue-400 rounded-full" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formattedDate}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime12Hour(dateInfo.start_time)} - {formatTime12Hour(dateInfo.end_time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Date</span>
                </div>
                <p className="font-semibold text-sm text-gray-900">
                  {(() => {
                    if (!displayDate.date || !/^\d{4}-\d{2}-\d{2}$/.test(displayDate.date)) return 'Date not set';
                    const [year, month, day] = displayDate.date.split('-').map(Number);
                    if (!year || !month || !day) return 'Date not set';
                    try {
                      return format(new Date(year, month - 1, day), "MMM d, yyyy");
                    } catch (e) {
                      return 'Date not set';
                    }
                  })()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Time</span>
                </div>
                <p className="font-semibold text-sm text-gray-900">
                  {formatTime12Hour(displayDate.start_time)} - {formatTime12Hour(displayDate.end_time)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description & Requirements */}
      <Card className="border-0 shadow-sm ring-1 ring-gray-100">
        <CardContent className="p-4 space-y-4">
          {shift.description && (
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-xl border border-gray-100">
                {shift.description}
              </p>
            </div>
          )}

          {(shift.requirements?.years_experience > 0 || shift.requirements?.software_experience?.length > 0) && (
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2">Requirements</h3>
              <div className="flex flex-wrap gap-2">
                {shift.requirements.years_experience > 0 && (
                  <Badge variant="secondary" className="px-3 py-1 h-7">
                    {shift.requirements.years_experience}+ Years Exp
                  </Badge>
                )}
                {shift.requirements.software_experience?.map((software, idx) => (
                  <Badge key={idx} variant="outline" className="px-3 py-1 h-7 border-gray-300">
                    {software}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}