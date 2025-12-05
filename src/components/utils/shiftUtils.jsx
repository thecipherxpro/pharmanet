/**
 * Centralized shift utility functions
 * Single source of truth for shift status logic
 * 
 * UNIFIED: All shifts now use schedule array
 */

import { parseLocalDate } from './timeUtils';

/**
 * Validate and normalize time string to HH:mm format
 * Returns default time if invalid
 */
function validateTimeFormat(timeStr, defaultTime) {
  if (!timeStr || typeof timeStr !== 'string') return defaultTime;
  
  const trimmed = timeStr.trim();
  
  // Check for valid HH:mm format (00:00 to 23:59)
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(trimmed)) {
    // Normalize to always have 2-digit hour (e.g., "9:00" -> "09:00")
    const [hours, minutes] = trimmed.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  return defaultTime;
}

/**
 * Get schedule from shift (handles legacy shift_dates fallback)
 * SAFE: Filters out invalid entries, validates date AND time formats
 */
export function getScheduleFromShift(shift) {
  if (!shift) return [];
  
  let rawSchedule = [];
  
  // Use new schedule field
  if (shift.schedule && Array.isArray(shift.schedule) && shift.schedule.length > 0) {
    rawSchedule = shift.schedule;
  }
  // Fallback to legacy shift_dates
  else if (shift.shift_dates && Array.isArray(shift.shift_dates) && shift.shift_dates.length > 0) {
    rawSchedule = shift.shift_dates;
  }
  
  // If no schedule data, return empty (components should handle gracefully)
  if (rawSchedule.length === 0) return [];
  
  // Filter, validate, and normalize entries
  return rawSchedule
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      date: (typeof item.date === 'string' && item.date.trim()) || '',
      start_time: validateTimeFormat(item.start_time, '09:00'),
      end_time: validateTimeFormat(item.end_time, '17:00')
    }))
    .filter(item => {
      // Allow empty dates (components show "Date not set")
      if (!item.date) return true;
      // Validate YYYY-MM-DD format
      return /^\d{4}-\d{2}-\d{2}$/.test(item.date);
    });
}

/**
 * Get the primary date info from a shift
 */
function getPrimaryDateInfo(shift) {
  const schedule = getScheduleFromShift(shift);
  if (schedule.length > 0) {
    return schedule[0];
  }
  return {
    date: '',
    start_time: '09:00',
    end_time: '17:00'
  };
}

/**
 * Check if a shift has expired (past its end time)
 * Uses the LAST date for multi-date shifts
 */
export function isShiftExpired(shift) {
  const now = new Date();
  const schedule = getScheduleFromShift(shift);
  
  if (schedule.length === 0) {
    return true; // No dates = expired
  }
  
  // Get the last date (for multi-date, shift is expired only when all dates have passed)
  const lastDate = schedule[schedule.length - 1];
  if (!lastDate.date) return true;
  
  const shiftDate = parseLocalDate(lastDate.date);
  const [endHours, endMinutes] = (lastDate.end_time || '17:00').split(':').map(Number);
  const shiftEndDateTime = new Date(shiftDate);
  shiftEndDateTime.setHours(endHours, endMinutes, 0, 0);
  
  return shiftEndDateTime < now;
}

/**
 * Check if a shift is upcoming (in the future)
 */
export function isShiftUpcoming(shift) {
  const now = new Date();
  const primaryDate = getPrimaryDateInfo(shift);
  
  if (!primaryDate.date) return false;
  
  const shiftDate = parseLocalDate(primaryDate.date);
  const [startHours, startMinutes] = (primaryDate.start_time || '09:00').split(':').map(Number);
  const shiftStartDateTime = new Date(shiftDate);
  shiftStartDateTime.setHours(startHours, startMinutes, 0, 0);
  
  return shiftStartDateTime > now;
}

/**
 * Check if a shift is happening today
 */
export function isShiftToday(shift) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const primaryDate = getPrimaryDateInfo(shift);
  if (!primaryDate.date) return false;
  
  const shiftDate = parseLocalDate(primaryDate.date);
  shiftDate.setHours(0, 0, 0, 0);
  
  return shiftDate.getTime() === today.getTime();
}

/**
 * Get the real-time status of a shift
 * This determines what status a shift SHOULD have based on time
 */
export function getRealTimeStatus(shift) {
  const expired = isShiftExpired(shift);
  
  // If shift is marked as completed or cancelled, respect that
  if (shift.status === 'completed' || shift.status === 'cancelled') {
    return shift.status;
  }
  
  // If open and expired, should be closed
  if (shift.status === 'open' && expired) {
    return 'closed';
  }
  
  // If filled and expired, should be completed
  if (shift.status === 'filled' && expired) {
    return 'completed';
  }
  
  // Otherwise, use the stored status
  return shift.status;
}

/**
 * Get urgency level based on days until shift
 */
export function getShiftUrgency(shift) {
  const primaryDate = getPrimaryDateInfo(shift);
  if (!primaryDate.date) return 'expired';
  
  const shiftDate = parseLocalDate(primaryDate.date);
  const now = new Date();
  const daysUntil = Math.ceil((shiftDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) return 'expired';
  if (daysUntil === 0) return 'today';
  if (daysUntil <= 1) return 'emergency';
  if (daysUntil <= 2) return 'very_urgent';
  if (daysUntil <= 3) return 'urgent';
  if (daysUntil <= 5) return 'short_notice';
  if (daysUntil <= 7) return 'moderate';
  if (daysUntil <= 14) return 'reasonable';
  return 'planned';
}

/**
 * Check if shift can be edited
 */
export function canEditShift(shift) {
  // Can't edit completed or cancelled shifts
  if (shift.status === 'completed' || shift.status === 'cancelled') {
    return false;
  }
  
  // Can't edit expired shifts
  if (isShiftExpired(shift)) {
    return false;
  }
  
  // Can edit open or filled shifts that haven't started
  return true;
}

/**
 * Check if shift can be cancelled
 */
export function canCancelShift(shift) {
  // Can't cancel already completed or cancelled shifts
  if (shift.status === 'completed' || shift.status === 'cancelled') {
    return false;
  }
  
  // Can't cancel expired shifts
  if (isShiftExpired(shift)) {
    return false;
  }
  
  return true;
}

/**
 * Get display-friendly status text
 */
export function getStatusDisplay(status) {
  const statusMap = {
    'open': 'Open',
    'filled': 'Filled',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'closed': 'Closed'
  };
  
  return statusMap[status] || status;
}

/**
 * Get status color classes
 */
export function getStatusColorClass(status) {
  const colorMap = {
    'open': 'bg-blue-50 text-blue-700 border-blue-200',
    'filled': 'bg-green-50 text-green-700 border-green-200',
    'completed': 'bg-teal-50 text-teal-700 border-teal-200',
    'cancelled': 'bg-red-50 text-red-700 border-red-200',
    'closed': 'bg-orange-50 text-orange-700 border-orange-200'
  };
  
  return colorMap[status] || 'bg-gray-50 text-gray-700 border-gray-200';
}

/**
 * Filter shifts by status category
 */
export function filterShiftsByStatus(shifts, statusCategory) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (statusCategory) {
    case 'open':
      return shifts.filter((shift) => {
        if (shift.status !== 'open') return false;
        const schedule = getScheduleFromShift(shift);
        const primaryDate = schedule[0];
        if (!primaryDate?.date) return false;
        const shiftDate = parseLocalDate(primaryDate.date);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate >= today && !isShiftExpired(shift);
      });
      
    case 'filled':
      return shifts.filter((shift) => {
        if (shift.status !== 'filled') return false;
        return !isShiftExpired(shift);
      });
      
    case 'completed':
      return shifts.filter((shift) => {
        if (shift.status === 'completed') return true;
        if (shift.status === 'filled' && isShiftExpired(shift)) return true;
        return false;
      });
      
    case 'closed':
      return shifts.filter((shift) => shift.status === 'closed');
      
    case 'cancelled':
      return shifts.filter((shift) => shift.status === 'cancelled');
      
    default:
      return shifts;
  }
}