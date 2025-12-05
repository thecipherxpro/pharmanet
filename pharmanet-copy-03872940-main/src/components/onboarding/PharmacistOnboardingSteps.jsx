import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from "lucide-react";
import ProfileAvatar from "../shared/ProfileAvatar";
import TooltipHelper from "./TooltipHelper";
import { validatePhone } from "../utils/validationUtils";

const PROVINCES = [
  { value: "ON", label: "Ontario" },
  { value: "QC", label: "Quebec" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "PE", label: "Prince Edward Island" },
];

// Step 1: Personal Information
export function PersonalInfoStep({ user, setUser, onNext, onCancel, stepNumber = 1 }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    license_number: "",
    street: "",
    city: "",
    province: "ON",
    postal_code: "",
    languages_spoken: ["English"]
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [avatarOptional, setAvatarOptional] = useState(false);

  // Load existing profile data - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('getPharmacistOwnProfile', {});
        const { profile } = response.data || {};
        
        if (profile) {
          const address = profile.personal_address?.[0] || {};
          setFormData({
            full_name: profile.full_name || user?.full_name || "",
            phone: profile.phone || user?.phone || "",
            date_of_birth: profile.date_of_birth || "",
            license_number: profile.ocp_license_number || "",
            street: address.street || "",
            city: address.city || "",
            province: address.province || "ON",
            postal_code: address.postal_code || "",
            languages_spoken: profile.languages_spoken || ["English"]
          });
        } else {
          // Pre-fill from user data only
          setFormData(prev => ({
            ...prev,
            full_name: user?.full_name || "",
            phone: user?.phone || ""
          }));
        }
      } catch (e) {
        console.log("No existing profile found:", e);
        setFormData(prev => ({
          ...prev,
          full_name: user?.full_name || "",
          phone: user?.phone || ""
        }));
      }
      setLoading(false);
    };
    
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const validateStep = () => {
    const newErrors = {};
    
    // Avatar is optional if user chose to skip
    if (!user?.avatar_url && !avatarOptional) {
      newErrors.avatar = "Profile photo recommended (click 'Skip for now' to continue without)";
    }

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = "Full name is required";
    }
    
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error;
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    }
    
    if (!formData.license_number || !/^\d{6}$/.test(formData.license_number)) {
      newErrors.license_number = "Must be exactly 6 digits";
    }

    if (!formData.street || formData.street.trim().length < 3) {
      newErrors.street = "Street address is required";
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = "City is required";
    }

    if (!formData.postal_code || !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(formData.postal_code)) {
      newErrors.postal_code = "Valid postal code required (e.g., M5V 1J2)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    setSaving(true);
    try {
      const response = await base44.functions.invoke('updatePharmacistProfile', {
        full_name: formData.full_name.trim(),
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        license_number: formData.license_number,
        personal_address: [{
          street: formData.street.trim(),
          city: formData.city.trim(),
          province: formData.province,
          postal_code: formData.postal_code.toUpperCase().replace(/\s/g, ' ')
        }],
        languages_spoken: formData.languages_spoken,
        avatar_url: user.avatar_url
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      await base44.auth.updateMe({
        display_name: formData.full_name.trim(),
        phone: formData.phone,
        onboarding_step: 2
      });

      const updatedUser = await base44.auth.me();
      setUser(updatedUser);

      setSaving(false);
      onNext();
    } catch (error) {
      console.error("Save error:", error);
      setErrors({ submit: error.message || "Failed to save. Please try again." });
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (newAvatarUrl) => {
    setErrors(prev => ({ ...prev, avatar: null }));
    setAvatarOptional(false);
    setUser(prev => ({ ...prev, avatar_url: newAvatarUrl }));
  };

  const handleSkipAvatar = () => {
    setAvatarOptional(true);
    setErrors(prev => ({ ...prev, avatar: null }));
  };

  const toggleLanguage = (lang) => {
    const current = formData.languages_spoken || [];
    const updated = current.includes(lang)
      ? current.filter(l => l !== lang)
      : [...current, lang];
    if (updated.length > 0) {
      setFormData({ ...formData, languages_spoken: updated });
    }
  };

  const commonLanguages = ["English", "French", "Mandarin", "Cantonese", "Punjabi", "Hindi", "Urdu", "Arabic", "Tamil", "Spanish"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-sm text-gray-600">Complete your profile details</p>
      </div>

      {/* Avatar Upload - Now Optional */}
      <div className="flex flex-col items-center gap-3 bg-gray-50 rounded-xl p-5">
        <ProfileAvatar 
          user={user}
          size="xl"
          editable={true}
          onUploadStart={() => setUploading(true)}
          onUploadSuccess={handleAvatarUpload}
          onUploadError={() => setUploading(false)}
        />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            Profile Photo {!avatarOptional && !user?.avatar_url ? "" : "(Optional)"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {user?.avatar_url ? "✓ Photo uploaded" : "Click to upload"}
          </p>
        </div>
        {errors.avatar && (
          <div className="text-center">
            <p className="text-xs text-amber-600 mb-2">{errors.avatar}</p>
            <button
              type="button"
              onClick={handleSkipAvatar}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium underline"
            >
              Skip for now
            </button>
          </div>
        )}
        {avatarOptional && !user?.avatar_url && (
          <p className="text-xs text-gray-500">You can add a photo later from your profile</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <Label className="text-sm font-semibold text-gray-900">Full Legal Name *</Label>
        <Input
          placeholder="John Smith"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className={`mt-1.5 ${errors.full_name ? 'border-red-500' : ''}`}
        />
        {errors.full_name && <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>}
      </div>

      {/* Phone */}
      <div>
        <Label className="text-sm font-semibold text-gray-900">Phone Number *</Label>
        <Input
          type="tel"
          placeholder="(416) 555-0123"
          value={formData.phone}
          onChange={(e) => {
            if (/^[0-9\s\-()]*$/.test(e.target.value)) {
              setFormData({ ...formData, phone: e.target.value });
            }
          }}
          className={`mt-1.5 ${errors.phone ? 'border-red-500' : ''}`}
          maxLength={14}
        />
        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
      </div>

      {/* Date of Birth */}
      <div>
        <Label className="text-sm font-semibold text-gray-900">Date of Birth *</Label>
        <Input
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          className={`mt-1.5 ${errors.date_of_birth ? 'border-red-500' : ''}`}
        />
        {errors.date_of_birth && <p className="text-xs text-red-600 mt-1">{errors.date_of_birth}</p>}
        <p className="text-xs text-gray-500 mt-1">Required for verification</p>
      </div>

      {/* License Number */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Label className="text-sm font-semibold text-gray-900">OCP License Number *</Label>
          <TooltipHelper content="Your 6-digit Ontario College of Pharmacists license number" />
        </div>
        <Input
          placeholder="123456"
          maxLength={6}
          value={formData.license_number}
          onChange={(e) => {
            if (/^\d*$/.test(e.target.value)) {
              setFormData({ ...formData, license_number: e.target.value });
            }
          }}
          className={`mt-1.5 ${errors.license_number ? 'border-red-500' : ''}`}
        />
        {errors.license_number && <p className="text-xs text-red-600 mt-1">{errors.license_number}</p>}
      </div>

      {/* Address Section */}
      <div className="border-t pt-5 mt-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Residential Address</h3>
        
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-gray-700">Street Address *</Label>
            <Input
              placeholder="123 Main Street, Unit 4"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className={`mt-1 ${errors.street ? 'border-red-500' : ''}`}
            />
            {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-700">City *</Label>
              <Input
                placeholder="Toronto"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`mt-1 ${errors.city ? 'border-red-500' : ''}`}
              />
              {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
            </div>
            <div>
              <Label className="text-sm text-gray-700">Province *</Label>
              <Select
                value={formData.province}
                onValueChange={(v) => setFormData({ ...formData, province: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm text-gray-700">Postal Code *</Label>
            <Input
              placeholder="M5V 1J2"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value.toUpperCase() })}
              className={`mt-1 w-32 ${errors.postal_code ? 'border-red-500' : ''}`}
              maxLength={7}
            />
            {errors.postal_code && <p className="text-xs text-red-600 mt-1">{errors.postal_code}</p>}
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="border-t pt-5 mt-5">
        <Label className="text-sm font-semibold text-gray-900 mb-2 block">Languages Spoken</Label>
        <div className="flex flex-wrap gap-2">
          {commonLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                formData.languages_spoken?.includes(lang)
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {errors.submit && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      <Button 
        onClick={handleNext} 
        disabled={uploading || saving}
        className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
      >
        {saving ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving...</span>
          </div>
        ) : (
          "Continue to Payroll"
        )}
      </Button>
    </div>
  );
}

// Step 2: Payroll Preferences
export function PayrollStep({ user, onNext, onBack, stepNumber = 2 }) {
  const [formData, setFormData] = useState({
    method: "Direct Deposit",
    legal_first_name: "",
    legal_last_name: "",
    bank_name: "",
    institution_number: "",
    transit_number: "",
    account_number: "",
    etransfer_email: "",
    auto_deposit_enabled: false,
    security_question: "",
    security_answer: ""
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing payroll preference - SINGLE SOURCE
  useEffect(() => {
    const loadPayroll = async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('getPharmacistOwnProfile', {});
        const { payroll } = response.data || {};
        
        if (payroll) {
          setFormData({
            method: payroll.method || "Direct Deposit",
            legal_first_name: payroll.legal_first_name || "",
            legal_last_name: payroll.legal_last_name || "",
            bank_name: payroll.bank_name || "",
            institution_number: payroll.institution_number || "",
            transit_number: payroll.transit_number || "",
            account_number: payroll.account_number || "",
            etransfer_email: payroll.etransfer_email || "",
            auto_deposit_enabled: payroll.auto_deposit_enabled || false,
            security_question: payroll.security_question || "",
            security_answer: payroll.security_answer || ""
          });
        } else {
          // Pre-fill legal name from user
          const nameParts = (user?.full_name || "").split(" ");
          setFormData(prev => ({
            ...prev,
            legal_first_name: nameParts[0] || "",
            legal_last_name: nameParts.slice(1).join(" ") || ""
          }));
        }
      } catch (e) {
        console.log("No existing payroll preference:", e);
        const nameParts = (user?.full_name || "").split(" ");
        setFormData(prev => ({
          ...prev,
          legal_first_name: nameParts[0] || "",
          legal_last_name: nameParts.slice(1).join(" ") || ""
        }));
      }
      setLoading(false);
    };
    
    if (user?.id) {
      loadPayroll();
    }
  }, [user?.id]);

  const validateStep = () => {
    const newErrors = {};
    
    if (!formData.legal_first_name || formData.legal_first_name.trim().length < 2) {
      newErrors.legal_first_name = "First name required";
    }
    
    if (!formData.legal_last_name || formData.legal_last_name.trim().length < 2) {
      newErrors.legal_last_name = "Last name required";
    }
    
    if (formData.method === "Direct Deposit") {
      if (!formData.bank_name || formData.bank_name.trim().length < 2) {
        newErrors.bank_name = "Bank name required";
      }
      if (!formData.institution_number || !/^\d{3}$/.test(formData.institution_number)) {
        newErrors.institution_number = "Must be 3 digits";
      }
      if (!formData.transit_number || !/^\d{5}$/.test(formData.transit_number)) {
        newErrors.transit_number = "Must be 5 digits";
      }
      if (!formData.account_number || !/^\d{7,12}$/.test(formData.account_number)) {
        newErrors.account_number = "Must be 7-12 digits";
      }
    } else if (formData.method === "Bank E-Transfer") {
      if (!formData.etransfer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.etransfer_email)) {
        newErrors.etransfer_email = "Valid email required";
      }
      if (!formData.auto_deposit_enabled) {
        if (!formData.security_question || formData.security_question.trim().length < 3) {
          newErrors.security_question = "Security question required";
        }
        if (!formData.security_answer || formData.security_answer.trim().length < 2) {
          newErrors.security_answer = "Security answer required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    setSaving(true);
    try {
      const response = await base44.functions.invoke('payrollSavePreference', {
        user_id: user.id,
        ...formData
      });
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      await base44.auth.updateMe({ onboarding_step: 3 });
      
      setSaving(false);
      onNext();
    } catch (error) {
      console.error("Payroll save error:", error);
      setErrors({ submit: error.response?.data?.error || error.message || "Failed to save" });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payroll Settings</h2>
        <p className="text-sm text-gray-600">How would you like to receive payments?</p>
      </div>

      {/* Legal Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-900">Legal First Name *</Label>
          <Input
            value={formData.legal_first_name}
            onChange={(e) => setFormData({ ...formData, legal_first_name: e.target.value })}
            className={`mt-1.5 ${errors.legal_first_name ? 'border-red-500' : ''}`}
          />
          {errors.legal_first_name && <p className="text-xs text-red-600 mt-1">{errors.legal_first_name}</p>}
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-900">Legal Last Name *</Label>
          <Input
            value={formData.legal_last_name}
            onChange={(e) => setFormData({ ...formData, legal_last_name: e.target.value })}
            className={`mt-1.5 ${errors.legal_last_name ? 'border-red-500' : ''}`}
          />
          {errors.legal_last_name && <p className="text-xs text-red-600 mt-1">{errors.legal_last_name}</p>}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <Label className="text-sm font-semibold text-gray-900">Payment Method *</Label>
        <Select
          value={formData.method}
          onValueChange={(v) => setFormData({ ...formData, method: v })}
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
        <div className="space-y-4 bg-gray-50 rounded-lg p-4">
          <div>
            <Label className="text-sm font-medium text-gray-900">Bank Name *</Label>
            <Input
              placeholder="e.g., TD Canada Trust"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className={`mt-1 ${errors.bank_name ? 'border-red-500' : ''}`}
            />
            {errors.bank_name && <p className="text-xs text-red-600 mt-1">{errors.bank_name}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-900">Institution # *</Label>
              <Input
                placeholder="004"
                maxLength={3}
                value={formData.institution_number}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) {
                    setFormData({ ...formData, institution_number: e.target.value });
                  }
                }}
                className={`mt-1 ${errors.institution_number ? 'border-red-500' : ''}`}
              />
              {errors.institution_number && <p className="text-xs text-red-600 mt-1">{errors.institution_number}</p>}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-900">Transit # *</Label>
              <Input
                placeholder="12345"
                maxLength={5}
                value={formData.transit_number}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) {
                    setFormData({ ...formData, transit_number: e.target.value });
                  }
                }}
                className={`mt-1 ${errors.transit_number ? 'border-red-500' : ''}`}
              />
              {errors.transit_number && <p className="text-xs text-red-600 mt-1">{errors.transit_number}</p>}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-900">Account # *</Label>
              <Input
                placeholder="1234567"
                maxLength={12}
                value={formData.account_number}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) {
                    setFormData({ ...formData, account_number: e.target.value });
                  }
                }}
                className={`mt-1 ${errors.account_number ? 'border-red-500' : ''}`}
              />
              {errors.account_number && <p className="text-xs text-red-600 mt-1">{errors.account_number}</p>}
            </div>
          </div>
        </div>
      )}

      {/* E-Transfer Fields */}
      {formData.method === "Bank E-Transfer" && (
        <div className="space-y-4 bg-gray-50 rounded-lg p-4">
          <div>
            <Label className="text-sm font-medium text-gray-900">E-Transfer Email *</Label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={formData.etransfer_email}
              onChange={(e) => setFormData({ ...formData, etransfer_email: e.target.value })}
              className={`mt-1 ${errors.etransfer_email ? 'border-red-500' : ''}`}
            />
            {errors.etransfer_email && <p className="text-xs text-red-600 mt-1">{errors.etransfer_email}</p>}
          </div>

          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border">
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

          {!formData.auto_deposit_enabled && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-900">Security Question *</Label>
                <Input
                  placeholder="e.g., What is my pet's name?"
                  value={formData.security_question}
                  onChange={(e) => setFormData({ ...formData, security_question: e.target.value })}
                  className={`mt-1 ${errors.security_question ? 'border-red-500' : ''}`}
                />
                {errors.security_question && <p className="text-xs text-red-600 mt-1">{errors.security_question}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-900">Security Answer *</Label>
                <Input
                  placeholder="Answer"
                  value={formData.security_answer}
                  onChange={(e) => setFormData({ ...formData, security_answer: e.target.value })}
                  className={`mt-1 ${errors.security_answer ? 'border-red-500' : ''}`}
                />
                {errors.security_answer && <p className="text-xs text-red-600 mt-1">{errors.security_answer}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cheque Info */}
      {formData.method === "Cheque" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            Cheques will be mailed to your registered address. Please ensure your address is up to date in your profile settings.
          </p>
        </div>
      )}

      {errors.submit && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1 h-12"
          disabled={saving}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={saving}
          className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}