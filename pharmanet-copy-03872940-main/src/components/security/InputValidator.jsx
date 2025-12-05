/**
 * Input validation and sanitization utility
 * Prevents XSS, SQL injection, and other security issues
 */
class InputValidator {
  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validate phone number (Canadian format)
   */
  static isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  }

  /**
   * Validate postal code (Canadian format)
   */
  static isValidPostalCode(postalCode) {
    const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    return regex.test(postalCode);
  }

  /**
   * Validate Ontario pharmacist license number
   */
  static isValidLicenseNumber(license) {
    // OCP format: typically numbers
    const cleaned = license.replace(/\D/g, '');
    return cleaned.length >= 4 && cleaned.length <= 10;
  }

  /**
   * Sanitize text input to prevent XSS
   */
  static sanitizeText(text) {
    if (typeof text !== 'string') return text;
    
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Validate password strength
   */
  static isStrongPassword(password) {
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain number' };
    return { valid: true, message: 'Strong password' };
  }

  /**
   * Validate banking information
   */
  static validateBankingInfo(data) {
    const errors = [];

    if (data.institution_number) {
      const cleaned = data.institution_number.replace(/\D/g, '');
      if (cleaned.length !== 3) {
        errors.push('Institution number must be 3 digits');
      }
    }

    if (data.transit_number) {
      const cleaned = data.transit_number.replace(/\D/g, '');
      if (cleaned.length !== 5) {
        errors.push('Transit number must be 5 digits');
      }
    }

    if (data.account_number) {
      const cleaned = data.account_number.replace(/\D/g, '');
      if (cleaned.length < 7 || cleaned.length > 12) {
        errors.push('Account number must be 7-12 digits');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect potential SQL injection attempts
   */
  static hasSQLInjectionAttempt(text) {
    if (typeof text !== 'string') return false;
    
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
      'ALTER', 'EXEC', 'EXECUTE', 'UNION', 'SCRIPT'
    ];
    
    const upperText = text.toUpperCase();
    return sqlKeywords.some(keyword => upperText.includes(keyword));
  }

  /**
   * Rate limiting check (client-side)
   */
  static checkRateLimit(key, maxAttempts = 5, timeWindow = 60000) {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
    
    // Remove old attempts
    const recentAttempts = attempts.filter(time => now - time < timeWindow);
    
    if (recentAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        message: `Too many attempts. Please wait ${Math.ceil((recentAttempts[0] + timeWindow - now) / 1000)} seconds.`
      };
    }
    
    // Add current attempt
    recentAttempts.push(now);
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
    
    return { allowed: true };
  }
}

export default InputValidator;