import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, Copy } from "lucide-react";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    TIME_OPTIONS.push(time);
  }
}

const DEFAULT_HOURS = DAYS.map((d) => ({
  day: d.key,
  is_open: d.key !== "sunday",
  open_time: "09:00",
  close_time: "18:00",
}));

function formatTime12Hour(time24) {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function BusinessHoursEditor({ value, onChange, compact = false }) {
  const [hours, setHours] = useState(() => {
    if (value && Array.isArray(value) && value.length === 7) {
      return value;
    }
    return DEFAULT_HOURS;
  });

  useEffect(() => {
    if (value && Array.isArray(value) && value.length === 7) {
      setHours(value);
    }
  }, [value]);

  const updateDay = (dayKey, updates) => {
    const newHours = hours.map((h) =>
      h.day === dayKey ? { ...h, ...updates } : h
    );
    setHours(newHours);
    onChange?.(newHours);
  };

  const copyToAllWeekdays = (sourceDayKey) => {
    const source = hours.find((h) => h.day === sourceDayKey);
    if (!source) return;

    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    const newHours = hours.map((h) =>
      weekdays.includes(h.day)
        ? { ...h, is_open: source.is_open, open_time: source.open_time, close_time: source.close_time }
        : h
    );
    setHours(newHours);
    onChange?.(newHours);
  };

  const setStandardHours = () => {
    const standardHours = DAYS.map((d) => ({
      day: d.key,
      is_open: d.key !== "sunday",
      open_time: "09:00",
      close_time: "18:00",
    }));
    setHours(standardHours);
    onChange?.(standardHours);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {hours.map((dayHours) => {
          const dayInfo = DAYS.find((d) => d.key === dayHours.day);
          return (
            <div
              key={dayHours.day}
              className={`flex items-center justify-between py-2 px-3 rounded-lg border ${
                dayHours.is_open ? "bg-white border-zinc-200" : "bg-zinc-50 border-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={dayHours.is_open}
                  onCheckedChange={(checked) => updateDay(dayHours.day, { is_open: checked })}
                />
                <span className={`text-sm font-medium ${dayHours.is_open ? "text-zinc-900" : "text-zinc-400"}`}>
                  {dayInfo?.label?.slice(0, 3)}
                </span>
              </div>
              {dayHours.is_open ? (
                <span className="text-xs text-zinc-600">
                  {formatTime12Hour(dayHours.open_time)} - {formatTime12Hour(dayHours.close_time)}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">Closed</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-700">Business Hours</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setStandardHours}
          className="text-xs h-7"
        >
          Set Standard (9-6, Mon-Sat)
        </Button>
      </div>

      <div className="space-y-2">
        {hours.map((dayHours, idx) => {
          const dayInfo = DAYS.find((d) => d.key === dayHours.day);
          return (
            <div
              key={dayHours.day}
              className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border transition-colors ${
                dayHours.is_open ? "bg-white border-zinc-200" : "bg-zinc-50 border-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3 min-w-[140px]">
                <Switch
                  checked={dayHours.is_open}
                  onCheckedChange={(checked) => updateDay(dayHours.day, { is_open: checked })}
                />
                <Label className={`text-sm font-medium ${dayHours.is_open ? "text-zinc-900" : "text-zinc-400"}`}>
                  {dayInfo?.label}
                </Label>
              </div>

              {dayHours.is_open && (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={dayHours.open_time}
                    onChange={(e) => updateDay(dayHours.day, { open_time: e.target.value })}
                    className="h-9 px-2 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {formatTime12Hour(t)}
                      </option>
                    ))}
                  </select>
                  <span className="text-zinc-400">to</span>
                  <select
                    value={dayHours.close_time}
                    onChange={(e) => updateDay(dayHours.day, { close_time: e.target.value })}
                    className="h-9 px-2 text-sm border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {formatTime12Hour(t)}
                      </option>
                    ))}
                  </select>

                  {idx === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToAllWeekdays(dayHours.day)}
                      className="text-xs h-8 ml-2 hidden sm:flex"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy to weekdays
                    </Button>
                  )}
                </div>
              )}

              {!dayHours.is_open && (
                <span className="text-sm text-zinc-400 italic">Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}