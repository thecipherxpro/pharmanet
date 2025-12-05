import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  AlertCircle, 
  Copy, 
  DollarSign, 
  CircleDollarSign,
  CalendarRange,
  CalendarPlus,
  ArrowRight,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Switch } from "@/components/ui/switch";

// Inline RateCalculator
const RateCalculator = {
  calculateRate: (daysAhead) => {
    let rate, urgency;
    if (daysAhead === 0) { rate = 90; urgency = "emergency"; }
    else if (daysAhead === 1) { rate = 65; urgency = "very_urgent"; }
    else if (daysAhead === 2) { rate = 60; urgency = "urgent"; }
    else if (daysAhead <= 4) { rate = 60 - ((daysAhead - 2) / 2); urgency = "short_notice"; }
    else if (daysAhead <= 10) { rate = 59 - ((daysAhead - 5) / 5) * 3; urgency = "moderate"; }
    else if (daysAhead <= 14) { rate = 55 - ((daysAhead - 11) / 3); urgency = "reasonable"; }
    else { rate = 50; urgency = "planned"; }
    return { rate: Math.round(rate * 100) / 100, urgency };
  }
};

// Sub-step 1: Choose Method
function ChooseMethodStep({ onSelect, hasBusinessHours }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Schedule Your Shifts</h2>
        <p className="text-xs sm:text-sm text-gray-500">Select how you want to set date and time</p>
      </div>

      {/* Recurring Shifts Card */}
      <Card 
        onClick={() => hasBusinessHours ? onSelect('recurring') : null}
        className={`cursor-pointer transition-all border-2 rounded-2xl overflow-hidden ${
          hasBusinessHours 
            ? 'hover:border-teal-400 hover:shadow-xl active:scale-[0.98]' 
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <CardContent className="p-0">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <CalendarRange className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Recurring Shifts</h3>
                  <Badge className="bg-white/20 text-white border-0 text-[9px] sm:text-[10px] mt-0.5">
                    Recommended
                  </Badge>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/80" />
            </div>
          </div>
          
          {/* Content */}
          <div className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2.5 sm:mb-3">
              Quickly add multiple shifts using your pharmacy's business hours
            </p>
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-teal-700 font-medium leading-tight">
                Uses your Pharmacy Business Hours!
              </span>
            </div>
            {!hasBusinessHours && (
              <p className="text-[10px] sm:text-xs text-amber-600 mt-2 font-medium">
                ⚠️ Set up business hours first
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Shifts Card */}
      <Card 
        onClick={() => onSelect('custom')}
        className="cursor-pointer transition-all border-2 rounded-2xl overflow-hidden hover:border-purple-400 hover:shadow-xl active:scale-[0.98]"
      >
        <CardContent className="p-0">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <CalendarPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Custom Shifts</h3>
                  <span className="text-[10px] sm:text-xs text-white/80">Manual selection</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/80" />
            </div>
          </div>
          
          {/* Content */}
          <div className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2.5 sm:mb-3">
              Manually select specific dates and times for each shift
            </p>
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-purple-700 font-medium leading-tight">
                Pick custom dates & hours
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-step 2A: Recurring Configuration
function RecurringConfigStep({ businessHours, onAddShifts, onBack }) {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [numWeeks, setNumWeeks] = useState(1);
  const [selectedDays, setSelectedDays] = useState(() => 
    businessHours.filter(h => h.is_open).map(h => h.day)
  );

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const dayLabels = {
    monday: { short: 'Mon', full: 'Monday' },
    tuesday: { short: 'Tue', full: 'Tuesday' },
    wednesday: { short: 'Wed', full: 'Wednesday' },
    thursday: { short: 'Thu', full: 'Thursday' },
    friday: { short: 'Fri', full: 'Friday' },
    saturday: { short: 'Sat', full: 'Saturday' },
    sunday: { short: 'Sun', full: 'Sunday' }
  };

  const estimatedShifts = Math.min(selectedDays.length * numWeeks, 10);

  const handleAdd = () => {
    onAddShifts(startDate, numWeeks, selectedDays);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Recurring Shifts</h2>
          <p className="text-sm text-gray-500">Configure your recurring schedule</p>
        </div>
      </div>

      {/* Step 1: Start Date & Weeks */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <h3 className="font-semibold text-gray-900">Select Duration</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-2 block">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="h-12 text-base border-gray-200"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-2 block">Number of Weeks</Label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setNumWeeks(w)}
                    className={`h-12 rounded-xl text-sm font-bold transition-all ${
                      numWeeks === w 
                        ? 'bg-teal-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Select Days */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <h3 className="font-semibold text-gray-900">Select Working Days</h3>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => {
              const dayInfo = businessHours.find(h => h.day === day);
              const isOpen = dayInfo?.is_open !== false;
              const isSelected = selectedDays.includes(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => isOpen && toggleDay(day)}
                  disabled={!isOpen}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                    !isOpen 
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                      : isSelected 
                        ? 'bg-teal-600 text-white shadow-md' 
                        : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:border-teal-400'
                  }`}
                >
                  <span className="text-xs font-bold">{dayLabels[day].short}</span>
                  {isOpen && dayInfo && (
                    <span className="text-[9px] mt-1 opacity-70">
                      {dayInfo.open_time?.slice(0,5)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDays.length === 0 && (
            <p className="text-xs text-amber-600 mt-3 text-center">Please select at least one day</p>
          )}
        </CardContent>
      </Card>

      {/* Summary & Add Button */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-4 border-2 border-teal-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Shifts to Add</p>
              <p className="text-2xl font-bold text-teal-700">{estimatedShifts}</p>
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={selectedDays.length === 0}
            className="h-12 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Shifts
          </Button>
        </div>
        <p className="text-xs text-teal-700">
          {numWeeks} week{numWeeks > 1 ? 's' : ''} × {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} = {estimatedShifts} shift{estimatedShifts > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// Sub-step 2B: Custom Shifts Empty State
function CustomShiftsEmpty({ onAddShift }) {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <CalendarPlus className="w-10 h-10 text-purple-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">No Shifts Added Yet</h3>
      <p className="text-sm text-gray-500 mb-6">Click below to add your first custom shift</p>
      <Button
        onClick={onAddShift}
        className="h-12 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Your First Shift
      </Button>
    </div>
  );
}

// Shift Card Component
function ShiftCard({ dateEntry, index, onUpdate, onRemove, onDuplicate, canRemove, calculateRate }) {
  const rateInfo = calculateRate(dateEntry.date);
  const dynamicMinRate = rateInfo?.rate || 50;
  const currentRate = dateEntry.hourly_rate || dynamicMinRate;
  const isRateBelowMin = dateEntry.is_manual_rate && currentRate < dynamicMinRate;

  const formatTime12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    return `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Select Date";
    const [year, month, day] = dateString.split('-').map(Number);
    return format(new Date(year, month - 1, day), "EEE, MMM d, yyyy");
  };

  const getUrgencyStyle = (urgency) => {
    const styles = { 
      emergency: 'bg-red-500 text-white', 
      very_urgent: 'bg-orange-500 text-white', 
      urgent: 'bg-amber-500 text-white', 
      short_notice: 'bg-yellow-500 text-gray-900', 
      moderate: 'bg-blue-500 text-white', 
      reasonable: 'bg-teal-500 text-white', 
      planned: 'bg-green-500 text-white' 
    };
    return styles[urgency] || 'bg-gray-500 text-white';
  };

  const toggleManualRate = () => {
    const newIsManual = !dateEntry.is_manual_rate;
    onUpdate(index, 'is_manual_rate', newIsManual);
    if (!newIsManual) {
      onUpdate(index, 'hourly_rate', dynamicMinRate);
    }
  };

  const updateRate = (rate) => {
    const numRate = parseFloat(rate);
    if (!isNaN(numRate) && numRate >= dynamicMinRate) {
      onUpdate(index, 'hourly_rate', numRate);
    }
  };

  return (
    <Card className={`border-2 ${isRateBelowMin ? 'border-red-300 bg-red-50/50' : 'border-gray-200'} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>
          <span className="text-sm font-semibold text-gray-700">Shift {index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onDuplicate(index)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md" title="Duplicate">
            <Copy className="w-4 h-4" />
          </button>
          {canRemove && (
            <button type="button" onClick={() => onRemove(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" title="Remove">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Date & Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Date</Label>
            <Input
              type="date"
              value={dateEntry.date}
              onChange={(e) => onUpdate(index, "date", e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 90), "yyyy-MM-dd")}
              className="h-11 text-sm border-gray-200"
            />
            {dateEntry.date && (
              <p className="text-xs text-gray-500 mt-1">{formatDisplayDate(dateEntry.date)}</p>
            )}
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="time"
                value={dateEntry.start_time}
                onChange={(e) => onUpdate(index, "start_time", e.target.value)}
                className="h-11 text-sm border-gray-200"
              />
              <Input
                type="time"
                value={dateEntry.end_time}
                onChange={(e) => onUpdate(index, "end_time", e.target.value)}
                className="h-11 text-sm border-gray-200"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-center">
              {formatTime12Hour(dateEntry.start_time)} - {formatTime12Hour(dateEntry.end_time)}
            </p>
          </div>
        </div>

        {/* Rate Section */}
        {dateEntry.date && rateInfo && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">Set Custom Rate</Label>
              </div>
              <Switch checked={dateEntry.is_manual_rate} onCheckedChange={toggleManualRate} />
            </div>

            {dateEntry.is_manual_rate ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                <Input
                  type="number"
                  value={currentRate}
                  onChange={(e) => updateRate(e.target.value)}
                  min={dynamicMinRate}
                  step="1"
                  className={`h-12 pl-8 pr-16 text-xl font-bold ${isRateBelowMin ? 'border-red-300 bg-red-50' : 'border-teal-300'}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/hour</span>
                {isRateBelowMin && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />Min rate: ${dynamicMinRate}/hr
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                  <span className="text-lg font-bold text-teal-700">${dynamicMinRate}/hr</span>
                  <span className="text-xs text-teal-600">(Dynamic)</span>
                </div>
                <Badge className={`text-[10px] font-semibold ${getUrgencyStyle(rateInfo.urgency)}`}>
                  {rateInfo.urgency.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Component
export default function DatesTimesStep({ formData, updateFormData }) {
  // Determine initial subStep based on whether schedule already has valid entries
  const schedule = formData?.schedule || [];
  const hasValidShifts = schedule.length > 0 && schedule.some(s => s.date);
  
  const [subStep, setSubStep] = useState(hasValidShifts ? 'review' : 'choose');
  
  const pharmacy = formData?.pharmacy;
  const businessHours = pharmacy?.business_hours || [];
  const hasBusinessHours = businessHours.length === 7;

  const calculateRate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    const shiftDate = new Date(year, month - 1, day);
    shiftDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAhead = Math.ceil((shiftDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return RateCalculator.calculateRate(daysAhead);
  };

  const getDefaultTimesForDay = (dateString) => {
    if (!hasBusinessHours || !dateString) return { start_time: "09:00", end_time: "17:00" };
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayHours = businessHours.find(h => h.day === dayNames[date.getDay()]);
    if (dayHours && dayHours.is_open) {
      return { start_time: dayHours.open_time || "09:00", end_time: dayHours.close_time || "17:00" };
    }
    return { start_time: "09:00", end_time: "17:00" };
  };

  const updateSchedule = (newSchedule) => updateFormData('schedule', newSchedule);

  const handleMethodSelect = (method) => {
    if (method === 'recurring') {
      setSubStep('recurring');
    } else {
      // Clear schedule and go to custom
      updateSchedule([]);
      setSubStep('custom');
    }
  };

  const addRecurringShifts = (startDateString, numWeeks, selectedDays) => {
    if (!startDateString || selectedDays.length === 0) return;
    
    const newShifts = [];
    const [year, month, day] = startDateString.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let week = 0; week < numWeeks && newShifts.length < 10; week++) {
      for (let d = 0; d < 7 && newShifts.length < 10; d++) {
        const checkDate = new Date(start);
        checkDate.setDate(start.getDate() + (week * 7) + d);
        checkDate.setHours(0, 0, 0, 0);
        if (checkDate < today) continue;
        
        const dayName = dayNames[checkDate.getDay()];
        if (selectedDays.includes(dayName)) {
          const dateString = format(checkDate, "yyyy-MM-dd");
          const times = getDefaultTimesForDay(dateString);
          const dynamicRate = calculateRate(dateString)?.rate || 50;
          
          if (!newShifts.some(s => s.date === dateString)) {
            newShifts.push({
              date: dateString,
              start_time: times.start_time,
              end_time: times.end_time,
              hourly_rate: dynamicRate,
              is_manual_rate: false,
            });
          }
        }
      }
    }

    if (newShifts.length > 0) {
      updateSchedule(newShifts);
      setSubStep('review');
    }
  };

  const addCustomShift = () => {
    if (schedule.length >= 10) return;
    updateSchedule([
      ...schedule,
      { date: "", start_time: "09:00", end_time: "17:00", hourly_rate: 50, is_manual_rate: false }
    ]);
  };

  const updateShift = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    
    if (field === 'date' && value) {
      const times = getDefaultTimesForDay(value);
      updated[index].start_time = times.start_time;
      updated[index].end_time = times.end_time;
      const dynamicRate = calculateRate(value)?.rate || 50;
      if (!updated[index].is_manual_rate) {
        updated[index].hourly_rate = dynamicRate;
      }
    }
    updateSchedule(updated);
  };

  const removeShift = (index) => updateSchedule(schedule.filter((_, i) => i !== index));

  const duplicateShift = (index) => {
    if (schedule.length >= 10) return;
    updateSchedule([...schedule, { ...schedule[index], date: "", hourly_rate: 50, is_manual_rate: false }]);
  };

  // Render based on sub-step
  if (subStep === 'choose') {
    return <ChooseMethodStep onSelect={handleMethodSelect} hasBusinessHours={hasBusinessHours} />;
  }

  if (subStep === 'recurring') {
    return (
      <RecurringConfigStep 
        businessHours={businessHours}
        onAddShifts={addRecurringShifts}
        onBack={() => setSubStep('choose')}
      />
    );
  }

  if (subStep === 'custom') {
    // Custom mode - show empty state initially
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setSubStep('choose')} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Custom Shifts</h2>
            <p className="text-sm text-gray-500">Add shifts with custom dates and times</p>
          </div>
        </div>
        
        {schedule.length === 0 ? (
          <CustomShiftsEmpty onAddShift={() => {
            addCustomShift();
            setSubStep('review');
          }} />
        ) : (
          // Show shift cards if we have any
          <>
            <div className="space-y-3">
              {schedule.map((entry, index) => (
                <ShiftCard
                  key={index}
                  dateEntry={entry}
                  index={index}
                  onUpdate={updateShift}
                  onRemove={removeShift}
                  onDuplicate={duplicateShift}
                  canRemove={schedule.length > 1}
                  calculateRate={calculateRate}
                />
              ))}
            </div>
            {schedule.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addCustomShift}
                className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50 text-gray-600 hover:text-teal-600 font-medium rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Another Shift
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  // Review/Edit Shifts (both custom and recurring end here)
  const handleBackToChoose = () => {
    // Clear schedule when going back to choose method
    updateSchedule([]);
    setSubStep('choose');
  };

  // Count valid shifts (ones with dates filled in)
  const validShiftCount = schedule.filter(s => s.date).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button onClick={handleBackToChoose} className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Shifts</h2>
            <p className="text-sm text-gray-500">
              {validShiftCount > 0 
                ? `${validShiftCount} shift${validShiftCount !== 1 ? 's' : ''} ready` 
                : 'Fill in dates to continue'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {schedule.length}/10
        </Badge>
      </div>

      <div className="space-y-3">
        {schedule.map((entry, index) => (
          <ShiftCard
            key={index}
            dateEntry={entry}
            index={index}
            onUpdate={updateShift}
            onRemove={removeShift}
            onDuplicate={duplicateShift}
            canRemove={schedule.length > 1}
            calculateRate={calculateRate}
          />
        ))}
      </div>

      {schedule.length < 10 && (
        <Button
          type="button"
          variant="outline"
          onClick={addCustomShift}
          className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50 text-gray-600 hover:text-teal-600 font-medium rounded-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Another Shift
        </Button>
      )}

      {/* Pricing Legend */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-medium text-gray-600 mb-2.5">Dynamic Pricing (Minimum Rates)</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-red-500 text-white">$90 Same day</span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-orange-500 text-white">$65 1 day</span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-500 text-white">$60 2-4 days</span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-blue-500 text-white">$56 5-13 days</span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-green-500 text-white">$50 14+ days</span>
        </div>
      </div>
    </div>
  );
}