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
      defaultOrder = [['createdAt', 'DESC']]
    } = config;

    if (!model) {
      throw new Error('Model is required for BaseService');
    }

    this.model = model;
    this.logger = customLogger || logger;
    this.searchFields = searchFields;
    this.defaultIncludes = defaultIncludes;
    this.defaultOrder = defaultOrder;
  }

  /**
   * Find all items with pagination and filtering
   * @param {import('../../shared/types/common').QueryOptions} options - Query options
   * @returns {Promise<import('../types/service').ListServiceResult>}
   */
  async findAll(options = {}) {
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
      const where = buildWhereClause(filters, {
        search,
        searchFields: this.searchFields
      });

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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async findById(id, options = {}) {
    try {
      const item = await this.model.findByPk(id, {
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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async findOne(where, options = {}) {
    try {
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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async create(data, options = {}) {
    try {
      const item = await this.model.create(data, options);

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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async update(id, data, options = {}) {
    try {
      const item = await this.model.findByPk(id);

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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async delete(id, options = {}) {
    try {
      const item = await this.model.findByPk(id);

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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async bulkCreate(items, options = {}) {
    try {
      const created = await this.model.bulkCreate(items, options);

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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async bulkUpdate(options) {
    try {
      const { ids, data, transaction } = options;

      const [count] = await this.model.update(data, {
        where: { id: ids },
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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async bulkDelete(options) {
    try {
      const { ids, transaction } = options;

      const count = await this.model.destroy({
        where: { id: ids },
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
   * @returns {Promise<import('../types/service').ServiceResult>}
   */
  async count(where = {}) {
    try {
      const count = await this.model.count({ where });

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
   * @returns {Promise<boolean>}
   */
  async exists(where) {
    try {
      const count = await this.model.count({ where, limit: 1 });
      return count > 0;
    } catch (error) {
      this.logger.error('Error in exists:', error);
      return false;
    }
  }
}

module.exports = BaseService;
