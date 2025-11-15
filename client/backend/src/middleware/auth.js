const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Remove password hash before attaching to request
    delete user.passwordhash;
    req.user = user;
    next();
  } catch (error) {
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