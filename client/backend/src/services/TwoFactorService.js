/**
 * Two-Factor Authentication Service
 * Manages TOTP, Email OTP, and SMS OTP generation and validation
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

class TwoFactorService {
  // ===== TOTP Methods =====

  /**
   * Generate TOTP secret and QR code
   * @param {string} email - User email for QR code label
   * @returns {Promise<Object>} { secret: string, qr_code: string }
   */
  static async generateTOTPSecret(email) {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `MeterIt Pro (${email})`,
        issuer: 'MeterIt Pro',
        length: 32
      });

      // Generate QR code
      const qr_code = await QRCode.toDataURL(secret.otpauth_url);

      return {
        secret: secret.base32,
        qr_code,
        otpauth_url: secret.otpauth_url
      };
    } catch (error) {
      console.error('[2FA SERVICE] Error generating TOTP secret:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP code
   * @param {string} secret - TOTP secret (base32)
   * @param {string} code - 6-digit code from authenticator app
   * @returns {boolean} True if code is valid
   */
  static verifyTOTPCode(secret, code) {
    try {
      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code,
        window: 2 // Allow 2 time windows (±30 seconds)
      });

      return isValid;
    } catch (error) {
      console.error('[2FA SERVICE] Error verifying TOTP code:', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   * @param {number} [count=10] - Number of backup codes to generate
   * @returns {Array<string>} Array of backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Store backup codes in database
   * @param {number} userId - User ID
   * @param {Array<string>} codes - Array of backup codes
   * @returns {Promise<void>}
   */
  static async storeBackupCodes(userId, codes) {
    try {
      // Delete existing backup codes for this user
      await db.query(
        'DELETE FROM user_2fa_backup_codes WHERE user_id = $1',
        [userId]
      );

      // Hash and store new codes
      for (const code of codes) {
        const salt = await bcrypt.genSalt(10);
        const code_hash = await bcrypt.hash(code, salt);

        await db.query(
          `INSERT INTO user_2fa_backup_codes (user_id, code_hash, is_used, created_at)
           VALUES ($1, $2, false, CURRENT_TIMESTAMP)`,
          [userId, code_hash]
        );
      }

      console.log('[2FA SERVICE] Backup codes stored for user:', userId);
    } catch (error) {
      console.error('[2FA SERVICE] Error storing backup codes:', error);
      throw error;
    }
  }

  /**
   * Verify and use a backup code
   * @param {number} userId - User ID
   * @param {string} code - Backup code to verify
   * @returns {Promise<boolean>} True if code is valid and unused
   */
  static async verifyBackupCode(userId, code) {
    try {
      // Find unused backup codes for this user
      const result = await db.query(
        `SELECT id, code_hash FROM user_2fa_backup_codes 
         WHERE user_id = $1 AND is_used = false`,
        [userId]
      );

      if (!result.rows || result.rows.length === 0) {
        console.log('[2FA SERVICE] No unused backup codes found for user:', userId);
        return false;
      }

      // Check each code
      for (const row of result.rows) {
        const isValid = await bcrypt.compare(code, row.code_hash);
        if (isValid) {
          // Mark code as used
          await db.query(
            `UPDATE user_2fa_backup_codes 
             SET is_used = true, used_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [row.id]
          );

          console.log('[2FA SERVICE] Backup code verified and used for user:', userId);
          return true;
        }
      }

      console.log('[2FA SERVICE] Backup code does not match for user:', userId);
      return false;
    } catch (error) {
      console.error('[2FA SERVICE] Error verifying backup code:', error);
      return false;
    }
  }

  // ===== Email OTP Methods =====

  /**
   * Generate email OTP code
   * @returns {string} 6-digit OTP code
   */
  static generateEmailOTP() {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  /**
   * Store email OTP in database (temporary)
   * @param {number} userId - User ID
   * @param {string} code - OTP code
   * @returns {Promise<void>}
   */
  static async storeEmailOTP(userId, code) {
    try {
      // Store in a temporary table or cache
      // For now, we'll use a simple approach with a temporary column
      // In production, consider using Redis for better performance
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store in auth_logs with details
      await db.query(
        `INSERT INTO auth_logs (user_id, event_type, status, details, created_at)
         VALUES ($1, 'email_otp_generated', 'success', $2, CURRENT_TIMESTAMP)`,
        [userId, JSON.stringify({ code, expires_at: expiresAt.toISOString() })]
      );

      console.log('[2FA SERVICE] Email OTP stored for user:', userId);
    } catch (error) {
      console.error('[2FA SERVICE] Error storing email OTP:', error);
      throw error;
    }
  }

  /**
   * Verify email OTP code
   * @param {number} userId - User ID
   * @param {string} code - OTP code to verify
   * @returns {Promise<boolean>} True if code is valid
   */
  static async verifyEmailOTP(userId, code) {
    try {
      // Find the most recent email OTP for this user
      const result = await db.query(
        `SELECT details FROM auth_logs 
         WHERE user_id = $1 
         AND event_type = 'email_otp_generated'
         AND status = 'success'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (!result.rows || result.rows.length === 0) {
        console.log('[2FA SERVICE] No email OTP found for user:', userId);
        return false;
      }

      const details = result.rows[0].details;
      const storedCode = details.code;
      const expiresAt = new Date(details.expires_at);

      // Check if code has expired
      if (new Date() > expiresAt) {
        console.log('[2FA SERVICE] Email OTP has expired for user:', userId);
        return false;
      }

      // Check if code matches
      if (code !== storedCode) {
        console.log('[2FA SERVICE] Email OTP does not match for user:', userId);
        return false;
      }

      console.log('[2FA SERVICE] Email OTP verified for user:', userId);
      return true;
    } catch (error) {
      console.error('[2FA SERVICE] Error verifying email OTP:', error);
      return false;
    }
  }

  // ===== SMS OTP Methods =====

  /**
   * Generate SMS OTP code
   * @returns {string} 6-digit OTP code
   */
  static generateSMSOTP() {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  /**
   * Store SMS OTP in database (temporary)
   * @param {number} userId - User ID
   * @param {string} code - OTP code
   * @returns {Promise<void>}
   */
  static async storeSMSOTP(userId, code) {
    try {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store in auth_logs with details
      await db.query(
        `INSERT INTO auth_logs (user_id, event_type, status, details, created_at)
         VALUES ($1, 'sms_otp_generated', 'success', $2, CURRENT_TIMESTAMP)`,
        [userId, JSON.stringify({ code, expires_at: expiresAt.toISOString() })]
      );

      console.log('[2FA SERVICE] SMS OTP stored for user:', userId);
    } catch (error) {
      console.error('[2FA SERVICE] Error storing SMS OTP:', error);
      throw error;
    }
  }

  /**
   * Verify SMS OTP code
   * @param {number} userId - User ID
   * @param {string} code - OTP code to verify
   * @returns {Promise<boolean>} True if code is valid
   */
  static async verifySMSOTP(userId, code) {
    try {
      // Find the most recent SMS OTP for this user
      const result = await db.query(
        `SELECT details FROM auth_logs 
         WHERE user_id = $1 
         AND event_type = 'sms_otp_generated'
         AND status = 'success'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (!result.rows || result.rows.length === 0) {
        console.log('[2FA SERVICE] No SMS OTP found for user:', userId);
        return false;
      }

      const details = result.rows[0].details;
      const storedCode = details.code;
      const expiresAt = new Date(details.expires_at);

      // Check if code has expired
      if (new Date() > expiresAt) {
        console.log('[2FA SERVICE] SMS OTP has expired for user:', userId);
        return false;
      }

      // Check if code matches
      if (code !== storedCode) {
        console.log('[2FA SERVICE] SMS OTP does not match for user:', userId);
        return false;
      }

      console.log('[2FA SERVICE] SMS OTP verified for user:', userId);
      return true;
    } catch (error) {
      console.error('[2FA SERVICE] Error verifying SMS OTP:', error);
      return false;
    }
  }

  // ===== 2FA Method Management =====

  /**
   * Store 2FA method in database
   * @param {number} userId - User ID
   * @param {string} methodType - 'totp', 'email_otp', or 'sms_otp'
   * @param {Object} [data] - Additional data (secret_key, phone_number)
   * @returns {Promise<Object>} Stored 2FA method record
   */
  static async store2FAMethod(userId, methodType, data = {}) {
    try {
      const result = await db.query(
        `INSERT INTO user_2fa_methods (user_id, method_type, secret_key, phone_number, is_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, method_type) 
         DO UPDATE SET secret_key = $3, phone_number = $4, is_enabled = true, updated_at = CURRENT_TIMESTAMP
         RETURNING id, user_id, method_type, is_enabled, created_at`,
        [userId, methodType, data.secret_key || null, data.phone_number || null]
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to store 2FA method');
      }

      console.log('[2FA SERVICE] 2FA method stored:', methodType, 'for user:', userId);
      return result.rows[0];
    } catch (error) {
      console.error('[2FA SERVICE] Error storing 2FA method:', error);
      throw error;
    }
  }

  /**
   * Get user's 2FA methods
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of 2FA methods
   */
  static async get2FAMethods(userId) {
    try {
      const result = await db.query(
        `SELECT id, method_type, is_enabled, created_at 
         FROM user_2fa_methods 
         WHERE user_id = $1 
         ORDER BY created_at ASC`,
        [userId]
      );

      return result.rows || [];
    } catch (error) {
      console.error('[2FA SERVICE] Error getting 2FA methods:', error);
      return [];
    }
  }

  /**
   * Disable 2FA method
   * @param {number} userId - User ID
   * @param {string} methodType - 'totp', 'email_otp', or 'sms_otp'
   * @returns {Promise<boolean>} True if disabled successfully
   */
  static async disable2FAMethod(userId, methodType) {
    try {
      const result = await db.query(
        `UPDATE user_2fa_methods 
         SET is_enabled = false, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND method_type = $2
         RETURNING id`,
        [userId, methodType]
      );

      if (!result.rows || result.rows.length === 0) {
        console.log('[2FA SERVICE] 2FA method not found:', methodType, 'for user:', userId);
        return false;
      }

      console.log('[2FA SERVICE] 2FA method disabled:', methodType, 'for user:', userId);
      return true;
    } catch (error) {
      console.error('[2FA SERVICE] Error disabling 2FA method:', error);
      return false;
    }
  }
}

module.exports = TwoFactorService;
