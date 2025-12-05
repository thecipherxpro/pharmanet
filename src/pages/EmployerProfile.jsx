import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2,
  Building2,
  Globe,
  Briefcase,
  Monitor,
  Phone,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
  Star,
  Calendar,
  Users,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { EmployerOnly } from "@/components/auth/RouteProtection";
import ProfileAvatar from "@/components/shared/ProfileAvatar";

const SOFTWARE_OPTIONS = [
  "Kroll", "Paperless Kroll", "Fillware", "PharmaClik",
  "Nexxsys", "Commander", "Assyst", "PrimeRx", "McKesson", "Other"
];

const SHIFT_TYPES = [
  { value: "temporary", label: "Temporary" },
  { value: "permanent", label: "Permanent" },
  { value: "shift_relief", label: "Shift Relief" },
  { value: "urgent", label: "Urgent" }
];

function EditableField({ label, value, onSave, type = "text", placeholder, icon: Icon, maxLength }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(tempValue);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value || "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
        {type === "textarea" ? (
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            maxLength={maxLength}
            className="resize-none"
            autoFocus
          />
        ) : (
          <Input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-gray-900 h-8">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            <span className="ml-1">Save</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="h-8">
            <X className="w-3 h-3" />
            <span className="ml-1">Cancel</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
          <p className={`text-sm mt-0.5 ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
            {value || `Add ${label.toLowerCase()}`}
          </p>
        </div>
        <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}

function EditableArrayField({ label, value, options, onSave, icon: Icon }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || []);
  const [saving, setSaving] = useState(false);

  const toggleItem = (item) => {
    setTempValue(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(tempValue);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value || []);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const isSelected = tempValue.includes(optValue);
            return (
              <button
                key={optValue}
                type="button"
                onClick={() => toggleItem(optValue)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-gray-900 h-8">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            <span className="ml-1">Save</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="h-8">
            <X className="w-3 h-3" />
            <span className="ml-1">Cancel</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {value && value.length > 0 ? (
              value.map((item) => {
                const opt = options.find(o => (typeof o === 'object' ? o.value : o) === item);
                const displayLabel = typeof opt === 'object' ? opt.label : item;
                return (
                  <Badge key={item} variant="secondary" className="text-xs bg-gray-100">
                    {displayLabel}
                  </Badge>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 italic">None selected</p>
            )}
          </div>
        </div>
        <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}

function EmployerProfileContent() {
  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['employer-complete-profile'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getEmployerCompleteProfile');
      return response.data;
    }
  });

  const handleAvatarUpload = (newAvatarUrl) => {
    // Dispatch event to update layout and other components
    window.dispatchEvent(new CustomEvent('avatarUpdated', {
      detail: { avatar_url: newAvatarUrl }
    }));
    refetch();
  };

  const saveField = async (field, value) => {
    try {
      const response = await base44.functions.invoke('updatePublicEmployerProfile', { [field]: value });
      if (response.data?.error) throw new Error(response.data.error);
      toast({ title: "Saved" });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const { user, public_profile, pharmacies_count } = profileData?.data || {};
  const profile = public_profile || {};

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Card */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <ProfileAvatar user={user} size="lg" editable={true} onUploadSuccess={handleAvatarUpload} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {profile.full_name || user?.full_name || "Your Company"}
              </h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                {profile.is_verified && (
                  <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                )}
                <span className="text-xs text-gray-500">
                  {pharmacies_count || 0} {pharmacies_count === 1 ? 'pharmacy' : 'pharmacies'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{profile.total_shifts_posted || 0}</p>
              <p className="text-xs text-gray-500">Shifts Posted</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{profile.total_hires || 0}</p>
              <p className="text-xs text-gray-500">Total Hires</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-lg font-bold text-gray-900">{profile.rating?.toFixed(1) || "N/A"}</span>
              </div>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Bio Section */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">About</h2>
          </div>
          <div className="space-y-4">
            <EditableField
              label="Company Bio"
              value={profile.bio}
              onSave={(v) => saveField('bio', v)}
              type="textarea"
              placeholder="Tell pharmacists about your company..."
              maxLength={1000}
            />
            <EditableField
              label="Workplace Culture"
              value={profile.workplace_culture}
              onSave={(v) => saveField('workplace_culture', v)}
              type="textarea"
              placeholder="Describe your team environment..."
              maxLength={500}
            />
          </div>
        </Card>

        {/* Contact Section */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Contact</h2>
          </div>
          <div className="space-y-4">
            <EditableField
              label="Phone Number"
              value={profile.phone}
              onSave={(v) => saveField('phone', v)}
              type="tel"
              placeholder="(416) 555-0123"
              maxLength={14}
            />
            <EditableField
              label="Website"
              value={profile.website}
              onSave={(v) => saveField('website', v)}
              type="url"
              placeholder="https://yourcompany.com"
            />
          </div>
        </Card>

        {/* Software & Shifts */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Preferences</h2>
          </div>
          <div className="space-y-4">
            <EditableArrayField
              label="Software Used"
              value={profile.software_used}
              options={SOFTWARE_OPTIONS}
              onSave={(v) => saveField('software_used', v)}
            />
            <div className="border-t pt-4">
              <EditableArrayField
                label="Shift Types"
                value={profile.preferred_shift_types}
                options={SHIFT_TYPES}
                onSave={(v) => saveField('preferred_shift_types', v)}
              />
            </div>
          </div>
        </Card>

        {/* Visibility Settings */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Visibility</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Show email publicly</p>
                <p className="text-xs text-gray-500">Pharmacists can see your email</p>
              </div>
              <Switch 
                checked={profile.contact_email_public || false}
                onCheckedChange={(checked) => saveField('contact_email_public', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Show phone publicly</p>
                <p className="text-xs text-gray-500">Pharmacists can see your phone</p>
              </div>
              <Switch 
                checked={profile.contact_phone_public || false}
                onCheckedChange={(checked) => saveField('contact_phone_public', checked)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function EmployerProfile() {
  return (
    <EmployerOnly>
      <EmployerProfileContent />
    </EmployerOnly>
  );
}