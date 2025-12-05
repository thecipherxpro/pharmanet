import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format, eachDayOfInterval, addDays, isBefore, isPast } from "date-fns";
import { Calendar, Clock, CheckCircle } from "lucide-react";

export default function BulkAvailabilityDialog({ 
  open, 
  onClose, 
  onSave,
  maxDaysAhead = 30
}) {
  const today = new Date();
  const maxDate = addDays(today, maxDaysAhead);

  const [formData, setFormData] = useState({
    start_date: format(today, "yyyy-MM-dd"),
    end_date: format(addDays(today, 6), "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "17:00",
    notes: ""
  });

  const handleSave = () => {
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (isBefore(endDate, startDate)) {
      alert("End date must be after start date");
      return;
    }

    if (endDate > maxDate) {
      alert(`Cannot set availability beyond ${maxDaysAhead} days`);
      return;
    }

    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate })
      .filter(day => !isPast(day) || format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"));

    onSave(daysInRange, {
      start_time: formData.start_time,
      end_time: formData.end_time,
      notes: formData.notes
    });
  };

  const daysCount = (() => {
    try {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (isBefore(endDate, startDate)) return 0;
      return eachDayOfInterval({ start: startDate, end: endDate })
        .filter(day => !isPast(day) || format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
        .length;
    } catch {
      return 0;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Add Multiple Days
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium mb-2 block">Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                min={format(today, "yyyy-MM-dd")}
                max={format(maxDate, "yyyy-MM-dd")}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">End Date *</Label>
              <Input
                type="date"
                value={formData.end_date}
                min={formData.start_date}
                max={format(maxDate, "yyyy-MM-dd")}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium mb-2 block">Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-medium mb-2 block">Notes (Optional)</Label>
            <Textarea
              placeholder="e.g., Available for morning shifts"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[60px] text-sm"
              rows={2}
            />
          </div>

          {/* Preview */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-900">
                {daysCount} day{daysCount !== 1 ? 's' : ''} will be added
              </span>
              <Badge className="bg-indigo-600 text-white">
                <Clock className="w-3 h-3 mr-1" />
                {formData.start_time} - {formData.end_time}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="text-sm h-10">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={daysCount === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-sm h-10"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Add {daysCount} Day{daysCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}