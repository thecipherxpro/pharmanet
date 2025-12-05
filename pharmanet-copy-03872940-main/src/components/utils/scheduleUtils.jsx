import { differenceInDays } from "date-fns";
import { parseLocalDate, safeDate, safeDateTime } from "./timeUtils";
import { RateCalculator } from "../shift/RateCalculator";

/**
 * Schedule Utilities for Shift Entity
 * Handles all schedule-related calculations and validations
 */

/**
 * Calculate total hours from a schedule array
 * @param {Array} schedule - Array of {date, start_time, end_time} objects
 * @returns {number} Total hours across all schedule items
 */
export function calculateTotalHours(schedule) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return 0;
  }

  return schedule.reduce((total, item) => {
    if (!item.start_time || !item.end_time) return total;
    
    const [startHours, startMinutes] = item.start_time.split(':').map(Number);
    const [endHours, endMinutes] = item.end_time.split(':').map(Number);
    
    if (isNaN(startHours) || isNaN(endHours)) return total;
    
    let hours = endHours - startHours + (endMinutes - startMinutes) / 60;
    
    // Handle overnight shifts
    if (hours < 0) {
      hours += 24;
    }
    
    return total + hours;
  }, 0);
}

/**
 * Get the earliest date from a schedule array
 * @param {Array} schedule - Array of {date, start_time, end_time} objects
 * @returns {string|null} Earliest date in YYYY-MM-DD format or null
 */
export function getEarliestDate(schedule) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return null;
  }

  const validDates = schedule
    .filter(item => item.date)
    .map(item => item.date)
    .sort();

  return validDates.length > 0 ? validDates[0] : null;
}

/**
 * Calculate days ahead from earliest schedule date to today
 * @param {Array} schedule - Array of {date, start_time, end_time} objects
 * @returns {number} Days ahead (can be negative if in the past)
 */
export function calculateDaysAhead(schedule) {
  const earliestDate = getEarliestDate(schedule);
  if (!earliestDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const shiftDate = parseLocalDate(earliestDate);
  
  return differenceInDays(shiftDate, today);
}

/**
 * Get pricing information based on schedule
 * @param {Array} schedule - Array of {date, start_time, end_time} objects
 * @returns {object} {hourly_rate, pricing_tier, days_ahead}
 */
export function calculatePricing(schedule) {
  const daysAhead = calculateDaysAhead(schedule);
  const rateInfo = RateCalculator.calculateRate(daysAhead);
  
  return {
    hourly_rate: rateInfo.rate,
    pricing_tier: rateInfo.urgency,
    days_ahead: daysAhead
  };
}

/**
 * Calculate total pay from schedule and hourly rate
 * @param {Array} schedule - Array of {date, start_time, end_time} objects
 * @param {number} hourlyRate - Hourly rate in dollars
 * @returns {number} Total pay
 */
export function calculateTotalPay(schedule, hourlyRate) {
  const totalHours = calculateTotalHours(schedule);
  return totalHours * (hourlyRate || 0);
}

/**
 * Validate a schedule item
 * @param {object} item - {date, start_time, end_time}
 * @returns {object} {valid: boolean, errors: string[]}
 */
export function validateScheduleItem(item) {
  const errors = [];
  
  if (!item) {
    return { valid: false, errors: ['Schedule item is required'] };
  }
  
  // Validate date
  if (!item.date) {
    errors.push('Date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  }
  
  // Validate start_time
  if (!item.start_time) {
    errors.push('Start time is required');
  } else if (!/^\d{2}:\d{2}$/.test(item.start_time)) {
    errors.push('Start time must be in HH:mm format');
  }
  
  // Validate end_time
  if (!item.end_time) {
    errors.push('End time is required');
  } else if (!/^\d{2}:\d{2}$/.test(item.end_time)) {
    errors.push('End time must be in HH:mm format');
  }
  
  // Validate end_time > start_time (unless overnight)
  if (item.start_time && item.end_time) {
    const [startH, startM] = item.start_time.split(':').map(Number);
    const [endH, endM] = item.end_time.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    
    // Only error if same time (overnight shifts allowed)
    if (startMins === endMins) {
      errors.push('End time must be different from start time');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate entire schedule array
 * @param {Array} schedule - Array of {date, start_time, end_time} objects
 * @returns {object} {valid: boolean, errors: string[]}
 */
export function validateSchedule(schedule) {
  if (!schedule || !Array.isArray(schedule)) {
    return { valid: false, errors: ['Schedule must be an array'] };
  }
  
  if (schedule.length === 0) {
    return { valid: false, errors: ['At least one schedule item is required'] };
  }
  
  const allErrors = [];
  
  schedule.forEach((item, index) => {
    const { valid, errors } = validateScheduleItem(item);
    if (!valid) {
      errors.forEach(err => {
        allErrors.push(`Item ${index + 1}: ${err}`);
      });
    }
  });
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Format schedule for display
 * @param {Array} schedule - Array of {date, start_time, end_time} objects
 * @returns {Array} Formatted strings for display
 */
export function formatScheduleForDisplay(schedule) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    return [];
  }
  
  return schedule
    .filter(item => item && item.date)
    .map(item => {
      const dateStr = safeDate(item.date, 'N/A');
      const timeStr = item.start_time && item.end_time 
        ? `${item.start_time} - ${item.end_time}`
        : 'Time not set';
      return `${dateStr} | ${timeStr}`;
    });
}

/**
 * Get schedule from shift (handles legacy shift_dates fallback)
 * @param {object} shift - Shift object
 * @returns {Array} Schedule array
 */
export function getScheduleFromShift(shift) {
  if (!shift) return [];
  
  // Use new schedule field
  if (shift.schedule && Array.isArray(shift.schedule) && shift.schedule.length > 0) {
    return shift.schedule;
  }
  
  // Fallback to legacy shift_dates (for migration period)
  if (shift.shift_dates && Array.isArray(shift.shift_dates) && shift.shift_dates.length > 0) {
    return shift.shift_dates.map(d => ({
      date: d.date || '',
      start_time: d.start_time || '09:00',
      end_time: d.end_time || '17:00'
    }));
  }
  
  return [];
}

/**
 * Build complete shift data with calculated fields
 * @param {Array} schedule - Array of {date, start_time, end_time} objects
 * @returns {object} Object with total_hours, total_pay, hourly_rate, pricing_tier, days_ahead
 */
export function buildShiftCalculations(schedule) {
  const pricing = calculatePricing(schedule);
  const totalHours = calculateTotalHours(schedule);
  const totalPay = calculateTotalPay(schedule, pricing.hourly_rate);
  
  return {
    ...pricing,
    total_hours: totalHours,
    total_pay: totalPay
  };
}