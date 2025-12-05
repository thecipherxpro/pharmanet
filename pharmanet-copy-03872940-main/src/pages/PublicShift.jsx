import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, DollarSign, Building2, ArrowLeft, AlertCircle, Layers, TrendingUp } from "lucide-react";
import { getScheduleFromShift, getStatusColorClass } from "../components/utils/shiftUtils";
import { formatTime12Hour, safeFormat } from "../components/utils/timeUtils";

export default function PublicShift() {
  const [searchParams] = useSearchParams();
  const shiftId = searchParams.get("id");
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShift = async () => {
      if (!shiftId) {
        setError("No shift ID provided");
        setLoading(false);
        return;
      }

      try {
        // Using filter to find the shift by ID
        const shifts = await base44.entities.Shift.filter({ id: shiftId });
        if (shifts && shifts.length > 0) {
          setShift(shifts[0]);
        } else {
          setError("Shift not found");
        }
      } catch (err) {
        console.error("Error fetching shift:", err);
        setError("Failed to load shift details");
      } finally {
        setLoading(false);
      }
    };

    fetchShift();
  }, [shiftId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Not Found</h2>
            <p className="text-gray-600 mb-6">
              The shift you are looking for might have been removed or is no longer available.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const schedule = getScheduleFromShift(shift);
  const isMultiDate = schedule.length > 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header / Nav */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
               <Building2 className="w-5 h-5 text-white" />
             </div>
             <h1 className="text-xl font-bold text-gray-900">Pharmanet</h1>
           </div>
           <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
             Login / Sign Up
           </Button>
        </div>

        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-3 backdrop-blur-sm">
                  {shift.status === 'open' ? 'Open Shift' : shift.status}
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">{shift.pharmacy_name}</h2>
                <div className="flex items-center gap-2 text-teal-50">
                  <MapPin className="w-4 h-4" />
                  <span>{shift.pharmacy_city}, {shift.pharmacy_province}</span>
                </div>
              </div>
              <div className={`rounded-xl p-4 backdrop-blur-md border min-w-[140px] text-center ${
                shift.custom_hourly_rate 
                  ? 'bg-purple-500/20 border-purple-300/30' 
                  : 'bg-white/10 border-white/20'
              }`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-sm text-teal-50">Hourly Rate</p>
                  {shift.custom_hourly_rate && (
                    <TrendingUp className="w-3.5 h-3.5 text-purple-200" />
                  )}
                </div>
                <p className="text-3xl font-bold">${shift.hourly_rate}</p>
                <p className="text-xs text-teal-100">/hour</p>
                {shift.custom_hourly_rate && (
                  <p className="text-[10px] text-purple-200 mt-1 font-medium">Premium Rate</p>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-8">
            {/* Description */}
            {shift.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {shift.description}
                </p>
              </div>
            )}

            {/* Schedule */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Shift Schedule
                </h3>
                {isMultiDate && (
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                    <Layers className="w-3 h-3 mr-1" />
                    {schedule.length} Shifts
                  </Badge>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {schedule.map((item, index) => (
                  <div 
                    key={index}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      index !== schedule.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 font-bold text-gray-600 text-xs shadow-sm">
                        {safeFormat(item.date, 'MMM', 'N/A')}
                        <br/>
                        {safeFormat(item.date, 'd', '')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {safeFormat(item.date, 'EEEE, MMMM d, yyyy', 'Date not set')}
                        </p>
                        <p className="text-sm text-gray-500 sm:hidden">
                          {formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift Includes / Features */}
            {shift.shift_includes && Object.values(shift.shift_includes).some(Boolean) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Shift Details</h3>
                <div className="flex flex-wrap gap-2">
                  {shift.shift_includes.assistant_on_site && (
                    <Badge variant="outline" className="py-1.5 px-3 border-blue-200 bg-blue-50 text-blue-700">
                      Assistant On-Site
                    </Badge>
                  )}
                  {shift.shift_includes.vaccination_injections && (
                    <Badge variant="outline" className="py-1.5 px-3 border-green-200 bg-green-50 text-green-700">
                      Vaccinations
                    </Badge>
                  )}
                  {shift.shift_includes.methadone_suboxone && (
                    <Badge variant="outline" className="py-1.5 px-3 border-purple-200 bg-purple-50 text-purple-700">
                      Methadone/Suboxone
                    </Badge>
                  )}
                  {shift.shift_includes.addiction_dispensing && (
                     <Badge variant="outline" className="py-1.5 px-3 border-orange-200 bg-orange-50 text-orange-700">
                      Addiction Dispensing
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="pt-4">
              <Button 
                className="w-full h-12 text-lg font-semibold bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20"
                onClick={() => window.location.href = `/?redirect=apply&shiftId=${shift.id}`}
              >
                Apply for This Shift
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">
                You need to be logged in to apply.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}