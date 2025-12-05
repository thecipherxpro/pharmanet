import React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Building2, Globe, Briefcase, Monitor, Eye, Phone } from "lucide-react";

const SOFTWARE_OPTIONS = [
  "Kroll",
  "Paperless Kroll",
  "Fillware",
  "PharmaClik",
  "Nexxsys",
  "Commander",
  "Assyst",
  "PrimeRx",
  "McKesson",
  "Other"
];

const SHIFT_TYPES = [
  { value: "temporary", label: "Temporary" },
  { value: "permanent", label: "Permanent" },
  { value: "shift_relief", label: "Shift Relief" },
  { value: "urgent", label: "Urgent" }
];

export default function PublicProfileEditor({ formData, onChange, user }) {
  const updateField = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const toggleArrayItem = (field, item) => {
    const current = formData[field] || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateField(field, updated);
  };

  return (
    <div className="space-y-4">
      {/* Company Bio */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Company Information</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Professional Bio *</Label>
            <Textarea
              value={formData.bio || ""}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Tell pharmacists about your company, work culture, and what makes you a great employer..."
              rows={4}
              className="mt-1.5 resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {(formData.bio || "").length}/1000
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Workplace Culture</Label>
            <Textarea
              value={formData.workplace_culture || ""}
              onChange={(e) => updateField('workplace_culture', e.target.value)}
              placeholder="Describe your team environment, values, and day-to-day experience..."
              rows={3}
              className="mt-1.5 resize-none"
              maxLength={500}
            />
          </div>
        </div>
      </Card>

      {/* Contact Phone */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">Contact Phone</h3>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Business Phone Number *</Label>
          <Input
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[0-9\s\-()]*$/.test(value)) {
                updateField('phone', value);
              }
            }}
            placeholder="(416) 555-0123"
            className="mt-1.5"
            maxLength={14}
          />
          <p className="text-xs text-gray-500 mt-1">Used for shift notifications and pharmacist contact</p>
        </div>
      </Card>

      {/* Website */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Website</h3>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Company Website (Optional)</Label>
          <Input
            type="url"
            value={formData.website || ""}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://yourpharmacy.com"
            className="mt-1.5"
          />
        </div>
      </Card>

      {/* Software Used */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Software Used</h3>
        </div>
        
        <p className="text-sm text-gray-500 mb-3">Select all pharmacy software you use</p>
        <div className="grid grid-cols-2 gap-2">
          {SOFTWARE_OPTIONS.map((software) => (
            <button
              key={software}
              type="button"
              onClick={() => toggleArrayItem('software_used', software)}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                (formData.software_used || []).includes(software)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {software}
            </button>
          ))}
        </div>
      </Card>

      {/* Shift Types */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Shift Types Posted</h3>
        </div>
        
        <p className="text-sm text-gray-500 mb-3">What types of shifts do you typically post?</p>
        <div className="grid grid-cols-2 gap-2">
          {SHIFT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleArrayItem('preferred_shift_types', type.value)}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                (formData.preferred_shift_types || []).includes(type.value)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Visibility Settings */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">Contact Visibility</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Show email publicly</p>
              <p className="text-xs text-gray-500">Pharmacists can see {user?.email}</p>
            </div>
            <Switch 
              checked={formData.contact_email_public || false}
              onCheckedChange={(checked) => updateField('contact_email_public', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Show phone publicly</p>
              <p className="text-xs text-gray-500">Pharmacists can see your phone number</p>
            </div>
            <Switch 
              checked={formData.contact_phone_public || false}
              onCheckedChange={(checked) => updateField('contact_phone_public', checked)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}