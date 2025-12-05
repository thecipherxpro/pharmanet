import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, DollarSign, Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

export default function AcceptConfirmationModal({ 
  open, 
  onClose, 
  onConfirm, 
  isAccepting,
  pharmacistName,
  shift 
}) {
  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg">Confirm Acceptance</DialogTitle>
          <DialogDescription className="text-sm pt-2">
            Review the details before accepting this application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pharmacist */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">Pharmacist</p>
            <p className="font-bold text-gray-900">{pharmacistName}</p>
          </div>

          {/* Shift Details */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600">Pharmacy</p>
                <p className="font-semibold text-sm text-gray-900">{shift.pharmacy_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600">Date</p>
                <p className="font-semibold text-sm text-gray-900">
                  {format(new Date(shift.shift_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600">Time</p>
                <p className="font-semibold text-sm text-gray-900">
                  {shift.start_time} - {shift.end_time}
                </p>
              </div>
            </div>
          </div>

          {/* Platform Fee Warning */}
          <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 text-sm mb-1">Platform Fee</p>
                <p className="text-xs text-amber-800 leading-relaxed mb-2">
                  A one-time acceptance fee will be charged to your account
                </p>
                <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-amber-200">
                  <span className="text-xs font-medium text-gray-700">Amount:</span>
                  <span className="text-lg font-bold text-amber-900">$50.00</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By accepting, you agree to hire this pharmacist and the $50 platform fee will be charged immediately.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAccepting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isAccepting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isAccepting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Accept & Pay $50
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}