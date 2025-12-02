/**
 * Base Controller Class
 * Provides common request handling and response formatting
 */

const { logger } = require('../../shared/utils/logging');
const tenantUtils = require('../utils/tenantUtils');

class BaseController {
  /**
   * Create a new BaseController instance
   * @param {import('../types/controller').ControllerConfig} config - Controller configuration
   */
  constructor(config) {
    const {
      service,
      logger: customLogger,
      validation,
      searchFields = []
    } = config;

    if (!service) {
      throw new Error('Service is required for BaseController');
    }

    this.service = service;
    this.logger = customLogger || logger;
    this.validation = validation;
    this.searchFields = searchFields;

    // Bind methods to preserve 'this' context
    this.list = this.list.bind(this);
    this.get = this.get.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getTenantId = this.getTenantId.bind(this);
    this.verifyTenantOwnership = this.verifyTenantOwnership.bind(this);
    this.validateTenantContext = this.validateTenantContext.bind(this);
  }

  /**
   * Get the current tenant ID from request context
   * Validates that tenant context exists and is valid
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @returns {string|null} Tenant ID or null if not available
   */
  getTenantId(req) {
    return tenantUtils.getTenantId(req);
  }

  /**
   * Verify that a resource belongs to the current tenant
   * Prevents cross-tenant access by checking resource ownership
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {string|number} resourceId - Resource ID to verify
   * @param {Object} model - Sequelize model to query
   * @returns {Promise<boolean>} True if resource belongs to tenant, false otherwise
   */
  async verifyTenantOwnership(req, resourceId, model) {
    return tenantUtils.verifyTenantOwnership(req, resourceId, model);
  }

  /**
   * Validate that request has valid tenant context
   * Rejects requests without valid tenant context with 401 Unauthorized
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   * @returns {boolean} True if tenant context is valid, false otherwise
   */
  validateTenantContext(req, res) {
    const tenantId = this.getTenantId(req);

    if (!tenantId) {
      this.logger.warn('Request rejected: missing or invalid tenant context', {
        userId: req.auth?.user?.id,
        timestamp: new Date().toISOString()
      });
      this.sendError(res, 'Tenant context not found', 401);
      return false;
    }

    return true;
  }

  /**
   * Send success response
   * @param {import('express').Response} res - Express response
   * @param {*} data - Response data
   * @param {import('../types/response').ResponseOptions} [options] - Response options
   */
  sendSuccess(res, data, options = {}) {
    const { statusCode = 200, message, meta } = options;

    res.status(statusCode).json({
      success: true,
      data,
      message,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send paginated response
   * @param {import('express').Response} res - Express response
   * @param {Array} data - Response data
   * @param {Object} pagination - Pagination metadata
   * @param {import('../types/response').ResponseOptions} [options] - Response options
   */
  sendPaginated(res, data, pagination, options = {}) {
    const { statusCode = 200, message } = options;

    res.status(statusCode).json({
      success: true,
      data,
      pagination,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send error response
   * @param {import('express').Response} res - Express response
   * @param {string} error - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Array<string>} [details] - Additional error details
   */
  sendError(res, error, statusCode = 500, details = []) {
    res.status(statusCode).json({
      success: false,
      error,
      details: details.length > 0 ? details : undefined,
      statusCode,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Extract query parameters for list operations
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @returns {import('../types/controller').ListOptions}
   */
  extractListOptions(req) {
    const {
      page = 1,
      pageSize = 10,
      search,
      sortBy,
      sortOrder = 'asc',
      ...filters
    } = req.query;

    return {
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      search,
      sortBy,
      sortOrder,
      filters,
      searchFields: this.searchFields
    };
  }

  /**
   * List items with pagination and filtering
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async list(req, res) {
    try {
      const options = this.extractListOptions(req);
      const result = await this.service.findAll(options);

      if (!result.success) {
        return this.sendError(res, result.error, 500);
      }

      this.sendPaginated(res, result.data, result.pagination);
    } catch (error) {
      this.logger.error('Error in list:', error);
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Get a single item by ID
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async get(req, res) {
    try {
      const { id } = req.params;
      const result = await this.service.findById(id);

      if (!result.success) {
        return this.sendError(res, result.error, 404);
      }

      this.sendSuccess(res, result.data);
    } catch (error) {
      this.logger.error('Error in get:', error);
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Create a new item
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async create(req, res) {
    try {
      const data = req.body;
      const result = await this.service.create(data);

      if (!result.success) {
        return this.sendError(res, result.error, 400);
      }

      this.sendSuccess(res, result.data, { statusCode: 201, message: 'Item created successfully' });
    } catch (error) {
      this.logger.error('Error in create:', error);
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Update an existing item
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await this.service.update(id, data);

      if (!result.success) {
        const statusCode = result.error === 'Item not found' ? 404 : 400;
        return this.sendError(res, result.error, statusCode);
      }

      this.sendSuccess(res, result.data, { message: 'Item updated successfully' });
    } catch (error) {
      this.logger.error('Error in update:', error);
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Delete an item
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await this.service.delete(id);

      if (!result.success) {
        const statusCode = result.error === 'Item not found' ? 404 : 400;
        return this.sendError(res, result.error, statusCode);
      }

      this.sendSuccess(res, result.data, { message: 'Item deleted successfully' });
    } catch (error) {
      this.logger.error('Error in delete:', error);
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Bulk create items
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async bulkCreate(req, res) {
    try {
      const items = req.body.items || req.body;
      
      if (!Array.isArray(items)) {
        return this.sendError(res, 'Items must be an array', 400);
      }

      const result = await this.service.bulkCreate(items);

      if (!result.success) {
        return this.sendError(res, result.error, 400);
      }

      this.sendSuccess(res, result.data, { 
        statusCode: 201, 
        message: `${result.meta.count} items created successfully`,
        meta: result.meta
      });
    } catch (error) {
      this.logger.error('Error in bulkCreate:', error);
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Bulk update items
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async bulkUpdate(req, res) {
    try {
      const { ids, data } = req.body;

      if (!Array.isArray(ids) || !data) {
        return this.sendError(res, 'ids (array) and data (object) are required', 400);
      }

      const result = await this.service.bulkUpdate({ ids, data });

      if (!result.success) {
        return this.sendError(res, result.error, 400);
      }

      this.sendSuccess(res, result.data, { 
        message: `${result.meta.updated} items updated successfully`,
        meta: result.meta
      });
    } catch (error) {
      this.logger.error('Error in bulkUpdate:', error);
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Bulk delete items
   * @param {import('../types/request').ExtendedRequest} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async bulkDelete(req, res) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids)) {
        return this.sendError(res, 'ids must be an array', 400);
      }

      const result = await this.service.bulkDelete({ ids });

      if (!result.success) {
        return this.sendError(res, result.error, 400);
      }

      this.sendSuccess(res, result.data, { 
        message: `${result.meta.deleted} items deleted successfully`,
        meta: result.meta
      });
    } catch (error) {
      this.logger.error('Error in bulkDelete:', error);
      this.sendError(res, error.message, 500);
    }
  }
}

module.exports = BaseController;
