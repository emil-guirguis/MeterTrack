const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserWithSchema');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('\n' + '█'.repeat(120));
    console.log('█ [AUTH] Token decoded');
    console.log('█'.repeat(120));
    console.log('Decoded token:', decoded);
    console.log('█'.repeat(120) + '\n');
    
    const user = await User.findById(decoded.userId);
    
    // CRITICAL: Always set tenant_id from JWT token
    // This ensures tenant_id is available even if deserialization didn't work
    if (user && decoded.tenant_id) {
      user.tenant_id = decoded.tenant_id;
    } else if (user && !user.tenant_id && decoded.tenant_id) {
      // Fallback: if user doesn't have tenant_id, use JWT token value
      user.tenant_id = decoded.tenant_id;
    }
    
    console.log('\n' + '█'.repeat(120));
    console.log('█ [AUTH] User.findById result');
    console.log('█'.repeat(120));
    console.log('User object keys:', Object.keys(user || {}));
    console.log('User object:', JSON.stringify(user, null, 2));
    console.log('█'.repeat(120) + '\n');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Check if user is active (status is a boolean field)
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Remove password hash before attaching to request
    delete user.passwordhash;
    
    // CRITICAL: Set global tenant context for automatic filtering
    global.currentTenantId = user.tenant_id;
    
    console.log('\n' + '█'.repeat(120));
    console.log('█ [AUTH] GLOBAL TENANT CONTEXT SET');
    console.log('█'.repeat(120));
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    console.log('Tenant ID:', user.tenant_id);
    console.log('Global tenant context set to:', global.currentTenantId);
    console.log('█'.repeat(120) + '\n');
    
    // Derive permissions from role using PermissionsService
    const PermissionsService = require('../services/PermissionsService');
    const userRole = (user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = PermissionsService.toFlatArray(permissionsObj);
    
    // If user has permissions in database, use those instead (convert from nested object format to flat array)
    // @ts-ignore - permissions is dynamically set by schema initialization
    if (user.permissions) {
      let permissionsToConvert = user.permissions;
      
      // If permissions is a JSON string, parse it first
      if (typeof permissionsToConvert === 'string') {
        try {
          permissionsToConvert = JSON.parse(permissionsToConvert);
          console.log('[AUTH MIDDLEWARE] Parsed permissions from JSON string');
        } catch (e) {
          console.warn('[AUTH MIDDLEWARE] Failed to parse permissions JSON:', e);
          permissionsToConvert = null;
        }
      }
      
      // Now convert to flat array
      if (permissionsToConvert && typeof permissionsToConvert === 'object' && !Array.isArray(permissionsToConvert)) {
        // Convert nested object format: { module: { action: true } } to flat array: ['module:action']
        console.log('[AUTH MIDDLEWARE] Converting nested permissions object to flat array');
        permissions = PermissionsService.toFlatArray(permissionsToConvert);
      } else if (Array.isArray(permissionsToConvert) && permissionsToConvert.length > 0) {
        // Handle old array format as fallback
        console.log('[AUTH MIDDLEWARE] Using existing array permissions');
        permissions = permissionsToConvert;
      } else {
        console.log('[AUTH MIDDLEWARE] Using role-based permissions for role:', userRole);
      }
    } else {
      console.log('[AUTH MIDDLEWARE] No stored permissions, using role-based permissions for role:', userRole);
    }
    
    console.log('[AUTH MIDDLEWARE] Final permissions:', {
      count: permissions.length,
      sample: permissions.slice(0, 3),
      isArray: Array.isArray(permissions)
    });
    
    user.permissions = permissions;
    
    // Ensure tenant_id is set from user's tenant relationship
    if (!user.tenant_id && user.tenant) {
      user.tenant_id = user.tenant.id || user.tenant;
    }
    
    console.log('[AUTH MIDDLEWARE] User loaded:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_id: user.tenant_id,
      active: user.active
    });
    
    req.user = user;
    
    // Also set req.auth for compatibility with tenant context middleware
    req.auth = {
      user: user
    };
    
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Check if user has required permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin users bypass permission checks
    if (req.user.role === 'admin') {
      return next();
    }

    const rawPerms = req.user.permissions;
    const perms = Array.isArray(rawPerms)
      ? rawPerms
      : (typeof rawPerms === 'string' ? [rawPerms] : []);

    if (!perms.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions'
      });
    }

    next();
  };
};

// API Key hashing utilities
const hashApiKey = async (apiKey) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(apiKey, salt);
};

const verifyApiKey = async (apiKey, hashedApiKey) => {
  return bcrypt.compare(apiKey, hashedApiKey);
};

// Get site ID from API key
const getSiteIdFromApiKey = async (apiKey) => {
  try {
    const result = await db.query(
      'SELECT id FROM sites WHERE api_key = $1 AND is_active = true',
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // @ts-ignore - rows is an array of objects with id property
    return result.rows[0].id;
  } catch (error) {
    console.error('Error getting site ID from API key:', error);
    return null;
  }
};

// Authenticate Sync server using API key
const authenticateSyncServer = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Get site ID from API key
    const siteId = await getSiteIdFromApiKey(apiKey);
    
    if (!siteId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Attach site ID to request
    req.siteId = siteId;
    next();
  } catch (error) {
    console.error('Sync authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  authenticateSyncServer,
  hashApiKey,
  verifyApiKey,
  getSiteIdFromApiKey
};