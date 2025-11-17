/**
 * API base classes barrel export
 */

const BaseRouter = require('./BaseRouter');
const BaseController = require('./BaseController');
const BaseService = require('./BaseService');
const BaseModel = require('./BaseModel');

// Export error classes
const {
  ModelError,
  ValidationError,
  UniqueConstraintError,
  ForeignKeyError,
  NotFoundError,
  NotNullError,
  ConnectionError,
  ConfigurationError
} = require('./errors');

module.exports = {
  BaseRouter,
  BaseController,
  BaseService,
  BaseModel,
  // Error classes
  ModelError,
  ValidationError,
  UniqueConstraintError,
  ForeignKeyError,
  NotFoundError,
  NotNullError,
  ConnectionError,
  ConfigurationError
};
