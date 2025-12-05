import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, Award } from "lucide-react";

const softwareOptions = [
  "Kroll", "Paperless Kroll", "Fillware", "PharmaClik", 
  "Nexxsys", "Commander", "Assyst", "PrimeRx", "McKesson"
];

const shiftIncludesOptions = [
  { key: "assistant_on_site", label: "Assistant / Technician On Site" },
  { key: "vaccination_injections", label: "Vaccination / Injection Services" },
  { key: "addiction_dispensing", label: "Addiction Medication Dispensing" },
  { key: "methadone_suboxone", label: "Methadone / Suboxone Dispensing" }
];

export default function RequirementsStep({ formData, updateFormData }) {
  const toggleShiftIncludes = (key) => {
    updateFormData('shiftIncludes', {
      ...formData.shiftIncludes,
      [key]: !formData.shiftIncludes[key]
    });
  };

  const toggleSoftware = (software) => {
    const current = formData.requirements.software_experience || [];
    const updated = current.includes(software)
      ? current.filter(s => s !== software)
      : [...current, software];
    
    updateFormData('requirements', {
      ...formData.requirements,
      software_experience: updated
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Additional Details</h2>
        <p className="text-sm text-gray-600">Optional - specify requirements and what's included</p>
      </div>

      {/* Shift Includes */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Shift Includes</h3>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {shiftIncludesOptions.map((option) => (
              <div key={option.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Label htmlFor={option.key} className="text-xs sm:text-sm font-medium text-gray-900 cursor-pointer flex-1">
                  {option.label}
                </Label>
                <Switch
                  id={option.key}
                  checked={formData.shiftIncludes[option.key]}
                  onCheckedChange={() => toggleShiftIncludes(option.key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Requirements</h3>
          </div>

          <div className="space-y-4">
            {/* Years of Experience */}
            <div>
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Minimum Years of Experience
              </Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.requirements.years_experience || 0}
                onChange={(e) => updateFormData('requirements', {
                  ...formData.requirements,
                  years_experience: parseInt(e.target.value) || 0
                })}
                className="h-11 sm:h-12 text-base"
                placeholder="0"
              />
            </div>

            {/* Software Experience */}
            <div>
              <Label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block">
                Required Software Experience
              </Label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {softwareOptions.map((software) => {
                  const isSelected = (formData.requirements.software_experience || []).includes(software);
                  return (
                    <Badge
                      key={software}
                      onClick={() => toggleSoftware(software)}
                      className={`cursor-pointer px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {software}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}