import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, AlertCircle, CheckCircle, ArrowLeft, Sparkles, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PaymentCardGate from "../wallet/PaymentCardGate";
import { getScheduleFromShift } from "../utils/shiftUtils";

export default function ApplicationDialog({ shift, shifts, shiftIds, open, onClose, userEmail, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [hasPaymentCard, setHasPaymentCard] = useState(false);
  const [checkingCard, setCheckingCard] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for payment card
  const { data: cards = [] } = useQuery({
    queryKey: ['walletCards'],
    queryFn: () => base44.entities.WalletCard.list(),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setCheckingCard(true);
      const hasCard = cards.length > 0;
      setHasPaymentCard(hasCard);
      setCheckingCard(false);
    }
  }, [cards, open]);

  // Check if already applied
  const { data: existingApplications } = useQuery({
    queryKey: ['myApplication', shift?.id, userEmail],
    queryFn: async () => {
      const apps = await base44.entities.ShiftApplication.filter({
        shift_id: shift?.id,
        pharmacist_email: userEmail
      });
      return apps;
    },
    enabled: !!shift && !!userEmail && open,
  });

  const hasAlreadyApplied = existingApplications && existingApplications.length > 0;
  const existingApp = hasAlreadyApplied ? existingApplications[0] : null;

  // Cover letter templates
  const templates = [
    {
      label: "Professional Introduction",
      text: "I am a licensed pharmacist with experience in community pharmacy settings. I am familiar with the software systems and procedures required for this role. I am available for this shift and committed to providing excellent pharmaceutical care."
    },
    {
      label: "Software Experience Focus",
      text: `I have extensive experience working with ${shift?.pharmacy_software?.[0] || 'pharmacy management'} software and am confident I can seamlessly integrate into your pharmacy's workflow. I understand the importance of accuracy and efficiency in medication dispensing.`
    },
    {
      label: "Location & Availability",
      text: `I am located in the ${shift?.pharmacy_city} area and am very familiar with the local community. I have immediate availability for this shift and can provide reliable, professional pharmaceutical services.`
    }
  ];

  const applyMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      // Single shift application only
      const application = {
        shift_id: shift.id,
        pharmacist_email: userEmail,
        pharmacist_name: user.full_name,
        cover_letter: coverLetter,
        status: "pending",
        applied_date: new Date().toISOString()
      };

      const createdApp = await base44.entities.ShiftApplication.create(application);

      // Send notification to employer
      const schedule = getScheduleFromShift(shift);
      const primaryDate = schedule[0] || { date: '', start_time: '09:00', end_time: '17:00' };
      const isMultiDate = schedule.length > 1;

      try {
        await base44.functions.invoke('sendShiftNotification', {
          notification_type: 'new_application',
          shift_data: {
            shift_date: primaryDate.date,
            start_time: primaryDate.start_time,
            end_time: primaryDate.end_time,
            pharmacy_name: shift.pharmacy_name,
            applicant_name: user.full_name,
            applicant_email: userEmail,
            is_multi_date: isMultiDate,
            dates_count: schedule.length
          },
          recipient_email: shift.created_by
        });
      } catch (error) {
        console.error('Failed to send notification email:', error);
      }

      return createdApp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['myApplication'] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['myApplicationsForFilter'] });
      
      const schedule = getScheduleFromShift(shift);
      const datesCount = schedule.length;
      toast({
        title: "✓ Application Submitted",
        description: datesCount > 1 
          ? `Successfully applied to shift with ${datesCount} dates!`
          : "Successfully applied to shift!",
      });
      
      if (onSuccess) onSuccess();
      onClose();
      setCoverLetter("");
      setSelectedTemplate("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasAlreadyApplied) return;
    
    if (!hasPaymentCard) {
      toast({
        variant: "destructive",
        title: "Payment Card Required",
        description: "Please add a payment card before applying to shifts.",
      });
      return;
    }
    
    applyMutation.mutate();
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.label);
    setCoverLetter(template.text);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0 flex flex-col">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-4 rounded-t-3xl">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold leading-tight">
                {hasAlreadyApplied ? "Already Applied" : "Apply for Shift"}
              </h2>
              <p className="text-xs opacity-90 truncate mt-0.5">
                {shift?.pharmacy_name} • {shift?.pharmacy_city}
                {shift?.schedule?.length > 1 && (
                  <span className="ml-1 font-semibold">({shift.schedule.length} dates)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
          {checkingCard ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !hasPaymentCard && !hasAlreadyApplied ? (
            <div className="space-y-3">
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-sm font-bold text-orange-900">Payment Card Required</p>
                </div>
                <p className="text-xs text-orange-800 leading-relaxed">
                  To apply for shifts, you need to add a payment card. This is required for cancellation penalty protection. No charges will be made unless you cancel a confirmed shift with less than 48 hours notice.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-900 mb-2">Why is this required?</p>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Protects employers from last-minute cancellations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Only charged if you cancel &lt;48 hours before shift</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Your card details are securely stored by Stripe</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : hasAlreadyApplied ? (
            <div className="space-y-3">
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-green-900">Application Submitted</p>
                </div>
                <p className="text-[10px] text-green-700 pl-7">
                  Applied on {new Date(existingApp.applied_date).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-xs font-bold text-gray-900 mb-2">Status</p>
                <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold ${
                  existingApp.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                  existingApp.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {existingApp.status.charAt(0).toUpperCase() + existingApp.status.slice(1)}
                </span>
              </div>

              {existingApp.cover_letter && (
                <div className="bg-white rounded-xl p-3 border border-gray-200">
                  <p className="text-xs font-bold text-gray-900 mb-2">Your Cover Letter</p>
                  <p className="text-xs text-gray-700 leading-relaxed italic">"{existingApp.cover_letter}"</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Template Selection */}
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <Label className="text-xs font-bold text-gray-900">Quick Templates</Label>
                </div>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.label}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all active:scale-[0.98] ${
                        selectedTemplate === template.label
                          ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Letter */}
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <Label htmlFor="cover-letter" className="text-xs font-bold text-gray-900 block mb-1">
                  Cover Letter (Recommended)
                </Label>
                <p className="text-[10px] text-gray-500 mb-2">
                  A personalized message increases your chances of being selected
                </p>
                <Textarea
                  id="cover-letter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this shift..."
                  className="min-h-[120px] resize-none text-xs"
                />
                <p className="text-[10px] text-gray-500 mt-1.5">
                  {coverLetter.length} characters
                </p>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-800 leading-relaxed">
                    Applications are reviewed by the employer. You'll be notified via email and in-app when they respond.
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Action Button */}
        <div className="border-t border-gray-200 p-3 bg-white">
          {!hasPaymentCard && !hasAlreadyApplied && !checkingCard ? (
            <Button
              onClick={onClose}
              className="w-full h-11 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-transform"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Card
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={hasAlreadyApplied ? onClose : handleSubmit}
              disabled={applyMutation.isPending || checkingCard || (!hasPaymentCard && !hasAlreadyApplied)}
              className="w-full h-11 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {applyMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : hasAlreadyApplied ? (
                "Close"
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}