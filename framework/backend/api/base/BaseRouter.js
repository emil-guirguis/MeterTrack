/**
 * Base Router Class
 * Provides standardized router setup and common route patterns
 */

const express = require('express');
const { logger } = require('../../shared/utils/logging');

class BaseRouter {
  /**
   * Create a new BaseRouter instance
   * @param {import('../types/router').RouterConfig} config - Router configuration
   */
  constructor(config) {
    const {
      basePath = '/',
      requireAuth = true,
      middleware = [],
      validation = {},
      permissions = {}
    } = config;

    this.basePath = basePath;
    this.requireAuth = requireAuth;
    this.globalMiddleware = middleware;
    this.validation = validation;
    this.permissions = permissions;
    this.logger = logger;

    // Create Express router
    this.router = express.Router();

    // Apply global middleware
    this.applyGlobalMiddleware();
  }

  /**
   * Apply global middleware to router
   */
  applyGlobalMiddleware() {
    this.globalMiddleware.forEach(middleware => {
      this.router.use(middleware);
    });
  }

  /**
   * Get the Express router instance
   * @returns {express.Router}
   */
  getRouter() {
    return this.router;
  }

  /**
   * Register a route
   * @param {import('../types/router').RouteDefinition} definition - Route definition
   */
  registerRoute(definition) {
    const {
      method,
      path,
      handler,
      middleware = [],
      validation,
      requireAuth,
      permissions,
      description
    } = definition;

    const routeMiddleware = [...middleware];

    // Add authentication middleware if required
    if (requireAuth !== false && this.requireAuth) {
      // Auth middleware should be added by the implementing class
      // This is a placeholder for the pattern
    }

    // Add validation middleware if provided
    if (validation) {
      // Validation middleware should be added by the implementing class
      // This is a placeholder for the pattern
    }

    // Add permission check middleware if provided
    if (permissions && permissions.length > 0) {
      // Permission middleware should be added by the implementing class
      // This is a placeholder for the pattern
    }

    // Register the route
    const httpMethod = method.toLowerCase();
    this.router[httpMethod](path, ...routeMiddleware, handler);

    this.logger.debug(`Registered route: ${method} ${this.basePath}${path}`, {
      description,
      requireAuth: requireAuth !== false && this.requireAuth,
      permissions
    });
  }

  /**
   * Register multiple routes
   * @param {Array<import('../types/router').RouteDefinition>} routes - Array of route definitions
   */
  registerRoutes(routes) {
    routes.forEach(route => this.registerRoute(route));
  }

  /**
   * Register standard CRUD routes for a controller
   * @param {Object} controller - Controller instance with CRUD methods
   * @param {import('../types/router').CrudRouteOptions} [options] - CRUD route options
   */
  registerCrudRoutes(controller, options = {}) {
    const {
      list = true,
      get = true,
      create = true,
      update = true,
      delete: enableDelete = true,
      validation = {},
      searchFields = [],
      idParam = 'id'
    } = options;

    const routes = [];

    // List route (GET /)
    if (list) {
      routes.push({
        method: 'GET',
        path: '/',
        handler: controller.list,
        validation: validation.list,
        description: 'List items with pagination and filtering'
      });
    }

    // Get route (GET /:id)
    if (get) {
      routes.push({
        method: 'GET',
        path: `/:${idParam}`,
        handler: controller.get,
        validation: validation.get,
        description: 'Get a single item by ID'
      });
    }

    // Create route (POST /)
    if (create) {
      routes.push({
        method: 'POST',
        path: '/',
        handler: controller.create,
        validation: validation.create,
        description: 'Create a new item'
      });
    }

    // Update route (PUT /:id)
    if (update) {
      routes.push({
        method: 'PUT',
        path: `/:${idParam}`,
        handler: controller.update,
        validation: validation.update,
        description: 'Update an existing item'
      });
    }

    // Delete route (DELETE /:id)
    if (enableDelete) {
      routes.push({
        method: 'DELETE',
        path: `/:${idParam}`,
        handler: controller.delete,
        validation: validation.delete,
        description: 'Delete an item'
      });
    }

    this.registerRoutes(routes);
  }

  /**
   * Register bulk operation routes
   * @param {Object} controller - Controller instance with bulk methods
   */
  registerBulkRoutes(controller) {
    const routes = [
      {
        method: 'POST',
        path: '/bulk',
        handler: controller.bulkCreate,
        description: 'Bulk create items'
      },
      {
        method: 'PUT',
        path: '/bulk',
        handler: controller.bulkUpdate,
        description: 'Bulk update items'
      },
      {
        method: 'DELETE',
        path: '/bulk',
        handler: controller.bulkDelete,
        description: 'Bulk delete items'
      }
    ];

    this.registerRoutes(routes);
  }

  /**
   * Add middleware to specific routes
   * @param {string} path - Route path
   * @param {Array<Function>} middleware - Middleware functions
   */
  use(path, ...middleware) {
    this.router.use(path, ...middleware);
  }

  /**
   * Create a GET route
   * @param {string} path - Route path
   * @param {Function} handler - Route handler
   * @param {Array<Function>} [middleware] - Route middleware
   */
  get(path, handler, middleware = []) {
    this.registerRoute({
      method: 'GET',
      path,
      handler,
      middleware
    });
  }

  /**
   * Create a POST route
   * @param {string} path - Route path
   * @param {Function} handler - Route handler
   * @param {Array<Function>} [middleware] - Route middleware
   */
  post(path, handler, middleware = []) {
    this.registerRoute({
      method: 'POST',
      path,
      handler,
      middleware
    });
  }

  /**
   * Create a PUT route
   * @param {string} path - Route path
   * @param {Function} handler - Route handler
   * @param {Array<Function>} [middleware] - Route middleware
   */
  put(path, handler, middleware = []) {
    this.registerRoute({
      method: 'PUT',
      path,
      handler,
      middleware
    });
  }

  /**
   * Create a DELETE route
   * @param {string} path - Route path
   * @param {Function} handler - Route handler
   * @param {Array<Function>} [middleware] - Route middleware
   */
  delete(path, handler, middleware = []) {
    this.registerRoute({
      method: 'DELETE',
      path,
      handler,
      middleware
    });
  }

  /**
   * Create a PATCH route
   * @param {string} path - Route path
   * @param {Function} handler - Route handler
   * @param {Array<Function>} [middleware] - Route middleware
   */
  patch(path, handler, middleware = []) {
    this.registerRoute({
      method: 'PATCH',
      path,
      handler,
      middleware
    });
  }
}

module.exports = BaseRouter;
