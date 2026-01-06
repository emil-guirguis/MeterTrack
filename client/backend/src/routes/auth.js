const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/UserWithSchema');
const { authenticateToken } = require('../middleware/auth');
const PermissionsService = require('../services/PermissionsService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, tenant_id) => {
  return jwt.sign({ userId, tenant_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

// Generate refresh token
const generateRefreshToken = (userId, tenant_id) => {
  return jwt.sign({ userId, tenant_id }, process.env.JWT_SECRET, {
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
    console.log('\n' + '='.repeat(120));
    console.log('[AUTH LOGIN] Step 1: Finding user by email:', email);

    // DEBUG: Check database directly
    const db = require('../config/database');
    const dbCheck = await db.query('SELECT id, email, name, role, tenant_id, active FROM users WHERE email = $1', [email]);
    console.log('[AUTH LOGIN] DATABASE CHECK - Raw query result:', dbCheck.rows);

    const user = await User.findByEmail(email);

    if (!user) {
      console.log('[AUTH LOGIN] ✗ User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('[AUTH LOGIN] ✓ User found');
    console.log('[AUTH LOGIN] User object keys:', Object.keys(user));
    console.log('[AUTH LOGIN] User object:', {
      // @ts-ignore - properties are dynamically set by schema initialization
      id: user.id,
      // @ts-ignore
      email: user.email,
      // @ts-ignore
      name: user.name,
      // @ts-ignore
      role: user.role,
      // @ts-ignore
      tenant_id: user.tenant_id,
      // @ts-ignore
      active: user.active,
      // @ts-ignore
      passwordHash: user.passwordHash ? '***HASH***' : 'MISSING'
    });

    // Check password
    console.log('[AUTH LOGIN] Step 2: Validating password');
    const isPasswordValid = await user.comparePassword(password);
    console.log('[AUTH LOGIN] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      // Improved error logging to include user email when password hash is missing
      // @ts-ignore - passwordHash is dynamically set by schema initialization
      if (!user.passwordHash) {
        // @ts-ignore - id is dynamically set by schema initialization
        console.error(`[AUTH LOGIN] ✗ Authentication failed: User ${email} (ID: ${user.id}) has no password hash`);
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    console.log('[AUTH LOGIN] Step 3: Checking if user is active');
    // @ts-ignore - status is dynamically set by schema initialization
    if (!user.active) {
      console.log('[AUTH LOGIN] ✗ User is inactive');
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    console.log('[AUTH LOGIN] ✓ User is active');
    console.log('[AUTH LOGIN] Step 4: Preparing token generation');
    // @ts-ignore - properties are dynamically set by schema initialization
    console.log('[AUTH LOGIN] User ID:', user.id);
    // @ts-ignore
    console.log('[AUTH LOGIN] User tenant_id:', user.tenant_id);
    // @ts-ignore
    console.log('[AUTH LOGIN] User tenant_id type:', typeof user.tenant_id);
    // @ts-ignore
    console.log('[AUTH LOGIN] User tenant_id is null?', user.tenant_id === null);
    // @ts-ignore
    console.log('[AUTH LOGIN] User tenant_id is undefined?', user.tenant_id === undefined);

    // Update last login - DISABLED due to column name mismatch
    // TODO: Fix lastLogin field mapping to correct database column
    // await user.updateLastLogin();

    // Generate tokens
    // @ts-ignore - properties are dynamically set by schema initialization
    console.log('[AUTH LOGIN] Step 5: Generating tokens with userId:', user.id, 'and tenant_id:', user.tenant_id);
    console.log('[AUTH LOGIN] CRITICAL DEBUG - About to generate token');
    console.log('[AUTH LOGIN] user object full dump:', JSON.stringify(user, null, 2));
    // @ts-ignore - tenant_id is dynamically set by schema initialization
    console.log('[AUTH LOGIN] user.tenant_id value:', user.tenant_id);
    // @ts-ignore - tenant_id is dynamically set by schema initialization
    console.log('[AUTH LOGIN] user.tenant_id type:', typeof user.tenant_id);
    // @ts-ignore - properties are dynamically set by schema initialization
    console.log('[AUTH LOGIN] Calling generateToken with:', { userId: user.id, tenant_id: user.tenant_id });

    // @ts-ignore - id and tenant_id are dynamically set by schema initialization
    const token = generateToken(user.id, user.tenant_id);
    // @ts-ignore - id and tenant_id are dynamically set by schema initialization
    const refreshToken = generateRefreshToken(user.id, user.tenant_id);

    console.log('[AUTH LOGIN] Token generated. Decoding to verify...');
    const decoded = jwt.decode(token);
    console.log('[AUTH LOGIN] Decoded token:', decoded);

    // @ts-ignore
    console.log('[AUTH LOGIN] ✓ Tokens generated');
    // @ts-ignore
    console.log('[AUTH LOGIN] Token payload will contain: userId:', user.id, ', tenant_id:', user.tenant_id);

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
          street: tenantRow.street,
          street2: tenantRow.street2,
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

    // Derive permissions from role using PermissionsService
    // @ts-ignore - role is dynamically set by schema initialization
    const userRole = (user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = permissionsObj;

    // If user has permissions in database, use those instead (keep as nested object)
    // @ts-ignore - permissions is dynamically set by schema initialization
    if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      // Use nested object format as-is: { module: { action: true } }
      permissions = user.permissions;
    }

    const responseData = {
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
          permissions: permissions,
          // @ts-ignore
          status: user.active ? 'active' : 'inactive',
          // @ts-ignore - tenant_id is dynamically set by schema initialization
          client: user.tenant_id
        },
        tenant: tenant,
        token,
        refreshToken,
        expiresIn
      }
    };

    console.log('[AUTH DEBUG] Login response:', {
      userId: responseData.data.user.id,
      email: responseData.data.user.email,
      client: responseData.data.user.client,
      hasToken: !!responseData.data.token,
      permissionsCount: Object.keys(responseData.data.user.permissions || {}).length,
      permissions: responseData.data.user.permissionss
    });

    res.json(responseData);
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

    // Generate new tokens with tenant_id
    const newToken = generateToken(user.id, user.tenant_id || decoded.tenant_id);
    const newRefreshToken = generateRefreshToken(user.id, user.tenant_id || decoded.tenant_id);

    // Derive permissions from role using PermissionsService
    const userRole = (user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = permissionsObj;

    // If user has permissions in database, use those instead (keep as nested object)
    if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      // Use nested object format as-is: { module: { action: true } }
      permissions = user.permissions;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: permissions,
          active: user.active,
          // @ts-ignore - tenant_id is dynamically set by schema initialization
          client: user.tenant_id
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
    // Derive permissions from role using PermissionsService
    const userRole = (req.user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = permissionsObj;

    // If user has permissions in database, use those instead (keep as nested object)
    if (req.user.permissions && typeof req.user.permissions === 'object' && !Array.isArray(req.user.permissions)) {
      // Use nested object format as-is: { module: { action: true } }
      permissions = req.user.permissions;
    }

    // Map user object to include client field and permissions
    const userResponse = {
      ...req.user,
      permissions: permissions,
      // @ts-ignore - tenant_id is dynamically set by schema initialization
      client: req.user.tenant_id
    };

    res.json({
      success: true,
      data: {
        user: userResponse
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

// Bootstrap - Create first admin user (only works if no users exist)
router.post('/bootstrap', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('name').notEmpty().trim().withMessage('Name is required')
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

    // Check if any users exist
    const existingUsers = await User.findAll({ limit: 1 });
    if (existingUsers && existingUsers.rows && existingUsers.rows.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Bootstrap is only available when no users exist'
      });
    }

    const { email, password, name } = req.body;

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Get admin permissions from PermissionsService
    const adminPermissionsObj = PermissionsService.getPermissionsByRole('admin');

    // Create or get default tenant
    const db = require('../config/database');
    let tenantId = null;

    try {
      // Check if a default tenant exists
      const tenantResult = await db.query('SELECT id FROM tenant LIMIT 1');
      if (tenantResult.rows && tenantResult.rows.length > 0) {
        const tenantRow = /** @type {Record<string, any>} */ (tenantResult.rows[0]);
        tenantId = tenantRow.id;
        console.log('[BOOTSTRAP] Using existing tenant:', tenantId);
      } else {
        // Create a default tenant
        const createTenantResult = await db.query(
          'INSERT INTO tenant (name, active) VALUES ($1, $2) RETURNING id',
          ['Default Tenant', true]
        );
        const createdTenantRow = /** @type {Record<string, any>} */ (createTenantResult.rows[0]);
        tenantId = createdTenantRow.id;
        console.log('[BOOTSTRAP] Created default tenant:', tenantId);
      }
    } catch (err) {
      const error = /** @type {Error} */ (err);
      console.error('[BOOTSTRAP] Error managing tenant:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create or find tenant',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Create admin user with tenant_id
    const user = await User.create({
      email,
      name,
      passwordHash,
      role: 'admin',
      permissions: adminPermissionsObj,
      active: true,
      tenant_id: tenantId
    });

    // Generate tokens
    const token = generateToken(user.id, user.tenant_id);
    const refreshToken = generateRefreshToken(user.id, user.tenant_id);

    res.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: adminPermissionsObj,
          status: 'active'
        },
        token,
        refreshToken,
        expiresIn: 60 * 60
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Bootstrap error:', err);
    res.status(500).json({
      success: false,
      message: 'Bootstrap failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;