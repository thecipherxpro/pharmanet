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
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const PROVINCES = ["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "YT", "NU"];

export default function AddressDrawer({ open, onClose, address, onSave }) {
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    province: "ON",
    postal_code: ""
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && address) {
      setFormData({
        street: address.street || "",
        city: address.city || "",
        province: address.province || "ON",
        postal_code: address.postal_code || ""
      });
      setErrors({});
    }
  }, [open, address]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.street || formData.street.trim().length < 5) {
      newErrors.street = "Street address must be at least 5 characters";
    }
    
    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = "City is required";
    }
    
    if (!formData.postal_code || !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(formData.postal_code)) {
      newErrors.postal_code = "Valid postal code required (e.g., M5V 3A8)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      const response = await base44.functions.invoke('updateEmployerPersonalInfo', {
        personal_address: formData
      });
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      toast({ title: "Address updated" });
      onSave();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Residential Address</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 pb-20">
          <div>
            <Label className="text-sm font-medium">Street Address *</Label>
            <Input
              value={formData.street}
              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              placeholder="123 Main Street, Unit 456"
              className={`mt-1.5 ${errors.street ? 'border-red-500' : ''}`}
            />
            {errors.street && (
              <p className="text-xs text-red-600 mt-1">{errors.street}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">City *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Toronto"
                className={`mt-1.5 ${errors.city ? 'border-red-500' : ''}`}
              />
              {errors.city && (
                <p className="text-xs text-red-600 mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Province *</Label>
              <select
                value={formData.province}
                onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm mt-1.5"
              >
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Postal Code *</Label>
            <Input
              value={formData.postal_code}
              onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value.toUpperCase() }))}
              placeholder="M5V 3A8"
              maxLength={7}
              className={`mt-1.5 ${errors.postal_code ? 'border-red-500' : ''}`}
            />
            {errors.postal_code && (
              <p className="text-xs text-red-600 mt-1">{errors.postal_code}</p>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gray-900">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}