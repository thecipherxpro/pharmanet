import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ClosedShiftCard({ shift, onRepost }) {
  const isExpired = new Date(shift.shift_date + 'T' + shift.end_time) < new Date();

  return (
    <Card className="border-2 border-gray-300 bg-gray-50 rounded-2xl overflow-hidden">
      <CardContent className="p-5">
        {/* Header with Status Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{shift.title}</h3>
            <p className="text-sm text-gray-600">{shift.pharmacy_name}</p>
          </div>
          <Badge className="bg-gray-600 text-white">
            Closed
          </Badge>
        </div>

        {/* Expired Notice */}
        {isExpired && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <p className="text-xs text-orange-800 font-medium">
              This shift expired unfilled on {format(new Date(shift.shift_date), 'MMM d, yyyy')}
            </p>
          </div>
        )}

        {/* Shift Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-semibold text-gray-700">
                {format(new Date(shift.shift_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="text-sm font-semibold text-gray-700">
                {shift.start_time} - {shift.end_time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Rate</p>
              <p className="text-sm font-semibold text-gray-700">
                ${shift.hourly_rate}/hr
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm font-semibold text-gray-700">
                {shift.pharmacy_city}
              </p>
            </div>
          </div>
        </div>

        {/* Closed Info */}
        {shift.closed_at && (
          <div className="text-xs text-gray-500 mb-4">
            Closed on {format(new Date(shift.closed_at), 'MMM d, yyyy h:mm a')}
          </div>
        )}

        {/* Re-Post Button */}
        <Button
          onClick={() => onRepost(shift)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12 font-semibold shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-Post with New Dates
        </Button>
      </CardContent>
    </Card>
  );
}