import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Settings, 
  AlertTriangle, 
  Wrench, 
  Shield, 
  Lock,
  AlertCircle,
  Server,
  CloudOff
} from "lucide-react";

const iconMap = {
  Settings,
  AlertTriangle,
  Wrench,
  Shield,
  Lock,
  AlertCircle,
  Server,
  CloudOff
};

export default function MaintenanceMode() {
  const { data: overrides = [] } = useQuery({
    queryKey: ['systemOverride'],
    queryFn: () => base44.entities.SystemOverride.list(),
  });

  const config = overrides[0] || {
    icon_name: "Settings",
    title: "System Maintenance",
    message: "We're currently performing scheduled maintenance. Please check back soon.",
    footer_text: "Thank you for your patience.",
    primary_color: "#000000",
    background_color: "#FFFFFF"
  };

  const Icon = iconMap[config.icon_name] || Settings;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: config.background_color, color: config.primary_color }}
    >
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${config.primary_color}15` }}
        >
          <Icon className="w-12 h-12" style={{ color: config.primary_color }} />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {config.title}
        </h1>

        {/* Message */}
        <p className="text-lg md:text-xl opacity-80 mb-8 leading-relaxed px-4">
          {config.message}
        </p>

        {/* Footer */}
        <p className="text-sm opacity-60">
          {config.footer_text}
        </p>
      </div>
    </div>
  );
}