const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/UserWithSchema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;

    // Explicit validation for password field
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
        errors: [{ field: 'password', message: 'Password is required' }]
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('[AUTH DEBUG] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      // Improved error logging to include user email when password hash is missing
      // @ts-ignore - passwordHash is dynamically set by schema initialization
      if (!user.passwordHash) {
        // @ts-ignore - id is dynamically set by schema initialization
        console.error(`Authentication failed: User ${email} (ID: ${user.id}) has no password hash`);
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    // @ts-ignore - status is dynamically set by schema initialization
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    console.log('[AUTH DEBUG] All checks passed, generating tokens');

    // Update last login - DISABLED due to column name mismatch
    // TODO: Fix lastLogin field mapping to correct database column
    // await user.updateLastLogin();

    // Generate tokens
    // @ts-ignore - id is dynamically set by schema initialization
    const token = generateToken(user.id);
    // @ts-ignore - id is dynamically set by schema initialization
    const refreshToken = generateRefreshToken(user.id);

    // Calculate expiration time
    const expiresIn = rememberMe ? 7 * 24 * 60 * 60 : 60 * 60; // 7 days or 1 hour

    // Get user's tenant information
    let tenant = null;
    try {
      // @ts-ignore - id is dynamically set by schema initialization
      const userId = user.id;
      const tenantResult = await require('../config/database').query(
        'SELECT * FROM tenant WHERE id = (SELECT tenant_id FROM users WHERE id = $1)',
        [userId]
      );
      if (tenantResult.rows.length > 0) {
        // Cast database row to object type
        const tenantRow = /** @type {Record<string, any>} */ (tenantResult.rows[0]);
        tenant = {
          id: tenantRow.id,
          name: tenantRow.name,
          url: tenantRow.url,
          address: tenantRow.street,
          address2: tenantRow.street2,
          city: tenantRow.city,
          state: tenantRow.state,
          zip: tenantRow.zip,
          country: tenantRow.country,
          active: tenantRow.active,
          created_at: tenantRow.created_at,
          updated_at: tenantRow.updated_at,
        };
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
    }

    res.json({
      success: true,
      data: {
        user: {
          // @ts-ignore - properties are dynamically set by schema initialization
          id: user.id,
          // @ts-ignore
          email: user.email,
          // @ts-ignore
          name: user.name,
          // @ts-ignore
          role: user.role,
          // @ts-ignore
          permissions: user.permissions,
          // @ts-ignore
          status: user.active ? 'active' : 'inactive'
        },
        tenant: tenant,
        token,
        refreshToken,
        expiresIn
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Login error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
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

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          active: user.active
        },
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 60 * 60 // 1 hour
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Refresh token error:', err);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Token verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;