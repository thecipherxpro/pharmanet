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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const PROVINCES = [
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "QC", label: "Quebec" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "PE", label: "Prince Edward Island" },
];

export default function PharmacistAddressDrawer({ open, onClose, address, onSave }) {
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    province: "ON",
    postal_code: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && address) {
      setFormData({
        street: address.street || "",
        city: address.city || "",
        province: address.province || "ON",
        postal_code: address.postal_code || ""
      });
    }
  }, [open, address]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('updatePharmacistProfile', {
        personal_address: [formData]
      });
      
      toast({ title: "Address updated" });
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
          <SheetTitle>Residential Address</SheetTitle>
        </SheetHeader>
        
        <div className="py-6 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div>
            <Label className="text-sm font-medium">Street Address</Label>
            <Input
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="123 Main St, Unit 4"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">City</Label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Toronto"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Province</Label>
            <Select
              value={formData.province}
              onValueChange={(value) => setFormData({ ...formData, province: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((prov) => (
                  <SelectItem key={prov.value} value={prov.value}>
                    {prov.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Postal Code</Label>
            <Input
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value.toUpperCase() })}
              placeholder="M5V 1A1"
              maxLength={7}
              className="mt-1.5"
            />
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
              "Save Address"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}