import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Convert 24-hour time to 12-hour format with AM/PM
export function convertTo12Hour(time24) {
  if (!time24) return { hour: "09", minute: "00", period: "AM" };
  
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  
  return {
    hour: hour12.toString().padStart(2, '0'),
    minute: minutes,
    period: period
  };
}

// Convert 12-hour time with AM/PM to 24-hour format
export function convertTo24Hour(hour, minute, period) {
  let h = parseInt(hour);
  
  if (period === "AM" && h === 12) {
    h = 0;
  } else if (period === "PM" && h !== 12) {
    h += 12;
  }
  
  return `${h.toString().padStart(2, '0')}:${minute}`;
}

export default function TimePicker({ value, onChange, className = "" }) {
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");

  useEffect(() => {
    if (value) {
      const time12 = convertTo12Hour(value);
      setHour(time12.hour);
      setMinute(time12.minute);
      setPeriod(time12.period);
    }
  }, [value]);

  const handleChange = (newHour, newMinute, newPeriod) => {
    const h = newHour || hour;
    const m = newMinute || minute;
    const p = newPeriod || period;
    
    const time24 = convertTo24Hour(h, m, p);
    onChange(time24);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 ${className}`}>
      {/* Hour Selector */}
      <Select value={hour} onValueChange={(val) => {
        setHour(val);
        handleChange(val, minute, period);
      }}>
        <SelectTrigger className="w-[52px] sm:w-16 h-10 sm:h-11 text-sm">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-gray-500 font-semibold text-sm">:</span>

      {/* Minute Selector */}
      <Select value={minute} onValueChange={(val) => {
        setMinute(val);
        handleChange(hour, val, period);
      }}>
        <SelectTrigger className="w-[52px] sm:w-16 h-10 sm:h-11 text-sm">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM/PM Selector */}
      <Select value={period} onValueChange={(val) => {
        setPeriod(val);
        handleChange(hour, minute, val);
      }}>
        <SelectTrigger className="w-[52px] sm:w-16 h-10 sm:h-11 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}