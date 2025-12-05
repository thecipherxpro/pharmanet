import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ProfileAvatar from "../shared/ProfileAvatar";
import { CheckCircle, CheckCircle2 } from "lucide-react";
import { validatePhone } from "../utils/validationUtils";
import SkipPharmacyWarning from "./SkipPharmacyWarning";
import TooltipHelper from "./TooltipHelper";

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

// Step 1: Avatar & Company Info
export function CompanyInfoStep({ user, setUser, formData, setFormData, onNext, stepNumber = 1 }) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [fieldValidation, setFieldValidation] = useState({
    phone: false,
    bio: false
  });

  const validateStep = () => {
    const newErrors = {};
    
    if (!user?.avatar_url) {
      newErrors.avatar = "Company logo is required";
    }
    
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error;
    }
    
    if (!formData.bio || formData.bio.trim().length === 0) {
      newErrors.bio = "Company bio is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (value) => {
    setFormData(prev => ({ ...prev, phone: value }));
    setFieldValidation(prev => ({ ...prev, phone: validatePhone(value).isValid }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
  };

  const handleBioChange = (value) => {
    setFormData(prev => {
      console.log('[handleBioChange] Previous formData:', prev);
      const updated = { ...prev, bio: value };
      console.log('[handleBioChange] Updated formData:', updated);
      return updated;
    });
    setFieldValidation(prev => ({ ...prev, bio: value.trim().length > 0 }));
    if (errors.bio) setErrors(prev => ({ ...prev, bio: null }));
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    setSaving(true);

    try {
      // Update User with display name only
      await base44.auth.updateMe({
        display_name: user.full_name || user.email.split('@')[0],
        onboarding_step: 2
      });

      // Save employer-specific data to Public_Employer_Profile
      const existingProfiles = await base44.entities.Public_Employer_Profile.filter({
        user_id: user.id
      });

      const profileData = {
        user_id: user.id,
        employer_email: user.email,
        full_name: user.full_name || user.email.split('@')[0],
        phone: formData.phone,
        bio: formData.bio.trim()
      };

      if (existingProfiles.length > 0) {
        await base44.entities.Public_Employer_Profile.update(existingProfiles[0].id, profileData);
      } else {
        await base44.entities.Public_Employer_Profile.create(profileData);
      }

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
    setUser(prev => ({ ...prev, avatar_url: newAvatarUrl }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Company Information</h2>
        <p className="text-xs sm:text-sm text-gray-600">Set up your public employer profile</p>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 bg-gray-50 rounded-xl p-4 sm:p-6">
        <ProfileAvatar 
          user={user}
          size="xl"
          editable={true}
          onUploadStart={() => setUploading(true)}
          onUploadSuccess={handleAvatarUpload}
          onUploadError={() => setUploading(false)}
        />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Company Logo</p>
          <p className="text-xs text-gray-500 mt-1">
            {user?.avatar_url ? "✓ Logo uploaded" : "Click to upload"}
          </p>
        </div>
        {errors.avatar && (
          <p className="text-xs text-red-600">{errors.avatar}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Label className="text-sm font-semibold text-gray-900">Contact Phone *</Label>
          <TooltipHelper content="This will be used for shift notifications and pharmacist communication" />
        </div>
        <div className="relative">
          <Input
            type="tel"
            placeholder="4165550123 or (416) 555-0123"
            value={formData.phone || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[0-9\s\-()]*$/.test(value)) {
                handlePhoneChange(value);
              }
            }}
            className={`mt-1.5 pr-10 ${errors.phone ? 'border-red-500' : fieldValidation.phone ? 'border-green-500' : ''}`}
            maxLength={14}
          />
          {fieldValidation.phone && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600 mt-0.75" />
          )}
        </div>
        {errors.phone ? (
          <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">Format: (416) 555-0123, 416-555-0123, or 4165550123</p>
        )}
      </div>

      {/* Company Bio */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Label className="text-sm font-semibold text-gray-900">Company Bio *</Label>
          <TooltipHelper content="Tell pharmacists what makes your workplace great. Highlight your culture, benefits, and team environment." />
        </div>
        <div className="relative">
          <Textarea
            placeholder="Tell pharmacists about your company, work culture, and what makes you a great employer..."
            rows={4}
            value={formData.bio || ""}
            onChange={(e) => handleBioChange(e.target.value)}
            className={`mt-1.5 resize-none ${errors.bio ? 'border-red-500' : fieldValidation.bio ? 'border-green-500' : ''}`}
          />
          {fieldValidation.bio && (
            <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-green-600" />
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          {errors.bio ? (
            <p className="text-xs text-red-600">{errors.bio}</p>
          ) : (
            <p className="text-xs text-gray-500">
              {formData.bio?.length || 0} characters
            </p>
          )}
        </div>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.submit}</p>
      )}

      <Button 
        onClick={handleNext} 
        disabled={uploading || saving}
        className="w-full h-11 sm:h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm sm:text-base"
      >
        {saving ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </div>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );
}

// Step 2: Personal Information
export function PersonalInfoStep({ user, setUser, formData, setFormData, onNext, onBack, stepNumber = 2 }) {
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const PROVINCES = ["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "YT", "NU"];
  const LANGUAGES = ["English", "French", "Spanish", "Mandarin", "Cantonese", "Arabic", "Punjabi", "Tagalog", "Hindi", "Urdu", "Farsi", "Turkish"];

  const validateStep = () => {
    const newErrors = {};
    
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = "Full legal name is required";
    }
    
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    } else {
      const age = Math.floor((new Date() - new Date(formData.date_of_birth)) / 31557600000);
      if (age < 18) {
        newErrors.date_of_birth = "You must be at least 18 years old";
      }
    }
    
    if (!formData.personal_address?.street || formData.personal_address.street.trim().length < 5) {
      newErrors.street = "Street address is required";
    }
    
    if (!formData.personal_address?.city || formData.personal_address.city.trim().length < 2) {
      newErrors.city = "City is required";
    }
    
    if (!formData.personal_address?.postal_code || !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(formData.personal_address.postal_code)) {
      newErrors.postal_code = "Valid postal code required (e.g., M5V 3A8)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    setSaving(true);
    
    try {
        // Update User entity with display name
        await base44.auth.updateMe({
          display_name: formData.full_name.trim(),
          onboarding_step: 3
        });

        const existingProfiles = await base44.entities.Employer_Profile.filter({
          user_id: user.id
        });

        const profileData = {
          user_id: user.id,
          full_name: formData.full_name.trim(),
          email: user.email,
          date_of_birth: formData.date_of_birth,
          personal_address: [formData.personal_address],
          languages_spoken: formData.languages_spoken || []
        };

        if (existingProfiles.length > 0) {
          await base44.entities.Employer_Profile.update(existingProfiles[0].id, profileData);
        } else {
          await base44.entities.Employer_Profile.create(profileData);
        }

        // Reload user to confirm save
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

  const toggleLanguage = (language) => {
    setFormData(prev => {
      const current = prev.languages_spoken || [];
      const updated = current.includes(language)
        ? current.filter(l => l !== language)
        : [...current, language];
      return { ...prev, languages_spoken: updated };
    });
  };

  // No initialization needed - parent already initializes personal_address

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Personal Information</h2>
        <p className="text-xs sm:text-sm text-gray-600">Your personal details for account verification</p>
      </div>

      {/* Full Name */}
      <div>
        <Label className="text-sm font-semibold text-gray-900">Full Legal Name *</Label>
        <Input
          placeholder="John Smith"
          value={formData.full_name || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          className={`mt-1.5 ${errors.full_name ? 'border-red-500' : ''}`}
        />
        {errors.full_name && (
          <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
        )}
      </div>

      {/* Date of Birth */}
      <div>
        <Label className="text-sm font-semibold text-gray-900">Date of Birth *</Label>
        <Input
          type="date"
          value={formData.date_of_birth || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
          className={`mt-1.5 ${errors.date_of_birth ? 'border-red-500' : ''}`}
        />
        {errors.date_of_birth && (
          <p className="text-xs text-red-600 mt-1">{errors.date_of_birth}</p>
        )}
      </div>

      {/* Address */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
        <Label className="text-sm font-semibold text-gray-900">Personal Address *</Label>
        
        <div>
          <Input
            placeholder="Street Address"
            value={formData.personal_address?.street || ""}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              personal_address: { ...prev.personal_address, street: e.target.value }
            }))}
            className={errors.street ? 'border-red-500' : ''}
          />
          {errors.street && (
            <p className="text-xs text-red-600 mt-1">{errors.street}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Input
              placeholder="City"
              value={formData.personal_address?.city || ""}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                personal_address: { ...prev.personal_address, city: e.target.value }
              }))}
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && (
              <p className="text-xs text-red-600 mt-1">{errors.city}</p>
            )}
          </div>
          <div>
            <select
              value={formData.personal_address?.province || "ON"}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                personal_address: { ...prev.personal_address, province: e.target.value }
              }))}
              className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
            >
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Input
            placeholder="Postal Code (M5V 3A8)"
            value={formData.personal_address?.postal_code || ""}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              personal_address: { ...prev.personal_address, postal_code: e.target.value.toUpperCase() }
            }))}
            maxLength={7}
            className={errors.postal_code ? 'border-red-500' : ''}
          />
          {errors.postal_code && (
            <p className="text-xs text-red-600 mt-1">{errors.postal_code}</p>
          )}
        </div>
      </div>

      {/* Languages */}
      <div>
        <Label className="text-sm font-semibold text-gray-900 mb-2 block">
          Languages Spoken <span className="text-xs text-gray-500 font-normal">(Optional)</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => toggleLanguage(language)}
              className={`px-3 py-2 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                (formData.languages_spoken || []).includes(language)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {language}
            </button>
          ))}
        </div>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.submit}</p>
      )}

      <div className="flex gap-2 sm:gap-3">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
          disabled={saving}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={saving}
          className="flex-1 h-11 sm:h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm sm:text-base"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

// Step 3: Add First Pharmacy
export function AddPharmacyStep({ user, onNext, onBack, onSkip, stepNumber = 3 }) {
  const [hasPharmacies, setHasPharmacies] = useState(false);
  const [checking, setChecking] = useState(true);
  const [formData, setFormData] = useState({
    pharmacy_name: "",
    address: "",
    city: "",
    province: "ON",
    postal_code: "",
    phone: "",
    email: "",
    manager_name: "",
    software: ""
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  React.useEffect(() => {
    checkExistingPharmacies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkExistingPharmacies = async () => {
    try {
      const pharmacies = await base44.entities.Pharmacy.filter({ created_by: user.email });
      if (pharmacies.length > 0) {
        setHasPharmacies(true);
      }
    } catch (error) {
      console.error("Error checking pharmacies:", error);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="space-y-4 sm:space-y-6 text-center py-8">
        <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-600">Checking your pharmacies...</p>
      </div>
    );
  }

  if (hasPharmacies) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Pharmacy Already Added</h2>
          <p className="text-xs sm:text-sm text-gray-600">You already have at least one pharmacy set up</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button 
            onClick={onBack}
            variant="outline"
            className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
          >
            Back
          </Button>
          <Button 
            onClick={onSkip || onNext}
            className="flex-1 h-11 sm:h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm sm:text-base"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  const SOFTWARE_OPTIONS = [
    "Kroll", "Paperless Kroll", "Fillware", "PharmaClik", 
    "Nexxsys", "Commander", "Assyst", "PrimeRx", "McKesson", "Other"
  ];

  const validateStep = () => {
    const newErrors = {};

    if (!formData.pharmacy_name || formData.pharmacy_name.trim().length < 2) {
      newErrors.pharmacy_name = "Pharmacy name is required";
    }

    if (!formData.address || formData.address.trim().length < 5) {
      newErrors.address = "Street address is required";
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = "City is required";
    }

    if (!formData.postal_code || !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(formData.postal_code)) {
      newErrors.postal_code = "Valid postal code required";
    }

    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error;
    }

    if (!formData.manager_name || formData.manager_name.trim().length < 2) {
      newErrors.manager_name = "Manager name is required";
    }

    if (!formData.software) {
      newErrors.software = "Software selection is required";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid pharmacy email is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    setSaving(true);
    
    try {
      await base44.entities.Pharmacy.create(formData);
      
      await base44.auth.updateMe({
        onboarding_step: 4
      });
      
      setSaving(false);
      onNext();
    } catch (error) {
      console.error("Save error:", error);
      setErrors({ submit: error.message || "Failed to save pharmacy" });
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Add Your First Pharmacy</h2>
        <p className="text-xs sm:text-sm text-gray-600">You need at least one pharmacy to post shifts</p>
      </div>

      <div>
        <Label className="text-sm font-semibold text-gray-900">Pharmacy Name *</Label>
        <Input
          placeholder="Shoppers Drug Mart"
          value={formData.pharmacy_name}
          onChange={(e) => setFormData(prev => ({ ...prev, pharmacy_name: e.target.value }))}
          className={`mt-1.5 ${errors.pharmacy_name ? 'border-red-500' : ''}`}
        />
        {errors.pharmacy_name && <p className="text-xs text-red-600 mt-1">{errors.pharmacy_name}</p>}
      </div>

      <div>
        <Label className="text-sm font-semibold text-gray-900">Street Address *</Label>
        <Input
          placeholder="123 Main Street"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className={`mt-1.5 ${errors.address ? 'border-red-500' : ''}`}
        />
        {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div>
          <Label className="text-sm font-semibold text-gray-900">City *</Label>
          <Input
            placeholder="Toronto"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className={`mt-1.5 ${errors.city ? 'border-red-500' : ''}`}
          />
          {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-900">Postal Code *</Label>
          <Input
            placeholder="M5V 3A8"
            value={formData.postal_code}
            onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value.toUpperCase() }))}
            maxLength={7}
            className={`mt-1.5 ${errors.postal_code ? 'border-red-500' : ''}`}
          />
          {errors.postal_code && <p className="text-xs text-red-600 mt-1">{errors.postal_code}</p>}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-gray-900">Pharmacy Phone *</Label>
        <Input
          type="tel"
          placeholder="(416) 555-0123"
          value={formData.phone}
          onChange={(e) => {
            const value = e.target.value;
            if (/^[0-9\s\-()]*$/.test(value)) {
              setFormData(prev => ({ ...prev, phone: value }));
            }
          }}
          maxLength={14}
          className={`mt-1.5 ${errors.phone ? 'border-red-500' : ''}`}
        />
        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label className="text-sm font-semibold text-gray-900">Pharmacy Email *</Label>
        <Input
          type="email"
          placeholder="pharmacy@example.com"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={`mt-1.5 ${errors.email ? 'border-red-500' : ''}`}
        />
        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        <p className="text-xs text-gray-500 mt-1">Contact email for this pharmacy location</p>
      </div>

      <div>
        <Label className="text-sm font-semibold text-gray-900">Manager Name *</Label>
        <Input
          placeholder="John Smith"
          value={formData.manager_name}
          onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
          className={`mt-1.5 ${errors.manager_name ? 'border-red-500' : ''}`}
        />
        {errors.manager_name && <p className="text-xs text-red-600 mt-1">{errors.manager_name}</p>}
      </div>

      <div>
        <Label className="text-sm font-semibold text-gray-900">Pharmacy Software *</Label>
        <select
          value={formData.software}
          onChange={(e) => setFormData(prev => ({ ...prev, software: e.target.value }))}
          className={`w-full h-10 px-3 border rounded-md text-sm mt-1.5 ${errors.software ? 'border-red-500' : 'border-gray-200'}`}
        >
          <option value="">Select software...</option>
          {SOFTWARE_OPTIONS.map(sw => <option key={sw} value={sw}>{sw}</option>)}
        </select>
        {errors.software && <p className="text-xs text-red-600 mt-1">{errors.software}</p>}
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.submit}</p>
      )}

      <div className="flex gap-2 sm:gap-3">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
          disabled={saving}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={saving}
          className="flex-1 h-11 sm:h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm sm:text-base"
        >
          {saving ? "Saving..." : "Continue"}
        </Button>
      </div>

      {/* Skip Warning Dialog */}
      <SkipPharmacyWarning
        open={showSkipWarning}
        onClose={() => setShowSkipWarning(false)}
        onAddPharmacy={() => setShowSkipWarning(false)}
        onSkip={() => {
          setShowSkipWarning(false);
          if (onSkip) onSkip();
          else onNext();
        }}
      />
    </div>
  );
}

// Step 4: Public Profile Details
export function PublicProfileStep({ user, formData, setFormData, onNext, onBack, stepNumber = 4 }) {
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validateStep = () => {
    const newErrors = {};
    
    if (!formData.software_used || formData.software_used.length === 0) {
      newErrors.software = "Select at least one software you use";
    }
    
    if (!formData.preferred_shift_types || formData.preferred_shift_types.length === 0) {
      newErrors.shift_types = "Select at least one shift type you typically post";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    setSaving(true);
    
    try {
      // Get existing public profile to preserve bio and phone from Step 1
      const existingPublicProfiles = await base44.entities.Public_Employer_Profile.filter({
        user_id: user.id
      });
      
      const existingPublic = existingPublicProfiles[0] || {};
      
      const publicProfileData = {
        user_id: user.id,
        employer_email: user.email,
        full_name: user.full_name || existingPublic.full_name,
        bio: existingPublic.bio || "", // Preserve from Step 1
        phone: existingPublic.phone || "", // Preserve from Step 1
        software_used: formData.software_used,
        preferred_shift_types: formData.preferred_shift_types,
        workplace_culture: formData.workplace_culture || "",
        website: formData.website || "",
        contact_email_public: formData.contact_email_public || false,
        contact_phone_public: formData.contact_phone_public || false,
        active_since: existingPublic.active_since || new Date().toISOString().split('T')[0],
        is_active: true
      };

      if (existingPublicProfiles.length > 0) {
        await base44.entities.Public_Employer_Profile.update(existingPublicProfiles[0].id, publicProfileData);
      } else {
        await base44.entities.Public_Employer_Profile.create(publicProfileData);
      }

      await base44.auth.updateMe({
        onboarding_step: 5
      });
      
      setSaving(false);
      onNext();
    } catch (error) {
      console.error("Save error:", error);
      setErrors({ submit: error.message || "Failed to save. Please try again." });
      setSaving(false);
    }
  };

  const toggleSoftware = (software) => {
    setFormData(prev => {
      const current = prev.software_used || [];
      const updated = current.includes(software)
        ? current.filter(s => s !== software)
        : [...current, software];
      return { ...prev, software_used: updated };
    });
  };

  const toggleShiftType = (type) => {
    setFormData(prev => {
      const current = prev.preferred_shift_types || [];
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return { ...prev, preferred_shift_types: updated };
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Public Profile</h2>
        <p className="text-xs sm:text-sm text-gray-600">Information visible to pharmacists</p>
      </div>

      {/* Software Used */}
      <div>
        <Label className="text-sm font-semibold text-gray-900 mb-2 block">
          Software Used * <span className="text-xs text-gray-500 font-normal">(Select all that apply)</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {SOFTWARE_OPTIONS.map((software) => (
            <button
              key={software}
              type="button"
              onClick={() => toggleSoftware(software)}
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
        {errors.software && (
          <p className="text-xs text-red-600 mt-1">{errors.software}</p>
        )}
      </div>

      {/* Preferred Shift Types */}
      <div>
        <Label className="text-sm font-semibold text-gray-900 mb-2 block">
          Shift Types You Post * <span className="text-xs text-gray-500 font-normal">(Select all that apply)</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {SHIFT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleShiftType(type.value)}
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
        {errors.shift_types && (
          <p className="text-xs text-red-600 mt-1">{errors.shift_types}</p>
        )}
      </div>

      {/* Website (Optional) */}
      <div>
        <Label className="text-sm font-semibold text-gray-900">Company Website (Optional)</Label>
        <Input
          type="url"
          placeholder="https://yourpharmacy.com"
          value={formData.website || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
          className="mt-1.5"
        />
      </div>

      {/* Workplace Culture (Optional) */}
      <div>
        <Label className="text-sm font-semibold text-gray-900">Workplace Culture (Optional)</Label>
        <Textarea
          placeholder="Describe your team, work environment, and culture..."
          rows={3}
          value={formData.workplace_culture || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, workplace_culture: e.target.value }))}
          className="mt-1.5 resize-none"
        />
      </div>

      {/* Contact Visibility */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <Label className="text-sm font-semibold text-gray-900">Contact Visibility</Label>
        <div className="flex items-start gap-3">
          <Checkbox
            id="contact_email_public"
            checked={formData.contact_email_public || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contact_email_public: checked }))}
          />
          <div className="flex-1">
            <label htmlFor="contact_email_public" className="text-sm font-medium text-gray-900 cursor-pointer">
              Show email publicly
            </label>
            <p className="text-xs text-gray-600 mt-0.5">
              Pharmacists can see your email without applying
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="contact_phone_public"
            checked={formData.contact_phone_public || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contact_phone_public: checked }))}
          />
          <div className="flex-1">
            <label htmlFor="contact_phone_public" className="text-sm font-medium text-gray-900 cursor-pointer">
              Show phone publicly
            </label>
            <p className="text-xs text-gray-600 mt-0.5">
              Pharmacists can see your phone without applying
            </p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.submit}</p>
      )}

      <div className="flex gap-2 sm:gap-3">
        <Button 
          onClick={onBack}
          variant="outline"
          className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
          disabled={saving}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          disabled={saving}
          className="flex-1 h-11 sm:h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm sm:text-base"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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