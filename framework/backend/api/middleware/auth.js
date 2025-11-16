/**
 * Authentication middleware
 * Handles JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');
const { logger } = require('../../shared/utils/logging');

/**
 * Verify JWT token and attach user to request
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function requireAuth(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);

    // Attach auth context to request
    req.auth = {
      user: decoded.user || decoded,
      token
    };

    // Attach to context as well
    req.context = {
      ...req.context,
      auth: req.auth
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional authentication - attach user if token present, but don't require it
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);

    req.auth = {
      user: decoded.user || decoded,
      token
    };

    req.context = {
      ...req.context,
      auth: req.auth
    };
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error.message);
  }

  next();
}

/**
 * Check if user has required permissions
 * @param {Array<string>} requiredPermissions - Required permissions
 * @returns {Function} Express middleware
 */
function requirePermissions(requiredPermissions) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const userPermissions = req.auth.user.permissions || [];
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: [`Required permissions: ${requiredPermissions.join(', ')}`],
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * Check if user has any of the required roles
 * @param {Array<string>} requiredRoles - Required roles
 * @returns {Function} Express middleware
 */
function requireRoles(requiredRoles) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const userRoles = req.auth.user.roles || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: [`Required roles: ${requiredRoles.join(', ')}`],
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {Object} [options] - Token options
 * @returns {string} JWT token
 */
function generateToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const defaultOptions = {
    expiresIn: '24h',
    ...options
  };

  return jwt.sign(payload, secret, defaultOptions);
}

module.exports = {
  requireAuth,
  optionalAuth,
  requirePermissions,
  requireRoles,
  generateToken
};
