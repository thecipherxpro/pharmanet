/**
 * SAFE DATE/TIME FORMATTER - NEVER THROWS ERRORS
 * Accepts ANY input and returns a safe formatted string or "N/A"
 * 
 * @param {any} value - Any date/time value (null, undefined, string, number, Date, etc.)
 * @param {object} options - Optional formatting options
 * @param {string} options.fallback - Custom fallback text (default: "N/A")
 * @param {boolean} options.dateOnly - Show only date, no time (default: false)
 * @param {boolean} options.timeOnly - Show only time, no date (default: false)
 * @returns {string} Formatted date/time string or fallback value
 */
export function safeDateTime(value, options = {}) {
  const { fallback = "N/A", dateOnly = false, timeOnly = false } = options;
  
  try {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    
    // Handle already being a Date object
    let d;
    if (value instanceof Date) {
      d = value;
    } else if (typeof value === 'number') {
      // Timestamp
      d = new Date(value);
    } else if (typeof value === 'string') {
      // Try to parse string - handle YYYY-MM-DD as local date
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // Date only string - parse as local date to avoid timezone shift
        const [year, month, day] = value.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(value);
      }
    } else {
      return fallback;
    }
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return fallback;
    }
    
    // Format based on options
    if (dateOnly) {
      return d.toLocaleDateString("en-CA", { dateStyle: "medium" });
    }
    
    if (timeOnly) {
      return d.toLocaleTimeString("en-CA", { timeStyle: "short" });
    }
    
    return d.toLocaleString("en-CA", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch (error) {
    // Catch any unexpected errors and return fallback
    return fallback;
  }
}

/**
 * Safe date formatter - date only version
 * @param {any} value - Any date value
 * @param {string} fallback - Fallback text (default: "N/A")
 * @returns {string} Formatted date or fallback
 */
export function safeDate(value, fallback = "N/A") {
  return safeDateTime(value, { fallback, dateOnly: true });
}

/**
 * Safe time formatter - time only version
 * @param {any} value - Any time value
 * @param {string} fallback - Fallback text (default: "N/A")
 * @returns {string} Formatted time or fallback
 */
export function safeTime(value, fallback = "N/A") {
  return safeDateTime(value, { fallback, timeOnly: true });
}

/**
 * Convert 24-hour time format to 12-hour AM/PM format
 * @param {string} time24 - Time in 24-hour format (e.g., "09:00", "17:30")
 * @returns {string} Time in 12-hour format (e.g., "9:00 AM", "5:30 PM")
 */
export function formatTime12Hour(time24) {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date to avoid timezone issues.
 * This is critical for shift dates - using new Date("2025-11-29") creates a UTC date
 * which can shift back 1 day when displayed in local timezone (e.g., EST/EDT).
 * 
 * SAFE: Always returns a valid Date object, never throws
 * 
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date} Date object set to local midnight (defaults to today if invalid)
 */
export function parseLocalDate(dateString) {
  try {
    // Handle null, undefined, empty string
    if (!dateString || dateString === '') {
      return new Date(); // Return today as fallback
    }
    
    // Handle if already a Date object
    if (dateString instanceof Date) {
      if (isNaN(dateString.getTime())) return new Date();
      return dateString;
    }
    
    // Must be a string
    if (typeof dateString !== 'string') return new Date();
    
    // Trim whitespace
    const trimmed = dateString.trim();
    if (!trimmed) return new Date();

    // Parse YYYY-MM-DD format as local date
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return new Date();

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    
    // Validate parts are reasonable
    if (year < 1900 || year > 2100) return new Date();
    if (month < 1 || month > 12) return new Date();
    if (day < 1 || day > 31) return new Date();

    const date = new Date(year, month - 1, day);
    
    // Final validation
    if (isNaN(date.getTime())) return new Date();
    
    return date;
  } catch (error) {
    // Never throw - always return a valid date
    return new Date();
  }
}

/**
 * Safe wrapper for date-fns format() - never throws
 * @param {any} date - Date value to format
 * @param {string} formatStr - date-fns format string
 * @param {string} fallback - Fallback string if date is invalid
 * @returns {string} Formatted date string or fallback
 */
export function safeFormat(date, formatStr, fallback = 'Date not set') {
  try {
    const { format } = require('date-fns');
    const parsed = parseLocalDate(date);
    
    // Extra validation before format
    if (!parsed || isNaN(parsed.getTime())) {
      return fallback;
    }
    
    return format(parsed, formatStr);
  } catch (error) {
    return fallback;
  }
}

/**
 * Convert 12-hour AM/PM format to 24-hour format
 * @param {string} time12 - Time in 12-hour format (e.g., "9:00 AM", "5:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "09:00", "17:30")
 */
export function formatTime24Hour(time12) {
  if (!time12) return '';
  
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time12;
  
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}