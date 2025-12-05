import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Building2 } from "lucide-react";

export default function SkipPharmacyWarning({ open, onClose, onAddPharmacy, onSkip }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Pharmacy Required
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            You need at least one pharmacy location to post shifts and hire pharmacists.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 rounded-xl p-4 my-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Without a pharmacy you cannot:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Post shift opportunities</li>
                <li>• Receive applications</li>
                <li>• Hire pharmacists</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            I'll Add Later
          </Button>
          <Button
            onClick={onAddPharmacy}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Add Pharmacy
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-gray-500 mt-2">
          You can add pharmacies anytime from your dashboard
        </p>
      </DialogContent>
    </Dialog>
  );
}