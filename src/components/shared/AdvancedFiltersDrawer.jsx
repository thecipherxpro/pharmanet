import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Save } from "lucide-react";

export default function AdvancedFiltersDrawer({ 
  open, 
  onClose, 
  filters, 
  onApply, 
  onClear,
  type = "shift" 
}) {
  const [localFilters, setLocalFilters] = React.useState(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  const activeFiltersCount = Object.values(localFilters).filter(v => v && v !== "all").length;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-teal-600" />
                Advanced Filters
              </SheetTitle>
              <SheetDescription className="mt-1">
                Refine your search results
              </SheetDescription>
            </div>
            {activeFiltersCount > 0 && (
              <Badge className="bg-teal-100 text-teal-700 border-teal-300">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {type === "shift" ? (
            <>
              {/* Rate Range */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Hourly Rate</Label>
                <div className="px-2">
                  <Slider
                    value={[localFilters.minRate || 50]}
                    onValueChange={([value]) => updateFilter('minRate', value)}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>$50/hr</span>
                    <span className="font-semibold text-teal-600">${localFilters.minRate || 50}/hr+</span>
                    <span>$100/hr</span>
                  </div>
                </div>
              </div>

              {/* Shift Type */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Shift Type</Label>
                <Select value={localFilters.shiftType || "all"} onValueChange={(v) => updateFilter('shiftType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="shift_relief">Shift Relief</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Available Within</Label>
                <Select value={localFilters.dateRange || "all"} onValueChange={(v) => updateFilter('dateRange', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Distance */}
              <div>
                <Label className="text-sm font-semibold mb-3 flex items-center justify-between">
                  <span>Maximum Distance</span>
                  <Switch
                    checked={localFilters.distanceEnabled || false}
                    onCheckedChange={(checked) => updateFilter('distanceEnabled', checked)}
                  />
                </Label>
                {localFilters.distanceEnabled && (
                  <div className="px-2">
                    <Slider
                      value={[localFilters.maxDistance || 25]}
                      onValueChange={([value]) => updateFilter('maxDistance', value)}
                      min={5}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>5 km</span>
                      <span className="font-semibold text-teal-600">{localFilters.maxDistance || 25} km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Experience */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Minimum Experience</Label>
                <div className="px-2">
                  <Slider
                    value={[localFilters.minExperience || 0]}
                    onValueChange={([value]) => updateFilter('minExperience', value)}
                    min={0}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>0 years</span>
                    <span className="font-semibold text-teal-600">{localFilters.minExperience || 0}+ years</span>
                    <span>20 years</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Minimum Rating</Label>
                <div className="px-2">
                  <Slider
                    value={[localFilters.minRating || 0]}
                    onValueChange={([value]) => updateFilter('minRating', value)}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>0 ⭐</span>
                    <span className="font-semibold text-teal-600">{localFilters.minRating || 0}+ ⭐</span>
                    <span>5 ⭐</span>
                  </div>
                </div>
              </div>

              {/* Verified Only */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-semibold">Verified Pharmacists Only</Label>
                <Switch
                  checked={localFilters.verifiedOnly || false}
                  onCheckedChange={(checked) => updateFilter('verifiedOnly', checked)}
                />
              </div>

              {/* Available Now */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <Label className="text-sm font-semibold">Available Now</Label>
                <Switch
                  checked={localFilters.availableNow || false}
                  onCheckedChange={(checked) => updateFilter('availableNow', checked)}
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1 h-12"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 h-12 bg-teal-600 hover:bg-teal-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}