import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Check } from "lucide-react";

const LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "Mandarin",
  "Cantonese",
  "Arabic",
  "Punjabi",
  "Tagalog",
  "Hindi",
  "Urdu",
  "Farsi",
  "Turkish",
  "Korean",
  "Vietnamese",
  "Portuguese",
  "Italian",
  "German",
  "Russian"
];

export default function LanguagesDrawer({ open, onClose, languages, onSave }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(languages || []);
    }
  }, [open, languages]);

  const toggleLanguage = (language) => {
    setSelected(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await base44.functions.invoke('updateEmployerPersonalInfo', {
        languages_spoken: selected
      });
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      toast({ title: "Languages updated" });
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
          <SheetTitle>Languages Spoken</SheetTitle>
        </SheetHeader>
        
        <div className="pb-20">
          <p className="text-sm text-gray-500 mb-4">Select all languages you speak</p>
          
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => toggleLanguage(language)}
                className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-between ${
                  selected.includes(language)
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span>{language}</span>
                {selected.includes(language) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gray-900">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Save (${selected.length})`}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}