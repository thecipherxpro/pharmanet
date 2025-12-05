import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ShiftCompletionModal({ 
  open, 
  onClose, 
  shift, 
  onConfirm, 
  isProcessing,
  userType // 'employer' or 'pharmacist'
}) {
  const [actualHours, setActualHours] = useState(shift?.total_hours || 0);
  const [notes, setNotes] = useState("");
  const [confirmedDetails, setConfirmedDetails] = useState({
    startTime: shift?.start_time || "",
    endTime: shift?.end_time || "",
    breaks: 0
  });

  const handleConfirm = () => {
    onConfirm({
      actualHours,
      notes,
      confirmedDetails
    });
  };

  if (!shift) return null;

  const calculatedPay = actualHours * (shift.hourly_rate || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Confirm Shift Completion
          </DialogTitle>
          <DialogDescription className="pt-2">
            Please verify the shift details before marking as complete
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Shift Info */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {shift.pharmacy_name}
            </p>
            <p className="text-xs text-gray-600">
              {format(new Date(shift.shift_date), "EEEE, MMM d, yyyy")}
            </p>
          </div>

          {/* Time Confirmation */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Actual Shift Times</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startTime" className="text-xs text-gray-600">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={confirmedDetails.startTime}
                  onChange={(e) => setConfirmedDetails({ ...confirmedDetails, startTime: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-xs text-gray-600">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={confirmedDetails.endTime}
                  onChange={(e) => setConfirmedDetails({ ...confirmedDetails, endTime: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Hours Worked */}
          <div>
            <Label htmlFor="actualHours" className="text-sm font-semibold mb-2 block">
              Total Hours Worked
            </Label>
            <Input
              id="actualHours"
              type="number"
              step="0.5"
              min="0"
              value={actualHours}
              onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
              className="h-11"
            />
            <p className="text-xs text-gray-500 mt-1">
              Scheduled: {shift.total_hours} hours
            </p>
          </div>

          {/* Payment Calculation */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-3 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Payment</span>
              <span className="text-2xl font-bold text-green-700">
                ${calculatedPay.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {actualHours} hrs × ${shift.hourly_rate}/hr
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-semibold mb-2 block">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about the shift..."
              className="h-20 resize-none"
            />
          </div>

          {/* Warning */}
          {userType === 'employer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Confirming will mark the shift as complete and process payment to the pharmacist.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || actualHours <= 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Complete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}