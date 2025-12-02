/**
 * API middleware barrel export
 */

const auth = require('./auth');
const validation = require('./validation');
const errorHandler = require('./errorHandler');
const logging = require('./logging');
const tenantContext = require('./tenantContext');
const queryFilter = require('./queryFilter');

module.exports = {
  // Authentication middleware
  ...auth,
  
  // Tenant context middleware
  ...tenantContext,
  
  // Query filter middleware
  ...queryFilter,
  
  // Validation middleware
  ...validation,
  
  // Error handling middleware
  ...errorHandler,
  
  // Logging middleware
  ...logging
};
