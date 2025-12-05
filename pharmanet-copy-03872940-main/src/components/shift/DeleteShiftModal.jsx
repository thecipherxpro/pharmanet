import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Users, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DeleteShiftModal({ 
  open, 
  onClose, 
  shift,
  onSuccess 
}) {
  const [validationData, setValidationData] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Validate on open
  React.useEffect(() => {
    if (open && shift) {
      validateDeletion();
    }
  }, [open, shift]);

  const validateDeletion = async () => {
    setIsValidating(true);
    try {
      const response = await base44.functions.invoke('validateShiftDeletion', {
        shiftId: shift.id
      });
      setValidationData(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to validate shift deletion",
      });
    }
    setIsValidating(false);
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Cancel invitations and applications
      await base44.functions.invoke('cancelShiftInvitations', {
        shiftId: shift.id,
        reason: 'Shift was deleted by employer'
      });

      // Delete the shift
      await base44.entities.Shift.delete(shift.id);
    },
    onSuccess: () => {
      toast({
        title: "Shift Deleted",
        description: "The shift and all related invitations have been cancelled.",
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || "Failed to delete shift",
      });
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Shift?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isValidating ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Checking for invitations...</p>
            </div>
          ) : validationData && !validationData.canDelete ? (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-800 font-medium">
                {validationData.error}
              </p>
            </div>
          ) : (
            <>
              <DialogDescription className="text-sm">
                This action cannot be undone. The following will occur:
              </DialogDescription>

              {/* Shift Details */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-xs text-gray-500 font-medium">Shift Details</p>
                <p className="font-semibold text-sm text-gray-900">{shift.pharmacy_name}</p>
                <p className="text-xs text-gray-600">{shift.shift_date} • {shift.start_time} - {shift.end_time}</p>
              </div>

              {/* Warnings */}
              {validationData?.warnings && validationData.warnings.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 text-sm mb-2">
                        Action Required
                      </p>
                      <ul className="space-y-1">
                        {validationData.warnings.map((warning, idx) => (
                          <li key={idx} className="text-xs text-amber-800 flex items-start gap-1">
                            <span className="mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Affected People */}
              {(validationData?.invitationCount > 0 || validationData?.applicationCount > 0) && (
                <div className="space-y-2">
                  {validationData.invitationCount > 0 && (
                    <div className="flex items-center justify-between text-sm bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">Pending Invitations</span>
                      </div>
                      <span className="font-bold text-blue-600">{validationData.invitationCount}</span>
                    </div>
                  )}
                  
                  {validationData.applicationCount > 0 && (
                    <div className="flex items-center justify-between text-sm bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">Pending Applications</span>
                      </div>
                      <span className="font-bold text-purple-600">{validationData.applicationCount}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                All affected pharmacists will be notified immediately.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending || isValidating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleteMutation.isPending || isValidating || (validationData && !validationData.canDelete)}
            variant="destructive"
            className="flex-1"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Shift
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}