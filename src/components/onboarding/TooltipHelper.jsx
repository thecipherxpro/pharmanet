import React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Tooltip Helper Component
 * Shows contextual help tooltips for form fields
 */
export default function TooltipHelper({ content, children }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger type="button" asChild>
          {children || (
            <button
              type="button"
              className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            >
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent
          className="max-w-xs bg-gray-900 text-white text-sm p-3 rounded-lg shadow-xl z-[9999] border-0"
          side="top"
          sideOffset={8}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Field Label with Tooltip
 * Combines label with optional tooltip
 */
export function FieldLabel({ label, required, tooltip, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
    >
      {label}
      {required && <span className="text-red-500">*</span>}
      {tooltip && <TooltipHelper content={tooltip} />}
    </label>
  );
}