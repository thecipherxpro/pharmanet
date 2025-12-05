import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, DollarSign, Clock, Info } from "lucide-react";
import { format } from "date-fns";

export default function CancellationModal({ 
  open, 
  onClose, 
  shift, 
  onConfirm, 
  loading 
}) {
  if (!shift) return null;

  // Calculate hours until shift
  const shiftDateTime = new Date(`${shift.shift_date}T${shift.start_time}`);
  const now = new Date();
  const hoursUntilShift = Math.floor((shiftDateTime - now) / (1000 * 60 * 60));

  // Determine penalty
  let penaltyAmount = 0;
  let penaltyColor = "text-gray-900";
  let penaltyLevel = "none";

  if (hoursUntilShift >= 120) {
    penaltyAmount = 0;
    penaltyLevel = "none";
    penaltyColor = "text-green-600";
  } else if (hoursUntilShift >= 72) {
    penaltyAmount = 50;
    penaltyLevel = "low";
    penaltyColor = "text-yellow-600";
  } else if (hoursUntilShift >= 48) {
    penaltyAmount = 100;
    penaltyLevel = "medium";
    penaltyColor = "text-orange-600";
  } else if (hoursUntilShift >= 24) {
    penaltyAmount = 150;
    penaltyLevel = "high";
    penaltyColor = "text-red-600";
  } else {
    penaltyAmount = 300;
    penaltyLevel = "critical";
    penaltyColor = "text-red-700";
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Cancel Shift?
          </DialogTitle>
          <DialogDescription>
            Review the cancellation details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Shift Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{shift.pharmacy_name}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {format(new Date(shift.shift_date), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">
                  {shift.start_time} - {shift.end_time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pay:</span>
                <span className="font-bold text-green-600">
                  ${shift.total_pay?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Time Until Shift */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-800 font-medium">Time Until Shift</p>
              <p className="text-sm font-bold text-blue-900">
                {hoursUntilShift} hours ({Math.floor(hoursUntilShift / 24)} days)
              </p>
            </div>
          </div>

          {/* Penalty Warning */}
          <div className={`border-2 rounded-lg p-4 ${
            penaltyAmount === 0 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                penaltyAmount === 0 ? "bg-green-100" : "bg-red-100"
              }`}>
                <DollarSign className={`w-6 h-6 ${
                  penaltyAmount === 0 ? "text-green-600" : "text-red-600"
                }`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold mb-1 ${
                  penaltyAmount === 0 ? "text-green-900" : "text-red-900"
                }`}>
                  {penaltyAmount === 0 ? "No Penalty" : "Cancellation Penalty"}
                </h4>
                <p className={`text-2xl font-bold mb-2 ${penaltyColor}`}>
                  ${penaltyAmount.toFixed(2)}
                </p>
                <p className={`text-xs ${
                  penaltyAmount === 0 ? "text-green-800" : "text-red-800"
                }`}>
                  {penaltyAmount === 0 
                    ? "You're cancelling more than 5 days in advance - no penalty applies!"
                    : "This fee will be automatically charged to your default payment card."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Policy Reference */}
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Cancellation Policy:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>5+ days: No penalty</li>
                  <li>3-5 days: $50 fee</li>
                  <li>2-3 days: $100 fee</li>
                  <li>1-2 days: $150 fee</li>
                  <li>Less than 24 hours: $300 fee</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {penaltyAmount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 font-medium">
                ⚠️ By confirming, you acknowledge that ${penaltyAmount.toFixed(2)} will be charged to your payment card immediately.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Keep Shift
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={penaltyAmount === 0 ? "default" : "destructive"}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>Confirm Cancellation</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}