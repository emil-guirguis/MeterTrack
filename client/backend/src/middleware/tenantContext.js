/**
 * Tenant Context Middleware
 * 
 * Automatically injects tenant_id into all database operations
 * to ensure proper tenant isolation without manual intervention.
 */

// Store the current tenant context in a thread-local-like storage
const { AsyncLocalStorage } = require('async_hooks');
const tenantStorage = new AsyncLocalStorage();

/**
 * Middleware to set tenant context for the request
 * Must be used after authenticateToken middleware
 */
const setTenantContext = (req, res, next) => {
  // Extract tenant_id from authenticated user
  const tenantId = req.user?.tenant_id || req.user?.tenantId;
  
  console.log('\n' + '█'.repeat(120));
  console.log('█ [TENANT CONTEXT] Setting tenant context');
  console.log('█'.repeat(120));
  console.log('User ID:', req.user?.id);
  console.log('User Email:', req.user?.email);
  console.log('Tenant ID from req.user.tenant_id:', req.user?.tenant_id);
  console.log('Tenant ID from req.user.tenantId:', req.user?.tenantId);
  console.log('Final Tenant ID:', tenantId);
  console.log('█'.repeat(120) + '\n');
  
  if (!tenantId) {
    console.error('[TENANT CONTEXT] ✗ No tenant_id found in authenticated user');
    return res.status(401).json({
      success: false,
      message: 'Tenant context required'
    });
  }
  
  // Store tenant context for this request
  const context = { tenantId };
  
  tenantStorage.run(context, () => {
    next();
  });
};

/**
 * Get the current tenant ID from context
 * @returns {number|null} Current tenant ID or null if not set
 */
const getCurrentTenantId = () => {
  const context = tenantStorage.getStore();
  return context?.tenantId || null;
};

/**
 * Check if tenant context is available
 * @returns {boolean} True if tenant context is set
 */
const hasTenantContext = () => {
  return getCurrentTenantId() !== null;
};

module.exports = {
  setTenantContext,
  getCurrentTenantId,
  hasTenantContext
};