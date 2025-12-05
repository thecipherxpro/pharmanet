import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isPast, addMonths, subMonths, isToday, addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CalendarView({ 
  currentMonth, 
  onMonthChange, 
  availability = [], 
  acceptedShifts = [],
  pendingApplications = [],
  cancelledShifts = [],
  onDayClick,
  maxDaysAhead = 30
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const today = new Date();
  const maxDate = addDays(today, maxDaysAhead);

  // Helper to get primary date string from shift
  const getShiftDateStr = (shift) => {
    if (shift?.shift_dates?.[0]?.date) {
      return shift.shift_dates[0].date;
    }
    return null;
  };

  const getDayStatus = (day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const hasAvailability = availability.some(a => a.date === dayStr);
    const hasShift = acceptedShifts.some(s => getShiftDateStr(s) === dayStr);
    const hasPending = pendingApplications.some(a => {
      const shift = a.shift;
      return shift && getShiftDateStr(shift) === dayStr;
    });
    const isCancelled = cancelledShifts.some(c => c.shift_date === dayStr || getShiftDateStr(c) === dayStr);

    if (isCancelled) return { status: 'cancelled', color: 'bg-red-100 border-red-300 text-red-700' };
    if (hasShift) return { status: 'shift', color: 'bg-blue-500 text-white border-blue-600' };
    if (hasPending) return { status: 'pending', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' };
    if (hasAvailability) return { status: 'available', color: 'bg-emerald-500 text-white border-emerald-600' };
    return { status: 'empty', color: 'bg-white hover:bg-gray-50' };
  };

  const isDayDisabled = (day) => {
    return isPast(day) && !isToday(day) || day > maxDate;
  };

  const isDayInMonth = (day) => isSameMonth(day, currentMonth);

  return (
    <Card className="p-3 sm:p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayStatus = getDayStatus(day);
          const disabled = isDayDisabled(day);
          const inMonth = isDayInMonth(day);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toString()}
              onClick={() => !disabled && onDayClick(day)}
              disabled={disabled}
              className={`
                aspect-square rounded-lg border-2 text-xs sm:text-sm font-medium
                transition-all relative
                ${dayStatus.color}
                ${!inMonth ? 'opacity-30' : ''}
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${isCurrentDay ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}
                ${!disabled && inMonth ? 'hover:scale-105 hover:shadow-md' : ''}
              `}
            >
              <span className="block">{format(day, 'd')}</span>
              {dayStatus.status !== 'empty' && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                  dayStatus.status === 'shift' ? 'bg-white' :
                  dayStatus.status === 'available' ? 'bg-white' :
                  'bg-current'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500 border-2 border-emerald-600" />
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600" />
            <span className="text-gray-700">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300" />
            <span className="text-gray-700">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
            <span className="text-gray-700">Cancelled</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          📅 You can set availability up to {maxDaysAhead} days ahead
        </p>
      </div>
    </Card>
  );
}