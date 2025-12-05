import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, ArrowLeft, Building2 } from "lucide-react";
import ProfileAvatar from "../components/shared/ProfileAvatar";
import { EmployerOnly } from "../components/auth/RouteProtection";
import { useToast } from "@/components/ui/use-toast";

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

function EmployerProfileEditContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    bio: "",
    software_used: [],
    preferred_shift_types: [],
    workplace_culture: "",
    website: "",
    contact_email_public: false,
    contact_phone_public: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Load public profile
      const profiles = await base44.entities.Public_Employer_Profile.filter({
        user_id: userData.id
      });

      if (profiles.length > 0) {
        const profileData = profiles[0];
        setProfile(profileData);
        setFormData({
          phone: userData.phone || "",
          bio: userData.bio || "",
          software_used: profileData.software_used || [],
          preferred_shift_types: profileData.preferred_shift_types || [],
          workplace_culture: profileData.workplace_culture || "",
          website: profileData.website || "",
          contact_email_public: profileData.contact_email_public || false,
          contact_phone_public: profileData.contact_phone_public || false
        });
      } else {
        setFormData({
          phone: userData.phone || "",
          bio: userData.bio || "",
          software_used: [],
          preferred_shift_types: [],
          workplace_culture: "",
          website: "",
          contact_email_public: false,
          contact_phone_public: false
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user bio and phone
      await base44.auth.updateMe({
        phone: formData.phone,
        bio: formData.bio
      });

      // Update public profile
      const publicProfileData = {
        user_id: user.id,
        employer_email: user.email,
        bio: formData.bio,
        phone: formData.phone,
        software_used: formData.software_used,
        preferred_shift_types: formData.preferred_shift_types,
        workplace_culture: formData.workplace_culture,
        website: formData.website,
        contact_email_public: formData.contact_email_public,
        contact_phone_public: formData.contact_phone_public
      };

      if (profile) {
        await base44.entities.Public_Employer_Profile.update(profile.id, publicProfileData);
      } else {
        publicProfileData.active_since = new Date().toISOString().split('T')[0];
        publicProfileData.is_active = true;
        await base44.entities.Public_Employer_Profile.create(publicProfileData);
      }

      // Sync public profile stats after update
      try {
        await base44.functions.invoke('syncPublicEmployerProfile');
      } catch (syncError) {
        console.error("Profile sync warning:", syncError);
        // Don't block the success flow
      }

      toast({
        title: "✓ Profile Updated",
        description: "Your public profile has been saved successfully"
      });

      navigate(createPageUrl("EmployerProfile"));
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "Failed to save profile"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSoftware = (software) => {
    const current = formData.software_used;
    const updated = current.includes(software)
      ? current.filter(s => s !== software)
      : [...current, software];
    setFormData({ ...formData, software_used: updated });
  };

  const toggleShiftType = (type) => {
    const current = formData.preferred_shift_types;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setFormData({ ...formData, preferred_shift_types: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl("EmployerProfile"))}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6" />
            <div>
              <h1 className="text-2xl font-bold">Edit Public Profile</h1>
              <p className="text-teal-100 text-sm">Information visible to pharmacists</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-xl p-6">
              <ProfileAvatar 
                user={user}
                size="xl"
                editable={true}
                onUploadSuccess={(url) => setUser({...user, avatar_url: url})}
              />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">Company Logo</p>
                <p className="text-xs text-gray-500 mt-1">Click to update</p>
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label>Contact Phone *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1.5"
              />
            </div>

            {/* Bio */}
            <div>
              <Label>Company Bio *</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio?.length || 0} characters</p>
            </div>

            {/* Software */}
            <div>
              <Label className="mb-2 block">Software Used</Label>
              <div className="grid grid-cols-2 gap-2">
                {SOFTWARE_OPTIONS.map((software) => (
                  <button
                    key={software}
                    type="button"
                    onClick={() => toggleSoftware(software)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.software_used.includes(software)
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {software}
                  </button>
                ))}
              </div>
            </div>

            {/* Shift Types */}
            <div>
              <Label className="mb-2 block">Shift Types You Post</Label>
              <div className="grid grid-cols-2 gap-2">
                {SHIFT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleShiftType(type.value)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.preferred_shift_types.includes(type.value)
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Website */}
            <div>
              <Label>Company Website</Label>
              <Input
                type="url"
                placeholder="https://yourpharmacy.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="mt-1.5"
              />
            </div>

            {/* Workplace Culture */}
            <div>
              <Label>Workplace Culture</Label>
              <Textarea
                placeholder="Describe your team, work environment, and culture..."
                value={formData.workplace_culture}
                onChange={(e) => setFormData({ ...formData, workplace_culture: e.target.value })}
                rows={3}
                className="mt-1.5"
              />
            </div>

            {/* Contact Visibility */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="email_public"
                    checked={formData.contact_email_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, contact_email_public: checked })}
                  />
                  <div>
                    <label htmlFor="email_public" className="text-sm font-medium cursor-pointer">
                      Show email publicly
                    </label>
                    <p className="text-xs text-gray-600">Pharmacists can see your email without applying</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="phone_public"
                    checked={formData.contact_phone_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, contact_phone_public: checked })}
                  />
                  <div>
                    <label htmlFor="phone_public" className="text-sm font-medium cursor-pointer">
                      Show phone publicly
                    </label>
                    <p className="text-xs text-gray-600">Pharmacists can see your phone without applying</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("EmployerProfile"))}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EmployerProfileEdit() {
  return (
    <EmployerOnly>
      <EmployerProfileEditContent />
    </EmployerOnly>
  );
}