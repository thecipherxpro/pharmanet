import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Info, ChevronRight } from "lucide-react";

export default function AboutCTACard() {
  return (
    <Link to={createPageUrl("About")}>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Info className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">About & Support</h3>
            <p className="text-xs text-gray-500">Version info & dispute resolution</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </Link>
  );
}