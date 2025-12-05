import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, User, Star, MapPin, Eye } from "lucide-react";
import { format } from "date-fns";

export default function ApplicationCard({ 
  app, 
  shift, 
  profile, 
  onViewDetails, 
  onAccept, 
  onViewProfile,
  isAccepting,
  getInitials 
}) {
  return (
    <Card className="hover:shadow-lg transition-all border-l-4 border-l-teal-600 bg-white">
      <CardContent className="p-3">
        {/* Header: Pharmacist Info */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-teal-100 shadow-sm">
            {getInitials(app.pharmacist_name)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm mb-1 truncate leading-tight">
              {app.pharmacist_name}
            </h3>
            
            {profile && (
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {profile.years_experience > 0 && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200">
                    {profile.years_experience}y
                  </Badge>
                )}
                {profile.rating > 0 && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-amber-50 text-amber-700 border-amber-200">
                    <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-500" />
                    {profile.rating.toFixed(1)}
                  </Badge>
                )}
                {profile.completed_shifts > 0 && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-green-50 text-green-700 border-green-200">
                    {profile.completed_shifts} shifts
                  </Badge>
                )}
              </div>
            )}

            <p className="text-[10px] text-gray-500">
              Applied {format(new Date(app.applied_date), 'MMM d, yyyy')}
            </p>
          </div>
          
          <Badge variant="outline" className={`${
            app.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-300' :
            app.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-300' :
            'bg-gray-100 text-gray-700 border-gray-300'
          } font-semibold text-[10px] h-5 px-2 whitespace-nowrap`}>
            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
          </Badge>
        </div>

        {/* Shift Info Section */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-2.5 mb-3 border border-teal-200">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-xs mb-0.5 truncate">
                {shift.pharmacy_name}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                <MapPin className="w-3 h-3 flex-shrink-0 text-teal-600" />
                <span className="truncate">{shift.pharmacy_city}</span>
              </div>
            </div>
            <Badge className="bg-green-600 text-white text-[10px] h-5 px-2 font-bold whitespace-nowrap">
              ${shift.is_multi_date && shift.shift_dates?.[0]?.hourly_rate || shift.hourly_rate}/hr
            </Badge>
          </div>
          
          {shift.is_multi_date && shift.shift_dates?.length > 1 ? (
            <Badge className="bg-teal-600 text-white text-[10px] h-5 px-2">
              {shift.shift_dates.length} Dates
            </Badge>
          ) : (
            <div className="flex items-center gap-2.5 text-[10px] text-gray-700">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-teal-600" />
                <span className="font-medium">{format(new Date(shift.shift_date), 'MMM d')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-600" />
                <span className="font-medium">{shift.start_time} - {shift.end_time}</span>
              </div>
            </div>
          )}
        </div>

        {/* Cover Letter Preview */}
        {app.cover_letter && (
          <div className="bg-blue-50 rounded-lg p-2.5 mb-3 border border-blue-200">
            <p className="text-[9px] text-blue-700 mb-1 font-bold uppercase tracking-wide">Cover Letter</p>
            <p className="text-[10px] text-gray-700 italic line-clamp-2 leading-relaxed">
              "{app.cover_letter}"
            </p>
          </div>
        )}

        {/* Action Buttons - Improved Layout */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1 h-9 text-[10px] font-semibold border-teal-300 hover:bg-teal-50 hover:border-teal-400"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Details
          </Button>
          
          {onViewProfile && profile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProfile}
              className="flex-1 h-9 text-[10px] font-semibold border-gray-300 hover:bg-gray-50"
            >
              <User className="w-3.5 h-3.5 mr-1" />
              Profile
            </Button>
          )}
          
          {app.status === 'pending' && onAccept && (
            <Button
              size="sm"
              onClick={onAccept}
              disabled={isAccepting}
              className="flex-1 h-9 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-[10px] font-bold shadow-md active:scale-[0.98] transition-transform"
            >
              {isAccepting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Accept ($50)
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}