/**
 * Validation Utilities
 * Centralized validation functions for consistent form validation across the app
 */

/**
 * Validates and formats phone numbers
 * Accepts: (416) 555-0123, 416-555-0123, 4165550123
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, formatted: string, error: string }
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, formatted: '', error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if we have exactly 10 digits
  if (digits.length !== 10) {
    return { 
      isValid: false, 
      formatted: '', 
      error: 'Phone number must be 10 digits' 
    };
  }

  // Format as (XXX) XXX-XXXX
  const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;

  return { isValid: true, formatted, error: '' };
};

/**
 * Validates email address
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validates Canadian postal code
 * @param {string} postalCode - Postal code to validate
 * @returns {object} - { isValid: boolean, formatted: string, error: string }
 */
export const validatePostalCode = (postalCode) => {
  if (!postalCode) {
    return { isValid: false, formatted: '', error: 'Postal code is required' };
  }

  // Remove spaces and convert to uppercase
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase();

  // Canadian postal code format: A1A 1A1
  const postalRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
  
  if (!postalRegex.test(cleaned)) {
    return { 
      isValid: false, 
      formatted: '', 
      error: 'Invalid postal code format (e.g., M5V 3A8)' 
    };
  }

  // Format with space: A1A 1A1
  const formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;

  return { isValid: true, formatted, error: '' };
};

/**
 * Validates URL
 * @param {string} url - URL to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateUrl = (url) => {
  if (!url) {
    return { isValid: true, error: '' }; // URL is optional in most cases
  }

  try {
    new URL(url);
    return { isValid: true, error: '' };
  } catch {
    return { isValid: false, error: 'Invalid URL format (must include https://)' };
  }
};