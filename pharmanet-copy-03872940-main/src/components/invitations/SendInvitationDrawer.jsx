import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, DollarSign, MapPin, AlertCircle, Send, X, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { formatTime12Hour, safeFormat } from "../utils/timeUtils";
import { getScheduleFromShift } from "../utils/shiftUtils";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SendInvitationDrawer({ 
  open, 
  onClose, 
  pharmacistId,
  pharmacistEmail,
  pharmacistName 
}) {
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  // Fetch my open shifts
  const { data: myShifts = [], isLoading } = useQuery({
    queryKey: ['myOpenShifts', user?.email],
    queryFn: async () => {
      const shifts = await base44.entities.Shift.filter({
        created_by: user?.email,
        status: 'open'
      }, '-created_date');
      
      // Filter out past shifts using schedule array
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      return shifts.filter(shift => {
        const schedule = getScheduleFromShift(shift);
        if (schedule.length === 0) return false;
        
        // Check if any date in schedule is in the future
        return schedule.some(dateInfo => {
          if (!dateInfo.date) return false;
          const [year, month, day] = dateInfo.date.split('-').map(Number);
          const shiftDate = new Date(year, month - 1, day);
          return shiftDate >= now;
        });
      });
    },
    enabled: !!user && open,
  });

  // Check existing invitations for this pharmacist
  const { data: existingInvitations = [] } = useQuery({
    queryKey: ['existingInvitations', pharmacistEmail],
    queryFn: async () => {
      const invitations = await base44.entities.ShiftInvitation.filter({
        pharmacist_email: pharmacistEmail
      });
      return invitations;
    },
    enabled: !!pharmacistEmail && open,
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async ({ shiftId, personalMessage }) => {
      // Check for duplicate invitation
      const duplicate = existingInvitations.find(
        inv => inv.shift_id === shiftId && inv.status === 'pending'
      );

      if (duplicate) {
        throw new Error('You have already invited this pharmacist to this shift');
      }

      const shift = myShifts.find(s => s.id === shiftId);
      
      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invitation
      const invitation = await base44.entities.ShiftInvitation.create({
        shift_id: shiftId,
        employer_id: user.id,
        employer_name: user.full_name,
        employer_email: user.email,
        pharmacist_id: pharmacistId,
        pharmacist_email: pharmacistEmail,
        pharmacist_name: pharmacistName,
        message: personalMessage,
        status: 'pending',
        invited_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      });

      // Send email notification
      await base44.functions.invoke('sendShiftInvitationEmail', {
        invitation_id: invitation.id
      });

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existingInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['sentInvitations', user?.email] });
      
      toast({
        title: "Invitation Sent!",
        description: `${pharmacistName} has been notified via email.`,
      });
      
      setSelectedShiftId(null);
      setMessage("");
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: error.message || "Could not send invitation. Please try again.",
      });
    }
  });

  const handleSend = () => {
    if (!selectedShiftId) {
      toast({
        variant: "destructive",
        title: "Select a Shift",
        description: "Please select a shift before sending the invitation.",
      });
      return;
    }

    sendInvitationMutation.mutate({
      shiftId: selectedShiftId,
      personalMessage: message
    });
  };

  const isShiftAlreadyInvited = (shiftId) => {
    return existingInvitations.some(
      inv => inv.shift_id === shiftId && (inv.status === 'pending' || inv.status === 'accepted')
    );
  };

  const getInvitationStatus = (shiftId) => {
    const invitation = existingInvitations.find(inv => inv.shift_id === shiftId);
    return invitation?.status;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Send Shift Invitation</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 pt-1">
            Invite <span className="font-semibold">{pharmacistName}</span> to work a shift
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] p-4">
          <div className="space-y-4">
            {/* Available Shifts */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Select Shift</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : myShifts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No open shifts available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {myShifts.map(shift => {
                    const alreadyInvited = isShiftAlreadyInvited(shift.id);
                    const invitationStatus = getInvitationStatus(shift.id);
                    const isSelected = selectedShiftId === shift.id;

                    return (
                      <Card
                        key={shift.id}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-2 border-teal-500 shadow-md' 
                            : alreadyInvited 
                            ? 'border-gray-200 opacity-60' 
                            : 'border-gray-200 hover:border-teal-300 hover:shadow-sm'
                        }`}
                        onClick={() => !alreadyInvited && setSelectedShiftId(shift.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                {shift.pharmacy_name}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                <MapPin className="w-3 h-3" />
                                <span>{shift.pharmacy_city}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="text-xs font-bold">
                                ${shift.hourly_rate}/hr
                              </Badge>
                              {alreadyInvited && (
                                <Badge className={`text-xs ${
                                  invitationStatus === 'accepted' ? 'bg-green-500' :
                                  invitationStatus === 'pending' ? 'bg-amber-500' :
                                  'bg-gray-500'
                                }`}>
                                  {invitationStatus === 'accepted' ? 'Accepted' :
                                   invitationStatus === 'pending' ? 'Invited' :
                                   invitationStatus}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {(() => {
                            const schedule = getScheduleFromShift(shift);
                            const primaryDate = schedule[0] || {};
                            return (
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {safeFormat(primaryDate.date, 'MMM d')}
                                    {schedule.length > 1 && ` (+${schedule.length - 1})`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime12Hour(primaryDate.start_time)} - {formatTime12Hour(primaryDate.end_time)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-green-600 font-medium">
                                  <DollarSign className="w-3 h-3" />
                                  <span>${shift.total_pay}</span>
                                </div>
                              </div>
                            );
                          })()}

                          {isSelected && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-teal-600 font-medium">
                              <CheckCircle className="w-3 h-3" />
                              <span>Selected</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Personal Message */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Personal Message (Optional)
              </label>
              <Textarea
                placeholder="Add a personal note to your invitation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="text-sm"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/500 characters
              </p>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  The pharmacist will receive an email notification. Invitations expire after 7 days.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sendInvitationMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!selectedShiftId || sendInvitationMutation.isPending}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {sendInvitationMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}