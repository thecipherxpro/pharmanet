import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Shield,
  FileText,
  User,
  MapPin
} from "lucide-react";

export default function PharmacistVerificationDrawer({ open, onClose, profile, publicProfile }) {
  const [submitting, setSubmitting] = useState(false);

  const isVerified = publicProfile?.is_verified;
  const isPending = profile?.verification_status === 'pending';

  const requirements = [
    {
      label: "Full Name",
      completed: !!profile?.full_name,
      icon: User
    },
    {
      label: "Date of Birth",
      completed: !!profile?.date_of_birth,
      icon: User
    },
    {
      label: "OCP License Number",
      completed: !!profile?.ocp_license_number && /^\d{6}$/.test(profile.ocp_license_number),
      icon: FileText
    },
    {
      label: "Residential Address",
      completed: profile?.personal_address?.length > 0 && profile.personal_address[0]?.city,
      icon: MapPin
    }
  ];

  const allComplete = requirements.every(r => r.completed);

  const handleSubmitVerification = async () => {
    if (!allComplete) {
      toast({ 
        title: "Incomplete Profile", 
        description: "Please complete all required fields first",
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    try {
      await base44.functions.invoke('updatePharmacistProfile', {
        verification_status: 'pending'
      });
      
      toast({ title: "Verification submitted", description: "We'll review your information soon" });
      onClose();
    } catch (error) {
      console.error("Verification error:", error);
      toast({ title: "Failed to submit", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>Account Verification</SheetTitle>
        </SheetHeader>
        
        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(85vh-160px)]">
          {/* Status Badge */}
          <div className="text-center">
            {isVerified ? (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Verified Account</span>
              </div>
            ) : isPending ? (
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Verification Pending</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Not Verified</span>
              </div>
            )}
          </div>

          {isVerified ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">You're Verified!</h3>
              <p className="text-sm text-gray-600">
                Your account has been verified. Employers can see you're a trusted pharmacist.
              </p>
            </div>
          ) : isPending ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Review</h3>
              <p className="text-sm text-gray-600">
                We're reviewing your information. This usually takes 1-2 business days.
              </p>
            </div>
          ) : (
            <>
              {/* Why Verify */}
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                <h3 className="font-semibold text-teal-900 mb-2">Why get verified?</h3>
                <ul className="text-sm text-teal-800 space-y-1">
                  <li>• Stand out to employers with a verified badge</li>
                  <li>• Build trust and get more shift offers</li>
                  <li>• Faster application acceptance</li>
                </ul>
              </div>

              {/* Requirements Checklist */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>
                <div className="space-y-2">
                  {requirements.map((req, index) => {
                    const Icon = req.icon;
                    return (
                      <div 
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          req.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          req.completed ? 'bg-green-100' : 'bg-gray-200'
                        }`}>
                          {req.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Icon className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${
                          req.completed ? 'text-green-800' : 'text-gray-600'
                        }`}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!allComplete && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Please complete all requirements in your Settings before submitting for verification.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {!isVerified && !isPending && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleSubmitVerification}
              disabled={submitting || !allComplete}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}