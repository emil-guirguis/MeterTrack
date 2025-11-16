/**
 * API middleware barrel export
 */

const auth = require('./auth');
const validation = require('./validation');
const errorHandler = require('./errorHandler');
const logging = require('./logging');

module.exports = {
  // Authentication middleware
  ...auth,
  
  // Validation middleware
  ...validation,
  
  // Error handling middleware
  ...errorHandler,
  
  // Logging middleware
  ...logging
};
