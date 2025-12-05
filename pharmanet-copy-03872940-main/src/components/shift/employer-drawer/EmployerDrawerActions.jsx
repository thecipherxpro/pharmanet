import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, ExternalLink } from "lucide-react";

export default function EmployerDrawerActions({ onEdit, onViewFullDetails, showFullDetails }) {
  return (
    <div className="border-t border-gray-200 p-4 bg-white sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onEdit}
          className="flex-1 h-12 rounded-xl border-gray-300 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Shift
        </Button>
        
        {showFullDetails && (
          <Button
            onClick={onViewFullDetails}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-200"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}