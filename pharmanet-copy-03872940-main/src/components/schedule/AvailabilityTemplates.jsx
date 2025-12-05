import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sunrise, Sun, Sunset, Clock, Zap } from "lucide-react";

const TEMPLATES = [
  { 
    id: 'morning', 
    label: 'Morning', 
    icon: Sunrise, 
    time: { start: '06:00', end: '12:00' },
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700'
  },
  { 
    id: 'full', 
    label: 'Full Day', 
    icon: Sun, 
    time: { start: '09:00', end: '17:00' },
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
  },
  { 
    id: 'afternoon', 
    label: 'Afternoon', 
    icon: Sun, 
    time: { start: '13:00', end: '18:00' },
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700'
  },
  { 
    id: 'evening', 
    label: 'Evening', 
    icon: Sunset, 
    time: { start: '17:00', end: '22:00' },
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700'
  },
  { 
    id: 'flexible', 
    label: 'Flexible', 
    icon: Zap, 
    time: { start: '08:00', end: '20:00' },
    color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700'
  },
];

export default function AvailabilityTemplates({ onSelectTemplate }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-700 mb-2">Quick Templates</h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.time)}
              className={`
                ${template.color}
                border-2 rounded-lg p-2 transition-all
                hover:scale-105 hover:shadow-md
                active:scale-95
              `}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-semibold">{template.label}</p>
              <p className="text-[10px] opacity-80 mt-0.5">
                {template.time.start}-{template.time.end}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}