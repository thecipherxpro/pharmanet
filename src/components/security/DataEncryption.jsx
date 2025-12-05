/**
 * Data encryption utility for sensitive information
 * NOTE: This is client-side obfuscation only
 * Real encryption should be done server-side
 */
class DataEncryption {
  /**
   * Mask sensitive data for display
   */
  static maskString(str, visibleChars = 4) {
    if (!str) return "";
    if (str.length <= visibleChars) return str;
    return "•".repeat(str.length - visibleChars) + str.slice(-visibleChars);
  }

  static maskEmail(email) {
    if (!email) return "";
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return local[0] + "•••" + local.slice(-1) + '@' + domain;
  }

  static maskPhone(phone) {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return "•".repeat(cleaned.length - 4) + cleaned.slice(-4);
  }

  static maskBankAccount(account) {
    return this.maskString(account, 4);
  }

  /**
   * Validate sensitive data before submission
   */
  static validateBankingInfo(data) {
    const errors = [];

    if (data.method === 'Direct Deposit') {
      if (!data.institution_number || data.institution_number.length !== 3) {
        errors.push('Institution number must be 3 digits');
      }
      if (!data.transit_number || data.transit_number.length !== 5) {
        errors.push('Transit number must be 5 digits');
      }
      if (!data.account_number || data.account_number.length < 7) {
        errors.push('Account number must be at least 7 digits');
      }
    }

    if (data.method === 'Bank E-Transfer') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.etransfer_email || !emailRegex.test(data.etransfer_email)) {
        errors.push('Valid email required for e-transfer');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

export default DataEncryption;