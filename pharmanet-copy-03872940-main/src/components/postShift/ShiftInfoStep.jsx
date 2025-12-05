import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  FileText, 
  Clock, 
  Calendar, 
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const shiftTypes = [
  { value: "temporary", label: "Temporary", description: "Short-term coverage" },
  { value: "permanent", label: "Permanent", description: "Long-term position" },
  { value: "shift_relief", label: "Shift Relief", description: "Regular relief work" },
  { value: "urgent", label: "Urgent", description: "Immediate need" }
];

export default function ShiftInfoStep({ formData, updateFormData }) {
  const [enhancingTitle, setEnhancingTitle] = useState(false);
  const [enhancingDescription, setEnhancingDescription] = useState(false);
  const [titleEnhanced, setTitleEnhanced] = useState(false);
  const [descriptionEnhanced, setDescriptionEnhanced] = useState(false);

  const titleLength = formData.title?.length || 0;
  const descriptionLength = formData.description?.length || 0;
  const isTitleValid = titleLength >= 20;
  const isDescriptionValid = descriptionLength >= 32;

  const enhanceTitle = async () => {
    if (!formData.title || formData.title.length < 5) return;
    
    setEnhancingTitle(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Enhance this pharmacy shift job title to be more professional and attractive. Keep it concise (max 60 characters). Only return the enhanced title, nothing else.

Original title: "${formData.title}"

Enhanced title:`,
      });
      
      const enhanced = result.trim().replace(/^["']|["']$/g, '');
      if (enhanced && enhanced.length > 0) {
        updateFormData('title', enhanced);
        setTitleEnhanced(true);
        setTimeout(() => setTitleEnhanced(false), 3000);
      }
    } catch (error) {
      console.error("Error enhancing title:", error);
    }
    setEnhancingTitle(false);
  };

  const enhanceDescription = async () => {
    if (!formData.description || formData.description.length < 10) return;
    
    setEnhancingDescription(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Enhance this pharmacy shift job description to be more professional, detailed, and attractive to pharmacists. Keep the core information but make it more compelling. Keep it between 100-300 characters. Only return the enhanced description, nothing else.

Original description: "${formData.description}"

Enhanced description:`,
      });
      
      const enhanced = result.trim().replace(/^["']|["']$/g, '');
      if (enhanced && enhanced.length > 0) {
        updateFormData('description', enhanced);
        setDescriptionEnhanced(true);
        setTimeout(() => setDescriptionEnhanced(false), 3000);
      }
    } catch (error) {
      console.error("Error enhancing description:", error);
    }
    setEnhancingDescription(false);
  };

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Shift Details</h2>
        <p className="text-sm text-gray-500">Describe your shift to attract qualified pharmacists</p>
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            Shift Title <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isTitleValid ? 'text-green-600' : 'text-gray-400'}`}>
              {titleLength}/20 min
            </span>
            {titleEnhanced && (
              <Badge className="bg-green-100 text-green-700 text-[10px]">
                <CheckCircle2 className="w-3 h-3 mr-1" />Enhanced!
              </Badge>
            )}
          </div>
        </div>
        
        <div className="relative">
          <Input
            placeholder="e.g., Full-Day Pharmacist Needed - Busy Retail Location"
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            className={`h-12 pr-12 text-base ${!isTitleValid && titleLength > 0 ? 'border-amber-300' : ''}`}
            maxLength={100}
          />
          <button
            type="button"
            onClick={enhanceTitle}
            disabled={enhancingTitle || titleLength < 5}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              enhancingTitle 
                ? 'bg-purple-100' 
                : titleLength >= 5 
                  ? 'bg-purple-50 hover:bg-purple-100 cursor-pointer' 
                  : 'bg-gray-50 cursor-not-allowed opacity-50'
            }`}
            title="Enhance with AI"
          >
            {enhancingTitle ? (
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-600" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-100">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-[11px] text-purple-700">Click the sparkle icon to enhance your title with AI</span>
        </div>

        {!isTitleValid && titleLength > 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Title needs at least 20 characters ({20 - titleLength} more)
          </p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-500" />
            Description <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDescriptionValid ? 'text-green-600' : 'text-gray-400'}`}>
              {descriptionLength}/32 min
            </span>
            {descriptionEnhanced && (
              <Badge className="bg-green-100 text-green-700 text-[10px]">
                <CheckCircle2 className="w-3 h-3 mr-1" />Enhanced!
              </Badge>
            )}
          </div>
        </div>

        <div className="relative">
          <Textarea
            placeholder="Describe the shift responsibilities, pharmacy environment, what makes this opportunity great..."
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            className={`min-h-[120px] text-base resize-none pr-12 ${!isDescriptionValid && descriptionLength > 0 ? 'border-amber-300' : ''}`}
            maxLength={500}
          />
          <button
            type="button"
            onClick={enhanceDescription}
            disabled={enhancingDescription || descriptionLength < 10}
            className={`absolute right-2 top-3 p-2 rounded-lg transition-all ${
              enhancingDescription 
                ? 'bg-purple-100' 
                : descriptionLength >= 10 
                  ? 'bg-purple-50 hover:bg-purple-100 cursor-pointer' 
                  : 'bg-gray-50 cursor-not-allowed opacity-50'
            }`}
            title="Enhance with AI"
          >
            {enhancingDescription ? (
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-600" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-100">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-[11px] text-purple-700">Click the sparkle icon to enhance your description with AI</span>
        </div>

        {!isDescriptionValid && descriptionLength > 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Description needs at least 32 characters ({32 - descriptionLength} more)
          </p>
        )}
      </div>

      {/* Shift Type */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          Shift Type <span className="text-red-500">*</span>
        </Label>

        <div className="grid grid-cols-2 gap-3">
          {shiftTypes.map((type) => (
            <Card
              key={type.value}
              onClick={() => updateFormData('shiftType', type.value)}
              className={`cursor-pointer transition-all active:scale-[0.98] ${
                formData.shiftType === type.value
                  ? 'border-2 border-teal-600 bg-teal-50 shadow-md'
                  : 'border-2 border-gray-200 hover:border-teal-300'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">{type.label}</span>
                  {formData.shiftType === type.value && (
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{type.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}