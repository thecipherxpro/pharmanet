import React, { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SOFTWARE_OPTIONS = [
  "Kroll", "Paperless Kroll", "Fillware", "PharmaClik", 
  "Nexxsys", "Commander", "Assyst", "PrimeRx", "McKesson"
];

const SHIFT_TYPES = [
  { value: "temporary", label: "Temporary" },
  { value: "permanent", label: "Permanent" },
  { value: "shift_relief", label: "Shift Relief" },
  { value: "urgent", label: "Urgent" }
];

const LOCATIONS = [
  "Toronto", "Mississauga", "Brampton", "Markham", "Vaughan",
  "Richmond Hill", "Oakville", "Burlington", "Hamilton"
];

export default function EmployerFilters({ filters, setFilters, activeCount }) {
  const [showSheet, setShowSheet] = useState(false);

  const toggleFilter = (type, value) => {
    if (type === 'verified' || type === 'topRated') {
      setFilters(prev => ({ ...prev, [type]: !prev[type] }));
    } else {
      setFilters(prev => ({
        ...prev,
        [type]: prev[type].includes(value)
          ? prev[type].filter(v => v !== value)
          : [...prev[type], value]
      }));
    }
  };

  const clearAllFilters = () => {
    setFilters({
      verified: false,
      topRated: false,
      software: [],
      shiftTypes: [],
      locations: []
    });
  };

  return (
    <>
      {/* Mobile: Quick Filters + Sheet Button */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Verified */}
          <button
            onClick={() => toggleFilter('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              filters.verified
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Verified
          </button>

          {/* Top Rated */}
          <button
            onClick={() => toggleFilter('topRated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              filters.topRated
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Top Rated
          </button>

          {/* More Filters Sheet */}
          <Sheet open={showSheet} onOpenChange={setShowSheet}>
            <SheetTrigger asChild>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center gap-1 flex-shrink-0">
                <Filter className="w-3 h-3" />
                More
                {activeCount > 0 && (
                  <span className="ml-1 w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {activeCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader className="pb-4 border-b border-gray-200">
                <SheetTitle className="text-lg font-bold text-gray-900">
                  Filter Employers
                </SheetTitle>
              </SheetHeader>

              <div className="overflow-y-auto h-[calc(85vh-120px)] py-4 space-y-6">
                {/* Software */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Software</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {SOFTWARE_OPTIONS.map((software) => (
                      <button
                        key={software}
                        onClick={() => toggleFilter('software', software)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          filters.software.includes(software)
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {software}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shift Types */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Shift Types</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {SHIFT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleFilter('shiftTypes', type.value)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          filters.shiftTypes.includes(type.value)
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Locations</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {LOCATIONS.map((location) => (
                      <button
                        key={location}
                        onClick={() => toggleFilter('locations', location)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          filters.locations.includes(location)
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex-1 h-11 border-gray-300"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setShowSheet(false)}
                    className="flex-1 h-11 bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Clear All (when filters active) */}
          {activeCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-gray-900 text-white hover:bg-gray-800 transition-all flex items-center gap-1 flex-shrink-0"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>
    </>
  );
}