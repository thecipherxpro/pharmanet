/**
 * Shift Date Utility Functions
 * 
 * UNIFIED APPROACH: All shifts now use shift_dates array.
 * These utilities provide consistent access to shift date data.
 */

import { parseLocalDate as parseDate } from './timeUtils';

/**
 * Get all dates from a shift (always returns an array)
 * @param {Object} shift - The shift object
 * @returns {Array} Array of date objects with date, start_time, end_time, etc.
 */
export function getShiftDates(shift) {
  if (!shift) return [];
  
  // Always use shift_dates array
  if (shift.shift_dates && Array.isArray(shift.shift_dates) && shift.shift_dates.length > 0) {
    return shift.shift_dates;
  }
  
  // Fallback for legacy data that might still have shift_date field
  // This ensures backward compatibility during migration
  if (shift.shift_date) {
    return [{
      date: shift.shift_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      status: shift.status,
      assigned_to: shift.assigned_to,
      hourly_rate: shift.hourly_rate,
      urgency_level: shift.urgency_level,
      total_hours: shift.total_hours,
      total_pay: shift.total_pay,
      days_ahead: shift.days_ahead
    }];
  }
  
  return [];
}

/**
 * Get the primary (first) date from a shift
 * @param {Object} shift - The shift object
 * @returns {Object|null} The first date object or null
 */
export function getPrimaryDate(shift) {
  const dates = getShiftDates(shift);
  return dates.length > 0 ? dates[0] : null;
}

/**
 * Get the primary date string from a shift
 * @param {Object} shift - The shift object
 * @returns {string} The primary date string in YYYY-MM-DD format
 */
export function getPrimaryDateString(shift) {
  const primaryDate = getPrimaryDate(shift);
  return primaryDate?.date || '';
}

/**
 * Check if a shift has multiple dates
 * @param {Object} shift - The shift object
 * @returns {boolean} True if shift has more than one date
 */
export function isMultiDateShift(shift) {
  const dates = getShiftDates(shift);
  return dates.length > 1;
}

/**
 * Get the number of dates in a shift
 * @param {Object} shift - The shift object
 * @returns {number} Number of dates
 */
export function getDateCount(shift) {
  return getShiftDates(shift).length;
}

/**
 * Check if a shift date is in the future
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} True if date/time is in the future
 */
export function isDateInFuture(dateString, endTime = "17:00") {
  if (!dateString) return false;
  
  const now = new Date();
  const shiftDate = parseDate(dateString);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const shiftEndDateTime = new Date(shiftDate);
  shiftEndDateTime.setHours(endHours, endMinutes, 0, 0);
  
  return shiftEndDateTime >= now;
}

/**
 * Filter shift dates to only include future dates
 * @param {Object} shift - The shift object
 * @returns {Array} Array of future date objects
 */
export function getFutureDates(shift) {
  const dates = getShiftDates(shift);
  return dates.filter(d => isDateInFuture(d.date, d.end_time));
}

/**
 * Check if any date in the shift is still in the future
 * @param {Object} shift - The shift object
 * @returns {boolean} True if at least one date is in the future
 */
export function hasAnyFutureDate(shift) {
  return getFutureDates(shift).length > 0;
}

/**
 * Get open dates from a shift
 * @param {Object} shift - The shift object
 * @returns {Array} Array of date objects with status 'open'
 */
export function getOpenDates(shift) {
  const dates = getShiftDates(shift);
  return dates.filter(d => d.status === 'open');
}

/**
 * Calculate total pay across all dates
 * @param {Object} shift - The shift object
 * @returns {number} Total pay
 */
export function calculateTotalPay(shift) {
  const dates = getShiftDates(shift);
  return dates.reduce((sum, d) => sum + (d.total_pay || 0), 0);
}

/**
 * Calculate total hours across all dates
 * @param {Object} shift - The shift object
 * @returns {number} Total hours
 */
export function calculateTotalHours(shift) {
  const dates = getShiftDates(shift);
  return dates.reduce((sum, d) => sum + (d.total_hours || 0), 0);
}

/**
 * Sort dates by date field
 * @param {Array} dates - Array of date objects
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export function sortDates(dates, direction = 'asc') {
  return [...dates].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return direction === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

// Re-export parseLocalDate for convenience
export { parseDate as parseLocalDate };