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

export default function PharmacistPersonalInfoDrawer({ open, onClose, profile, user, onSave }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    license_number: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        full_name: profile?.full_name || user?.full_name || "",
        phone: profile?.phone || user?.phone || "",
        date_of_birth: profile?.date_of_birth || "",
        license_number: profile?.ocp_license_number || ""
      });
    }
  }, [open, profile, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('updatePharmacistProfile', {
        full_name: formData.full_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        license_number: formData.license_number
      });
      
      toast({ title: "Personal information updated" });
      onSave();
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>Personal Information</SheetTitle>
        </SheetHeader>
        
        <div className="py-6 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div>
            <Label className="text-sm font-medium">Full Name</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Smith"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Phone Number</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(416) 555-0123"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Date of Birth</Label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="mt-1.5"
            />
            <p className="text-xs text-gray-500 mt-1">Required for verification</p>
          </div>

          <div>
            <Label className="text-sm font-medium">OCP License Number</Label>
            <Input
              value={formData.license_number}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setFormData({ ...formData, license_number: value });
              }}
              placeholder="123456"
              maxLength={6}
              className="mt-1.5"
            />
            <p className="text-xs text-gray-500 mt-1">6-digit Ontario pharmacist license</p>
          </div>
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
              "Save Changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}