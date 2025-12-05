import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

export default function PharmacistPayrollDrawer({ open, onClose, payrollPreference, userId, onSave }) {
  const [formData, setFormData] = useState({
    method: "Direct Deposit",
    legal_first_name: "",
    legal_last_name: "",
    bank_name: "",
    institution_number: "",
    transit_number: "",
    account_number: "",
    etransfer_email: "",
    auto_deposit_enabled: false
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && payrollPreference) {
      setFormData({
        method: payrollPreference.method || "Direct Deposit",
        legal_first_name: payrollPreference.legal_first_name || "",
        legal_last_name: payrollPreference.legal_last_name || "",
        bank_name: payrollPreference.bank_name || "",
        institution_number: payrollPreference.institution_number || "",
        transit_number: payrollPreference.transit_number || "",
        account_number: payrollPreference.account_number || "",
        etransfer_email: payrollPreference.etransfer_email || "",
        auto_deposit_enabled: payrollPreference.auto_deposit_enabled || false
      });
    }
  }, [open, payrollPreference]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.legal_first_name?.trim()) {
      newErrors.legal_first_name = "Required";
    }
    if (!formData.legal_last_name?.trim()) {
      newErrors.legal_last_name = "Required";
    }
    
    if (formData.method === "Direct Deposit") {
      if (!formData.bank_name?.trim()) newErrors.bank_name = "Required";
      if (!/^\d{3}$/.test(formData.institution_number)) newErrors.institution_number = "Must be 3 digits";
      if (!/^\d{5}$/.test(formData.transit_number)) newErrors.transit_number = "Must be 5 digits";
      if (!/^\d{7,12}$/.test(formData.account_number)) newErrors.account_number = "Must be 7-12 digits";
    } else if (formData.method === "Bank E-Transfer") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.etransfer_email)) newErrors.etransfer_email = "Invalid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      await base44.functions.invoke('payrollSavePreference', {
        user_id: userId,
        ...formData
      });
      
      toast({ title: "Payroll settings updated" });
      onSave();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>Payroll Settings</SheetTitle>
        </SheetHeader>
        
        <div className="py-6 space-y-5 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Legal Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Legal First Name *</Label>
              <Input
                value={formData.legal_first_name}
                onChange={(e) => setFormData({ ...formData, legal_first_name: e.target.value })}
                className={`mt-1.5 ${errors.legal_first_name ? 'border-red-500' : ''}`}
              />
              {errors.legal_first_name && (
                <p className="text-xs text-red-600 mt-1">{errors.legal_first_name}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Legal Last Name *</Label>
              <Input
                value={formData.legal_last_name}
                onChange={(e) => setFormData({ ...formData, legal_last_name: e.target.value })}
                className={`mt-1.5 ${errors.legal_last_name ? 'border-red-500' : ''}`}
              />
              {errors.legal_last_name && (
                <p className="text-xs text-red-600 mt-1">{errors.legal_last_name}</p>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-sm font-medium">Payment Method *</Label>
            <Select
              value={formData.method}
              onValueChange={(value) => setFormData({ ...formData, method: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                <SelectItem value="Bank E-Transfer">Bank E-Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Direct Deposit Fields */}
          {formData.method === "Direct Deposit" && (
            <>
              <div>
                <Label className="text-sm font-medium">Bank Name *</Label>
                <Input
                  placeholder="e.g., TD Canada Trust"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className={`mt-1.5 ${errors.bank_name ? 'border-red-500' : ''}`}
                />
                {errors.bank_name && (
                  <p className="text-xs text-red-600 mt-1">{errors.bank_name}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-medium">Institution *</Label>
                  <Input
                    placeholder="004"
                    maxLength={3}
                    value={formData.institution_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, institution_number: value });
                    }}
                    className={`mt-1.5 ${errors.institution_number ? 'border-red-500' : ''}`}
                  />
                  {errors.institution_number && (
                    <p className="text-xs text-red-600 mt-1">{errors.institution_number}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Transit *</Label>
                  <Input
                    placeholder="12345"
                    maxLength={5}
                    value={formData.transit_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, transit_number: value });
                    }}
                    className={`mt-1.5 ${errors.transit_number ? 'border-red-500' : ''}`}
                  />
                  {errors.transit_number && (
                    <p className="text-xs text-red-600 mt-1">{errors.transit_number}</p>
                  )}
                </div>
                <div className="col-span-3">
                  <Label className="text-sm font-medium">Account Number *</Label>
                  <Input
                    placeholder="1234567"
                    maxLength={12}
                    value={formData.account_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, account_number: value });
                    }}
                    className={`mt-1.5 ${errors.account_number ? 'border-red-500' : ''}`}
                  />
                  {errors.account_number && (
                    <p className="text-xs text-red-600 mt-1">{errors.account_number}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* E-Transfer Fields */}
          {formData.method === "Bank E-Transfer" && (
            <>
              <div>
                <Label className="text-sm font-medium">E-Transfer Email *</Label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.etransfer_email}
                  onChange={(e) => setFormData({ ...formData, etransfer_email: e.target.value })}
                  className={`mt-1.5 ${errors.etransfer_email ? 'border-red-500' : ''}`}
                />
                {errors.etransfer_email && (
                  <p className="text-xs text-red-600 mt-1">{errors.etransfer_email}</p>
                )}
              </div>

              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <Checkbox
                  id="auto_deposit"
                  checked={formData.auto_deposit_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_deposit_enabled: checked })}
                />
                <div className="flex-1">
                  <label htmlFor="auto_deposit" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Auto-deposit enabled
                  </label>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Enable if your bank supports automatic e-transfer deposits
                  </p>
                </div>
              </div>
            </>
          )}

          {formData.method === "Cheque" && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Cheque Payment</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Cheques will be mailed to your registered address. Please ensure your address is up to date.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-teal-600 hover:bg-teal-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Payroll Settings"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}