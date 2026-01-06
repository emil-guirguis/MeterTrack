/**
 * Enhanced Authentication Routes
 * Includes password management, 2FA, and password reset functionality
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/UserWithSchema');
const { authenticateToken } = require('../middleware/auth');
const PasswordValidator = require('../services/PasswordValidator');
const TokenService = require('../services/TokenService');
const TwoFactorService = require('../services/TwoFactorService');
const AuthLoggingService = require('../services/AuthLoggingService');
const EmailService = require('../services/EmailService');

const router = express.Router();

// ===== PASSWORD MANAGEMENT =====

/**
 * POST /api/auth/change-password
 * Change user's password (requires current password)
 */
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Verify passwords match
    if (newPassword !== confirmPassword) {
      await AuthLoggingService.logPasswordChange(userId, false, {
        details: { reason: 'passwords_do_not_match' }
      });

      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      await AuthLoggingService.logPasswordChange(userId, false, {
        details: { reason: 'invalid_current_password' }
      });

      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    const validation = PasswordValidator.validate(newPassword, user.email);
    if (!validation.isValid) {
      await AuthLoggingService.logPasswordChange(userId, false, {
        details: { reason: 'invalid_password', errors: validation.errors }
      });

      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: validation.errors
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      await AuthLoggingService.logPasswordChange(userId, false, {
        details: { reason: 'same_as_current' }
      });

      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const newPasswordHash = await User.hashPassword(newPassword);

    // Update password
    await user.update({
      passwordHash: newPasswordHash,
      password_changed_at: new Date()
    });

    // Log successful password change
    await AuthLoggingService.logPasswordChange(userId, true);

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== PASSWORD RESET (FORGOT PASSWORD) =====

/**
 * POST /api/auth/forgot-password
 * Request password reset link (self-service)
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check rate limit
    const isUnderLimit = await TokenService.checkResetRateLimit(email, 3);
    if (!isUnderLimit) {
      // Don't reveal rate limit to user for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (user) {
      // Generate reset token
      const { token, token_hash, expires_at } = await TokenService.generateResetToken();

      // Store token in database
      await TokenService.storeResetToken(user.id, token_hash, expires_at);

      // Send email with reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      try {
        await EmailService.sendPasswordResetEmail(user.email, user.name, resetLink, expires_at);
        console.log('[AUTH] Password reset email sent to:', email);
      } catch (emailError) {
        console.error('[AUTH] Failed to send password reset email:', emailError);
        // Don't fail the request, just log the error
      }

      // Log the request
      await AuthLoggingService.logEvent({
        userId: user.id,
        eventType: 'password_reset_requested',
        status: 'success',
        details: { email }
      });
    }

    // Always return generic message for security
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, newPassword, confirmPassword } = req.body;

    // Verify passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Find token in database to get user ID
    const db = require('../config/database');
    const tokenResult = await db.query(
      `SELECT user_id, token_hash, expires_at, is_used 
       FROM password_reset_tokens 
       WHERE expires_at > CURRENT_TIMESTAMP 
       AND is_used = false
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (!tokenResult.rows || tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired or is invalid'
      });
    }

    const tokenRecord = tokenResult.rows[0];
    const userId = tokenRecord.user_id;

    // Verify token
    const isTokenValid = await TokenService.validateResetToken(token, userId);
    if (!isTokenValid) {
      await AuthLoggingService.logPasswordReset(userId, false, {
        details: { reason: 'invalid_token' }
      });

      return res.status(400).json({
        success: false,
        message: 'Reset link has expired or is invalid'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate new password
    const validation = PasswordValidator.validate(newPassword, user.email);
    if (!validation.isValid) {
      await AuthLoggingService.logPasswordReset(userId, false, {
        details: { reason: 'invalid_password', errors: validation.errors }
      });

      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: validation.errors
      });
    }

    // Hash new password
    const newPasswordHash = await User.hashPassword(newPassword);

    // Update password
    await user.update({
      passwordHash: newPasswordHash,
      password_changed_at: new Date()
    });

    // Invalidate token
    await TokenService.invalidateResetToken(token, userId);

    // Log successful password reset
    await AuthLoggingService.logPasswordReset(userId, true);

    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== 2FA SETUP =====

/**
 * POST /api/auth/2fa/setup
 * Setup 2FA method
 */
router.post('/2fa/setup', authenticateToken, [
  body('method').isIn(['totp', 'email_otp', 'sms_otp']).withMessage('Invalid 2FA method'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { method, phoneNumber } = req.body;
    const userId = req.user.id;

    let setupData = {};

    if (method === 'totp') {
      // Generate TOTP secret
      const user = await User.findById(userId);
      setupData = await TwoFactorService.generateTOTPSecret(user.email);
    } else if (method === 'email_otp') {
      // Email OTP doesn't need setup data
      setupData = { message: 'Email OTP will be sent during login' };
    } else if (method === 'sms_otp') {
      // Validate phone number
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for SMS OTP'
        });
      }
      setupData = { phone_number: phoneNumber, message: 'SMS OTP will be sent during login' };
    }

    res.json({
      success: true,
      data: setupData
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/2fa/verify-setup
 * Verify 2FA setup and enable method
 */
router.post('/2fa/verify-setup', authenticateToken, [
  body('method').isIn(['totp', 'email_otp', 'sms_otp']).withMessage('Invalid 2FA method'),
  body('code').notEmpty().withMessage('Verification code is required'),
  body('phoneNumber').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { method, code, phoneNumber, secret } = req.body;
    const userId = req.user.id;

    let isValid = false;

    if (method === 'totp') {
      // Verify TOTP code
      if (!secret) {
        return res.status(400).json({
          success: false,
          message: 'TOTP secret is required'
        });
      }
      isValid = TwoFactorService.verifyTOTPCode(secret, code);
    } else if (method === 'email_otp') {
      // Verify email OTP
      isValid = await TwoFactorService.verifyEmailOTP(userId, code);
    } else if (method === 'sms_otp') {
      // Verify SMS OTP
      isValid = await TwoFactorService.verifySMSOTP(userId, code);
    }

    if (!isValid) {
      await AuthLoggingService.log2FAEnable(userId, method, false, {
        details: { reason: 'invalid_code' }
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Store 2FA method
    const methodData = {};
    if (method === 'totp') {
      methodData.secret_key = secret;
    } else if (method === 'sms_otp') {
      methodData.phone_number = phoneNumber;
    }

    await TwoFactorService.store2FAMethod(userId, method, methodData);

    // Generate backup codes for TOTP
    let backupCodes = [];
    if (method === 'totp') {
      backupCodes = TwoFactorService.generateBackupCodes(10);
      await TwoFactorService.storeBackupCodes(userId, backupCodes);
    }

    // Log 2FA enable
    await AuthLoggingService.log2FAEnable(userId, method, true);

    res.json({
      success: true,
      message: '2FA method enabled successfully',
      data: {
        backup_codes: method === 'totp' ? backupCodes : undefined
      }
    });
  } catch (error) {
    console.error('2FA verify setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA setup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/auth/2fa/methods
 * Get user's 2FA methods
 */
router.get('/2fa/methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const methods = await TwoFactorService.get2FAMethods(userId);

    res.json({
      success: true,
      data: {
        methods
      }
    });
  } catch (error) {
    console.error('Get 2FA methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA methods',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA method
 */
router.post('/2fa/disable', authenticateToken, [
  body('method').isIn(['totp', 'email_otp', 'sms_otp']).withMessage('Invalid 2FA method'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { method, password } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await AuthLoggingService.log2FADisable(userId, method, false, {
        details: { reason: 'invalid_password' }
      });

      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Disable 2FA method
    const success = await TwoFactorService.disable2FAMethod(userId, method);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '2FA method not found'
      });
    }

    // Log 2FA disable
    await AuthLoggingService.log2FADisable(userId, method, true);

    res.json({
      success: true,
      message: '2FA method disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * Regenerate backup codes for TOTP
 */
router.post('/2fa/regenerate-backup-codes', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Generate new backup codes
    const backupCodes = TwoFactorService.generateBackupCodes(10);
    await TwoFactorService.storeBackupCodes(userId, backupCodes);

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backup_codes: backupCodes
      }
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate backup codes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
