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

export default function PersonalInfoDrawer({ open, onClose, profile, onSave }) {
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: ""
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && profile) {
      setFormData({
        full_name: profile.full_name || "",
        date_of_birth: profile.date_of_birth || ""
      });
      setErrors({});
    }
  }, [open, profile]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = "Name must be at least 2 characters";
    }
    
    if (formData.date_of_birth) {
      const age = Math.floor((new Date() - new Date(formData.date_of_birth)) / 31557600000);
      if (age < 18) {
        newErrors.date_of_birth = "Must be at least 18 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      const response = await base44.functions.invoke('updateEmployerPersonalInfo', formData);
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      toast({ title: "Personal information updated" });
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
          <SheetTitle>Personal Information</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 pb-20">
          <div>
            <Label className="text-sm font-medium">Full Legal Name *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Smith"
              className={`mt-1.5 ${errors.full_name ? 'border-red-500' : ''}`}
            />
            {errors.full_name && (
              <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">Date of Birth</Label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              className={`mt-1.5 ${errors.date_of_birth ? 'border-red-500' : ''}`}
            />
            {errors.date_of_birth && (
              <p className="text-xs text-red-600 mt-1">{errors.date_of_birth}</p>
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