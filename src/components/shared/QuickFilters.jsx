import React from "react";
import { Button } from "@/components/ui/button";
import { X, Zap, Star, Clock, MapPin, DollarSign, Award } from "lucide-react";

export default function QuickFilters({ filters, onFilterChange, onClearAll, type = "shift" }) {
  const shiftPresets = [
    { label: "Urgent", icon: Zap, filter: { urgency: "emergency" }, color: "bg-red-100 text-red-700 border-red-300" },
    { label: "High Pay", icon: DollarSign, filter: { minRate: 70 }, color: "bg-green-100 text-green-700 border-green-300" },
    { label: "Near Me", icon: MapPin, filter: { nearby: true }, color: "bg-blue-100 text-blue-700 border-blue-300" },
    { label: "Today", icon: Clock, filter: { today: true }, color: "bg-purple-100 text-purple-700 border-purple-300" },
  ];

  const pharmacistPresets = [
    { label: "Top Rated", icon: Star, filter: { category: "top-rated" }, color: "bg-amber-100 text-amber-700 border-amber-300" },
    { label: "Verified", icon: Award, filter: { verified: true }, color: "bg-green-100 text-green-700 border-green-300" },
    { label: "Available Now", icon: Clock, filter: { availableNow: true }, color: "bg-blue-100 text-blue-700 border-blue-300" },
    { label: "Experienced", icon: Star, filter: { experienced: true }, color: "bg-purple-100 text-purple-700 border-purple-300" },
  ];

  const presets = type === "shift" ? shiftPresets : pharmacistPresets;
  const activeFiltersCount = Object.values(filters).filter(v => v && v !== "all").length;

  const handlePresetClick = (preset) => {
    const newFilters = { ...filters, ...preset.filter };
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">Quick Filters</p>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {presets.map((preset, index) => {
          const Icon = preset.icon;
          const isActive = Object.entries(preset.filter).every(
            ([key, value]) => filters[key] === value
          );
          
          return (
            <button
              key={index}
              onClick={() => handlePresetClick(preset)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? preset.color
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              <Icon className="w-3 h-3 inline mr-1" />
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}