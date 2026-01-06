/**
 * Password Validator Service
 * Validates password strength and security requirements
 */

class PasswordValidator {
  /**
   * Validate password against security requirements
   * @param {string} password - Password to validate
   * @param {string} [email] - User email (to check for email in password)
   * @param {string} [username] - Username (to check for username in password)
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  static validate(password, email = '', username = '') {
    const errors = [];

    // Check if password is provided
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Check minimum length (12 characters)
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    // Check for common patterns
    if (this.isCommonPattern(password)) {
      errors.push('Password is too common, please choose a stronger password');
    }

    // Check if password contains email
    if (email && password.toLowerCase().includes(email.toLowerCase())) {
      errors.push('Password cannot contain your email address');
    }

    // Check if password contains username
    if (username && password.toLowerCase().includes(username.toLowerCase())) {
      errors.push('Password cannot contain your username');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if password matches common patterns
   * @param {string} password - Password to check
   * @returns {boolean} True if password matches common pattern
   */
  static isCommonPattern(password) {
    const commonPatterns = [
      /^password\d+/i,
      /^123456/,
      /^qwerty/i,
      /^abc123/i,
      /^letmein/i,
      /^welcome/i,
      /^admin/i,
      /^pass\d+/i,
      /^test\d+/i,
      /^user\d+/i,
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Calculate password strength score (0-100)
   * @param {string} password - Password to score
   * @returns {number} Strength score 0-100
   */
  static getStrengthScore(password) {
    let score = 0;

    if (!password) return 0;

    // Length scoring (max 30 points)
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // Character variety scoring (max 70 points)
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 25;

    // Bonus for mixing character types
    const charTypes = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ].filter(Boolean).length;

    if (charTypes === 4) score += 10;

    return Math.min(score, 100);
  }
}

module.exports = PasswordValidator;
