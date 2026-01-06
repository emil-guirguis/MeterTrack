/**
 * Token Service
 * Generates and validates secure reset tokens
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

class TokenService {
  /**
   * Generate a secure reset token
   * @param {number} [length=32] - Token length in bytes
   * @returns {Promise<Object>} { token: string, token_hash: string, expires_at: Date }
   */
  static async generateResetToken(length = 32) {
    // Generate random bytes
    const token = crypto.randomBytes(length).toString('hex');

    // Hash the token for storage
    const salt = await bcrypt.genSalt(10);
    const token_hash = await bcrypt.hash(token, salt);

    // Set expiration to 24 hours from now
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      token,
      token_hash,
      expires_at
    };
  }

  /**
   * Validate a reset token
   * @param {string} token - Plain text token to validate
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if token is valid
   */
  static async validateResetToken(token, userId) {
    try {
      // Find the token in database
      const result = await db.query(
        `SELECT token_hash, expires_at, is_used 
         FROM password_reset_tokens 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (!result.rows || result.rows.length === 0) {
        console.log('[TOKEN SERVICE] Token not found for user:', userId);
        return false;
      }

      const tokenRecord = result.rows[0];

      // Check if token is already used
      if (tokenRecord.is_used) {
        console.log('[TOKEN SERVICE] Token already used');
        return false;
      }

      // Check if token has expired
      if (new Date() > new Date(tokenRecord.expires_at)) {
        console.log('[TOKEN SERVICE] Token has expired');
        return false;
      }

      // Verify token hash
      const isValid = await bcrypt.compare(token, tokenRecord.token_hash);
      if (!isValid) {
        console.log('[TOKEN SERVICE] Token hash does not match');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TOKEN SERVICE] Error validating token:', error);
      return false;
    }
  }

  /**
   * Invalidate a reset token (mark as used)
   * @param {string} token - Plain text token to invalidate
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if invalidated successfully
   */
  static async invalidateResetToken(token, userId) {
    try {
      // Find and update the token
      const result = await db.query(
        `UPDATE password_reset_tokens 
         SET is_used = true, used_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 
         AND is_used = false 
         AND expires_at > CURRENT_TIMESTAMP
         RETURNING id`,
        [userId]
      );

      if (!result.rows || result.rows.length === 0) {
        console.log('[TOKEN SERVICE] Token not found or already used');
        return false;
      }

      console.log('[TOKEN SERVICE] Token invalidated successfully');
      return true;
    } catch (error) {
      console.error('[TOKEN SERVICE] Error invalidating token:', error);
      return false;
    }
  }

  /**
   * Store a reset token in the database
   * @param {number} userId - User ID
   * @param {string} tokenHash - Hashed token
   * @param {Date} expiresAt - Token expiration time
   * @returns {Promise<Object>} Stored token record
   */
  static async storeResetToken(userId, tokenHash, expiresAt) {
    try {
      // Invalidate any previous tokens for this user
      await db.query(
        `UPDATE password_reset_tokens 
         SET is_used = true 
         WHERE user_id = $1 AND is_used = false`,
        [userId]
      );

      // Store new token
      const result = await db.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, is_used, created_at)
         VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
         RETURNING id, user_id, expires_at, created_at`,
        [userId, tokenHash, expiresAt]
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to store reset token');
      }

      console.log('[TOKEN SERVICE] Reset token stored successfully');
      return result.rows[0];
    } catch (error) {
      console.error('[TOKEN SERVICE] Error storing reset token:', error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} Number of tokens deleted
   */
  static async cleanupExpiredTokens() {
    try {
      const result = await db.query(
        `DELETE FROM password_reset_tokens 
         WHERE expires_at < CURRENT_TIMESTAMP`
      );

      console.log('[TOKEN SERVICE] Cleaned up', result.rowCount, 'expired tokens');
      return result.rowCount;
    } catch (error) {
      console.error('[TOKEN SERVICE] Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Check rate limit for password reset requests
   * @param {string} email - User email
   * @param {number} [limit=3] - Max requests per hour
   * @returns {Promise<boolean>} True if under limit
   */
  static async checkResetRateLimit(email, limit = 3) {
    try {
      // Find user by email
      const userResult = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (!userResult.rows || userResult.rows.length === 0) {
        // User doesn't exist, but return true for security (generic response)
        return true;
      }

      const userId = userResult.rows[0].id;

      // Count reset requests in the last hour
      const result = await db.query(
        `SELECT COUNT(*) as count 
         FROM password_reset_tokens 
         WHERE user_id = $1 
         AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'`,
        [userId]
      );

      const count = parseInt(result.rows[0].count, 10);
      return count < limit;
    } catch (error) {
      console.error('[TOKEN SERVICE] Error checking rate limit:', error);
      return false;
    }
  }
}

module.exports = TokenService;
