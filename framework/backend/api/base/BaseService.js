/**
 * Base Service Class
 * Provides common CRUD operations and business logic patterns
 */

const { buildWhereClause, buildOrderClause, calculatePagination } = require('../../shared/utils/database');
const { logger } = require('../../shared/utils/logging');

class BaseService {
  /**
   * Create a new BaseService instance
   * @param {import('../types/service').ServiceConfig} config - Service configuration
   */
  constructor(config) {
    const {
      model,
      logger: customLogger,
      searchFields = [],
      defaultIncludes = [],
      defaultOrder = [['createdAt', 'DESC']],
      tenantIdField = 'tenant_id'
    } = config;

    if (!model) {
      throw new Error('Model is required for BaseService');
    }

    this.model = model;
    this.logger = customLogger || logger;
    this.searchFields = searchFields;
    this.defaultIncludes = defaultIncludes;
    this.defaultOrder = defaultOrder;
    this.tenantIdField = tenantIdField;
  }

  /**
   * Merge tenant_id into WHERE clause if provided
   * @private
   * @param {Object} where - Existing WHERE clause
   * @param {string|null} tenantId - Tenant ID to add
   * @returns {Object} Merged WHERE clause
   */
  _mergeTenantFilter(where, tenantId) {
    if (!tenantId) {
      return where;
    }

    return {
      ...where,
      [this.tenantIdField]: tenantId
    };
  }

  /**
   * Find all items with pagination and filtering
   * @param {import('../../shared/types/common').QueryOptions} options - Query options
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<import('../types/service').ListServiceResult>}
   */
  async findAll(options = {}, tenantId = null) {
    try {
      const {
        page = 1,
        pageSize = 10,
        search,
        filters = {},
        sortBy,
        sortOrder = 'asc'
      } = options;

      // Build WHERE clause
      let where = buildWhereClause(filters, {
        search,
        searchFields: this.searchFields
      });

      // Merge tenant filter if provided
      where = this._mergeTenantFilter(where, tenantId);

      // Build ORDER clause
      const order = sortBy ? buildOrderClause(sortBy, sortOrder) : this.defaultOrder;

      // Calculate pagination
      const { offset, limit } = calculatePagination(page, pageSize);

      // Execute query
      const { count, rows } = await this.model.findAndCountAll({
        where,
        order,
        limit,
        offset,
        include: this.defaultIncludes
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / pageSize);
      const hasMore = page < totalPages;

      return {
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page, 10),
          pageSize: parseInt(pageSize, 10),
          total: count,
          totalPages,
          hasMore
        }
      };
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find a single item by ID
   * @param {string|number} id - Item ID
   * @param {import('../types/service').ServiceFindOptions} [options] - Find options
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async findById(id, options = {}, tenantId = null) {
    try {
      const where = tenantId ? { id, [this.tenantIdField]: tenantId } : { id };

      const item = await this.model.findOne({
        where,
        include: options.include || this.defaultIncludes,
        ...options
      });

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        };
      }

      return {
        success: true,
        data: item
      };
    } catch (error) {
      this.logger.error(`Error in findById(${id}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find a single item by conditions
   * @param {Object} where - WHERE conditions
   * @param {import('../types/service').ServiceFindOptions} [options] - Find options
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async findOne(where, options = {}, tenantId = null) {
    try {
      // Merge tenant filter if provided
      const mergedWhere = this._mergeTenantFilter(where, tenantId);

      const item = await this.model.findOne({
        where: mergedWhere,
        include: options.include || this.defaultIncludes,
        ...options
      });

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        };
      }

      return {
        success: true,
        data: item
      };
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new item
   * @param {Object} data - Item data
   * @param {Object} [options] - Create options
   * @param {string|null} [tenantId] - Optional tenant ID to include in creation
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async create(data, options = {}, tenantId = null) {
    try {
      // Include tenant_id in data if provided
      const dataWithTenant = tenantId
        ? { ...data, [this.tenantIdField]: tenantId }
        : data;

      const item = await this.model.create(dataWithTenant, options);

      return {
        success: true,
        data: item
      };
    } catch (error) {
      this.logger.error('Error in create:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing item
   * @param {string|number} id - Item ID
   * @param {Object} data - Update data
   * @param {Object} [options] - Update options
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async update(id, data, options = {}, tenantId = null) {
    try {
      const where = tenantId ? { id, [this.tenantIdField]: tenantId } : { id };

      const item = await this.model.findOne({ where });

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        };
      }

      await item.update(data, options);

      return {
        success: true,
        data: item
      };
    } catch (error) {
      this.logger.error(`Error in update(${id}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete an item
   * @param {string|number} id - Item ID
   * @param {Object} [options] - Delete options
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async delete(id, options = {}, tenantId = null) {
    try {
      const where = tenantId ? { id, [this.tenantIdField]: tenantId } : { id };

      const item = await this.model.findOne({ where });

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        };
      }

      await item.destroy(options);

      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      this.logger.error(`Error in delete(${id}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bulk create items
   * @param {Array<Object>} items - Array of items to create
   * @param {Object} [options] - Create options
   * @param {string|null} [tenantId] - Optional tenant ID to include in all items
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async bulkCreate(items, options = {}, tenantId = null) {
    try {
      // Include tenant_id in all items if provided
      const itemsWithTenant = tenantId
        ? items.map(item => ({ ...item, [this.tenantIdField]: tenantId }))
        : items;

      const created = await this.model.bulkCreate(itemsWithTenant, options);

      return {
        success: true,
        data: created,
        meta: { count: created.length }
      };
    } catch (error) {
      this.logger.error('Error in bulkCreate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bulk update items
   * @param {import('../types/service').BulkOperationOptions} options - Bulk operation options
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async bulkUpdate(options, tenantId = null) {
    try {
      const { ids, data, transaction } = options;

      const where = tenantId
        ? { id: ids, [this.tenantIdField]: tenantId }
        : { id: ids };

      const [count] = await this.model.update(data, {
        where,
        transaction
      });

      return {
        success: true,
        data: { count },
        meta: { updated: count }
      };
    } catch (error) {
      this.logger.error('Error in bulkUpdate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bulk delete items
   * @param {import('../types/service').BulkOperationOptions} options - Bulk operation options
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async bulkDelete(options, tenantId = null) {
    try {
      const { ids, transaction } = options;

      const where = tenantId
        ? { id: ids, [this.tenantIdField]: tenantId }
        : { id: ids };

      const count = await this.model.destroy({
        where,
        transaction
      });

      return {
        success: true,
        data: { count },
        meta: { deleted: count }
      };
    } catch (error) {
      this.logger.error('Error in bulkDelete:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Count items matching conditions
   * @param {Object} [where] - WHERE conditions
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async count(where = {}, tenantId = null) {
    try {
      // Merge tenant filter if provided
      const mergedWhere = this._mergeTenantFilter(where, tenantId);

      const count = await this.model.count({ where: mergedWhere });

      return {
        success: true,
        data: { count }
      };
    } catch (error) {
      this.logger.error('Error in count:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if item exists
   * @param {Object} where - WHERE conditions
   * @param {string|null} [tenantId] - Optional tenant ID for filtering
   * @returns {Promise<boolean>}
   */
  async exists(where, tenantId = null) {
    try {
      // Merge tenant filter if provided
      const mergedWhere = this._mergeTenantFilter(where, tenantId);

      const count = await this.model.count({ where: mergedWhere, limit: 1 });
      return count > 0;
    } catch (error) {
      this.logger.error('Error in exists:', error);
      return false;
    }
  }
}

module.exports = BaseService;
