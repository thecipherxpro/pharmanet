import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Building2, Hash, MapPin, Phone, Mail, Calendar, Upload, CheckCircle, Clock, XCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CANADIAN_PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"
];

export default function BecomeVerifiedDrawer({ open, onClose, user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verification, setVerification] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    main_business_name: "",
    business_registration_id: "",
    main_business_address: { street: "", city: "", province: "ON", postal_code: "" },
    business_phone: "",
    business_email: "",
    tax_id: "",
    incorporation_date: ""
  });

  useEffect(() => {
    if (open && user) {
      loadVerification();
    }
  }, [open, user]);

  const loadVerification = async () => {
    try {
      const verifications = await base44.entities.EmployerVerification.filter({ user_id: user.id });
      if (verifications.length > 0) {
        const v = verifications[0];
        setVerification(v);
        setFormData({
          main_business_name: v.main_business_name || "",
          business_registration_id: v.business_registration_id || "",
          main_business_address: v.main_business_address?.[0] || { street: "", city: "", province: "ON", postal_code: "" },
          business_phone: v.business_phone || "",
          business_email: v.business_email || "",
          tax_id: v.tax_id || "",
          incorporation_date: v.incorporation_date || ""
        });
      }
    } catch (error) {
      console.error("Error loading verification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.main_business_name || !formData.business_registration_id) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields"
      });
      return;
    }

    if (formData.business_registration_id.length !== 9) {
      toast({
        variant: "destructive",
        title: "Invalid Business Number",
        description: "Business Number must be 9 digits"
      });
      return;
    }

    setSaving(true);
    try {
      const data = {
        user_id: user.id,
        employer_email: user.email,
        ...formData,
        main_business_address: [formData.main_business_address],
        submitted_at: new Date().toISOString(),
        verification_status: "pending"
      };

      if (verification) {
        await base44.entities.EmployerVerification.update(verification.id, data);
      } else {
        await base44.entities.EmployerVerification.create(data);
      }

      toast({
        title: "Verification Submitted",
        description: "Your verification request has been submitted for review"
      });
      
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit verification"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!verification) return null;

    const statusConfig = {
      pending: { icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200", label: "Pending Review" },
      under_review: { icon: Clock, color: "text-blue-700 bg-blue-50 border-blue-200", label: "Under Review" },
      verified: { icon: CheckCircle, color: "text-green-700 bg-green-50 border-green-200", label: "Verified" },
      rejected: { icon: XCircle, color: "text-red-700 bg-red-50 border-red-200", label: "Rejected" }
    };

    const config = statusConfig[verification.verification_status];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color} mb-4`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{config.label}</span>
      </div>
    );
  };

  const isVerified = verification?.verification_status === "verified";
  const isDisabled = isVerified || saving;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <ScrollArea className="h-full">
          <div className="p-4 sm:p-6">
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <SheetTitle className="text-lg">Become Verified</SheetTitle>
                  <SheetDescription className="text-xs">
                    Verify your business to build trust
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {getStatusBadge()}

                {verification?.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason</p>
                    <p className="text-xs text-red-700">{verification.rejection_reason}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Business Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Building2 className="w-4 h-4 text-gray-700" />
                      <h3 className="text-sm font-bold text-gray-900">Business Information</h3>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Legal Business Name *</Label>
                      <Input
                        value={formData.main_business_name}
                        onChange={(e) => setFormData({...formData, main_business_name: e.target.value})}
                        placeholder="ABC Pharmacy Inc."
                        disabled={isDisabled}
                        className="mt-1.5 h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Business Number (BN) *
                      </Label>
                      <Input
                        value={formData.business_registration_id}
                        onChange={(e) => setFormData({
                          ...formData,
                          business_registration_id: e.target.value.replace(/\D/g, '')
                        })}
                        placeholder="123456789"
                        maxLength={9}
                        disabled={isDisabled}
                        className="mt-1.5 h-10"
                      />
                      <p className="text-xs text-gray-500 mt-1">9-digit Canadian Business Number</p>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Tax ID (Optional)</Label>
                      <Input
                        value={formData.tax_id}
                        onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                        placeholder="Tax ID"
                        disabled={isDisabled}
                        className="mt-1.5 h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Incorporation Date (Optional)
                      </Label>
                      <Input
                        type="date"
                        value={formData.incorporation_date}
                        onChange={(e) => setFormData({...formData, incorporation_date: e.target.value})}
                        disabled={isDisabled}
                        className="mt-1.5 h-10"
                      />
                    </div>
                  </div>

                  {/* Business Contact */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Phone className="w-4 h-4 text-gray-700" />
                      <h3 className="text-sm font-bold text-gray-900">Business Contact</h3>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Business Phone</Label>
                      <Input
                        type="tel"
                        value={formData.business_phone}
                        onChange={(e) => setFormData({...formData, business_phone: e.target.value})}
                        placeholder="(416) 555-0123"
                        disabled={isDisabled}
                        className="mt-1.5 h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Business Email</Label>
                      <Input
                        type="email"
                        value={formData.business_email}
                        onChange={(e) => setFormData({...formData, business_email: e.target.value})}
                        placeholder="contact@business.com"
                        disabled={isDisabled}
                        className="mt-1.5 h-10"
                      />
                    </div>
                  </div>

                  {/* Business Address */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <MapPin className="w-4 h-4 text-gray-700" />
                      <h3 className="text-sm font-bold text-gray-900">Business Address</h3>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Street Address</Label>
                      <Input
                        value={formData.main_business_address.street}
                        onChange={(e) => setFormData({
                          ...formData,
                          main_business_address: {...formData.main_business_address, street: e.target.value}
                        })}
                        placeholder="123 Business Ave"
                        disabled={isDisabled}
                        className="mt-1.5 h-10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-semibold">City</Label>
                        <Input
                          value={formData.main_business_address.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            main_business_address: {...formData.main_business_address, city: e.target.value}
                          })}
                          placeholder="Toronto"
                          disabled={isDisabled}
                          className="mt-1.5 h-10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Province</Label>
                        <Select
                          value={formData.main_business_address.province}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            main_business_address: {...formData.main_business_address, province: value}
                          })}
                          disabled={isDisabled}
                        >
                          <SelectTrigger className="mt-1.5 h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CANADIAN_PROVINCES.map(prov => (
                              <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Postal Code</Label>
                      <Input
                        value={formData.main_business_address.postal_code}
                        onChange={(e) => setFormData({
                          ...formData,
                          main_business_address: {...formData.main_business_address, postal_code: e.target.value.toUpperCase()}
                        })}
                        placeholder="M5H 2N2"
                        maxLength={7}
                        disabled={isDisabled}
                        className="mt-1.5 h-10"
                      />
                    </div>
                  </div>

                  {!isVerified && (
                    <div className="pt-4 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                      >
                        {saving ? "Submitting..." : verification ? "Update" : "Submit for Review"}
                      </Button>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}