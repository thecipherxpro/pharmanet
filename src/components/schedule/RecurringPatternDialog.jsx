import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfWeek, addWeeks, eachDayOfInterval, getDay, isPast } from "date-fns";
import { Repeat, CheckCircle, Calendar } from "lucide-react";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" }
];

export default function RecurringPatternDialog({ 
  open, 
  onClose, 
  onSave,
  maxDaysAhead = 30
}) {
  const today = new Date();
  const maxDate = addDays(today, maxDaysAhead);

  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri default
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [weeksCount, setWeeksCount] = useState(2);

  const toggleDay = (dayValue) => {
    setSelectedDays(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    );
  };

  const handleSave = () => {
    if (selectedDays.length === 0) {
      alert("Please select at least one day");
      return;
    }

    const startDate = startOfWeek(today);
    const endDate = addWeeks(startDate, weeksCount);
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })
      .filter(day => selectedDays.includes(getDay(day)))
      .filter(day => !isPast(day) || format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
      .filter(day => day <= maxDate);

    onSave(allDays, {
      start_time: startTime,
      end_time: endTime,
      notes: `Weekly: ${selectedDays.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(', ')}`
    });
  };

  const previewCount = (() => {
    const startDate = startOfWeek(today);
    const endDate = addWeeks(startDate, weeksCount);
    return eachDayOfInterval({ start: startDate, end: endDate })
      .filter(day => selectedDays.includes(getDay(day)))
      .filter(day => !isPast(day) || format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
      .filter(day => day <= maxDate)
      .length;
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-600" />
            Recurring Pattern
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Weekday Selection */}
          <div>
            <Label className="text-xs font-medium mb-2 block">Select Days *</Label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`
                    aspect-square rounded-lg text-xs font-semibold
                    transition-all border-2
                    ${selectedDays.includes(day.value)
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <Label className="text-xs font-medium mb-2 block">Quick Presets</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                className="text-xs h-7"
              >
                Mon-Fri
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDays([0, 6])}
                className="text-xs h-7"
              >
                Weekends
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                className="text-xs h-7"
              >
                All Days
              </Button>
            </div>
          </div>

          {/* Number of Weeks */}
          <div>
            <Label className="text-xs font-medium mb-2 block">Number of Weeks</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(weeks => (
                <button
                  key={weeks}
                  onClick={() => setWeeksCount(weeks)}
                  className={`
                    flex-1 py-2 rounded-lg text-sm font-semibold
                    transition-all border-2
                    ${weeksCount === weeks
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }
                  `}
                >
                  {weeks}w
                </button>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium mb-2 block">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-indigo-900">
                {previewCount} day{previewCount !== 1 ? 's' : ''} will be added
              </span>
              <Badge className="bg-indigo-600 text-white text-xs">
                {weeksCount} week{weeksCount !== 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-xs text-indigo-700">
              {selectedDays.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(', ')} • {startTime}-{endTime}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="text-sm h-10">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={selectedDays.length === 0 || previewCount === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-sm h-10"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Pattern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}