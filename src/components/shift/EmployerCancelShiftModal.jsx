import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";

export default function EmployerCancelShiftModal({ 
  shift, 
  open, 
  onClose, 
  onConfirmCancel,
  isCancelling 
}) {
  const [reason, setReason] = useState("");

  if (!shift) return null;

  // Calculate hours before shift
  const shiftDateTime = new Date(`${shift.shift_date}T${shift.start_time}`);
  const now = new Date();
  const hoursBeforeStart = Math.floor((shiftDateTime - now) / (1000 * 60 * 60));

  // Calculate penalty
  let penaltyAmount = 0;
  let pharmacistCompensation = 0;
  let penaltyMessage = "";

  if (hoursBeforeStart >= 120) {
    penaltyAmount = 0;
    pharmacistCompensation = 0;
    penaltyMessage = "No cancellation fee (5+ days notice)";
  } else if (hoursBeforeStart >= 72) {
    penaltyAmount = 50;
    pharmacistCompensation = 0;
    penaltyMessage = "$50 cancellation fee (3-5 days notice)";
  } else if (hoursBeforeStart >= 48) {
    penaltyAmount = 100;
    pharmacistCompensation = 50;
    penaltyMessage = "$100 fee: $50 to pharmacist as compensation";
  } else if (hoursBeforeStart >= 24) {
    penaltyAmount = 150;
    pharmacistCompensation = 80;
    penaltyMessage = "$150 fee: $80 to pharmacist as compensation";
  } else {
    penaltyAmount = 300;
    pharmacistCompensation = 200;
    penaltyMessage = "$300 fee: $200 to pharmacist as compensation";
  }

  const handleCancel = () => {
    onConfirmCancel(shift.id, reason);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-red-600">
            Cancel Shift?
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            This action will cancel the shift and notify the pharmacist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shift Info */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Shift Details</p>
            <p className="font-semibold text-gray-900 text-sm">
              {shift.pharmacy_name}
            </p>
            <p className="text-xs text-gray-600">
              {format(new Date(shift.shift_date), "MMM d, yyyy")} • {shift.start_time} - {shift.end_time}
            </p>
            {shift.assigned_to && (
              <p className="text-xs text-blue-600 mt-1">
                Assigned to: {shift.assigned_to}
              </p>
            )}
          </div>

          {/* Time Notice */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-900">
                Notice Period
              </p>
            </div>
            <p className="text-sm text-blue-800">
              {hoursBeforeStart} hours before shift start
            </p>
          </div>

          {/* Penalty Warning */}
          <div className={`rounded-lg p-3 border ${
            penaltyAmount === 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2 mb-2">
              {penaltyAmount === 0 ? (
                <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-900 mb-1">
                  Cancellation Fee
                </p>
                <p className={`text-2xl font-bold mb-1 ${
                  penaltyAmount === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${penaltyAmount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-700">
                  {penaltyMessage}
                </p>
              </div>
            </div>

            {pharmacistCompensation > 0 && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <p className="text-xs text-gray-700">
                  💰 The pharmacist will receive ${pharmacistCompensation} compensation for the late cancellation
                </p>
              </div>
            )}
          </div>

          {/* Cancellation Reason */}
          <div>
            <Label htmlFor="reason" className="text-sm font-medium mb-2 block">
              Reason for Cancellation (Optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Provide a reason for cancelling this shift..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] text-sm"
              rows={3}
            />
          </div>

          {penaltyAmount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Payment Required:</strong> The cancellation fee will be charged to your default payment card.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isCancelling}
            className="flex-1"
          >
            Keep Shift
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isCancelling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Cancelling...
              </>
            ) : (
              `Cancel Shift${penaltyAmount > 0 ? ` ($${penaltyAmount})` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}