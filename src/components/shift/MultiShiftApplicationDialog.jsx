import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour } from "../utils/timeUtils";
import { toast } from "@/components/ui/use-toast";

export default function MultiShiftApplicationDialog({ open, onClose, shifts, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState("");
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      // Create applications for all selected shifts
      const applications = shifts.map(shift => ({
        shift_id: shift.id,
        pharmacist_email: user.email,
        pharmacist_name: user.full_name,
        application_type: "application",
        status: "pending",
        cover_letter: coverLetter,
        applied_date: new Date().toISOString()
      }));

      return await base44.entities.ShiftApplication.bulkCreate(applications);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['myApplicationsForFilter'] });
      
      toast({
        title: "✓ Applications Submitted",
        description: `Successfully applied to ${shifts.length} shift${shifts.length > 1 ? 's' : ''}!`,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: error.message || "Failed to submit applications. Please try again.",
      });
    }
  });

  const totalPay = shifts.reduce((sum, s) => sum + (s.total_pay || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Apply to {shifts.length} Shift{shifts.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border-2 border-teal-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">{shifts[0].pharmacy_name}</h3>
              <Badge className="bg-teal-600 text-white">
                {shifts.length} shifts
              </Badge>
            </div>
            
            <div className="space-y-2 mb-3">
              {shifts.map((shift, index) => (
                <div key={shift.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border border-teal-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-medium">
                      {format(new Date(shift.shift_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <span className="text-gray-600">
                    {formatTime12Hour(shift.start_time)} - {formatTime12Hour(shift.end_time)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-teal-200">
              <span className="text-sm font-semibold text-gray-700">Total Potential Earnings</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-teal-600" />
                <span className="text-xl font-bold text-teal-700">
                  ${totalPay.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter" className="text-sm font-semibold">
              Cover Letter <span className="text-gray-500 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell the employer why you're a great fit for these shifts..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {coverLetter.length}/500 characters
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your application will be sent to the employer for all selected dates. 
              They can choose to accept you for all dates or specific ones.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={applyMutation.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {applyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit {shifts.length} Application{shifts.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}