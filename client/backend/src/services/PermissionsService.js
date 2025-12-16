/**
 * PermissionsService
 * Centralized service for managing role-to-permission mappings
 * Provides methods to generate, validate, and convert permissions between formats
 */

class PermissionsService {
  /**
   * Define all available modules in the system
   */
  static MODULES = ['user', 'meter', 'device', 'location', 'contact', 'template', 'settings'];

  /**
   * Define all available actions per module
   */
  static ACTIONS = {
    user: ['create', 'read', 'update', 'delete'],
    meter: ['create', 'read', 'update', 'delete'],
    device: ['create', 'read', 'update', 'delete'],
    location: ['create', 'read', 'update', 'delete'],
    contact: ['create', 'read', 'update', 'delete'],
    template: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update']
  };

  /**
   * Role-to-permission mappings as nested objects
   * Format: { module: { action: boolean } }
   */
  static ROLE_PERMISSIONS = {
    admin: {
      user: { create: true, read: true, update: true, delete: true },
      meter: { create: true, read: true, update: true, delete: true },
      device: { create: true, read: true, update: true, delete: true },
      location: { create: true, read: true, update: true, delete: true },
      contact: { create: true, read: true, update: true, delete: true },
      template: { create: true, read: true, update: true, delete: true },
      settings: { read: true, update: true }
    },
    manager: {
      user: { create: true, read: true, update: true, delete: false },
      meter: { create: true, read: true, update: true, delete: true },
      device: { create: true, read: true, update: true, delete: true },
      location: { create: true, read: true, update: true, delete: true },
      contact: { create: true, read: true, update: true, delete: true },
      template: { create: true, read: true, update: true, delete: true },
      settings: { read: true, update: true }
    },
    technician: {
      user: { create: false, read: true, update: false, delete: false },
      meter: { create: true, read: true, update: true, delete: true },
      device: { create: true, read: true, update: true, delete: true },
      location: { create: false, read: true, update: false, delete: false },
      contact: { create: false, read: true, update: false, delete: false },
      template: { create: false, read: true, update: false, delete: false },
      settings: { read: true, update: false }
    },
    viewer: {
      user: { create: false, read: true, update: false, delete: false },
      meter: { create: false, read: true, update: false, delete: false },
      device: { create: false, read: true, update: false, delete: false },
      location: { create: false, read: true, update: false, delete: false },
      contact: { create: false, read: true, update: false, delete: false },
      template: { create: false, read: true, update: false, delete: false },
      settings: { read: true, update: false }
    }
  };

  /**
   * Get permissions object for a given role
   * @param {string} role - User role (admin, manager, technician, viewer)
   * @returns {Object} Nested permissions object { module: { action: boolean } }
   */
  static getPermissionsByRole(role) {
    const normalizedRole = (role || 'viewer').toLowerCase();
    
    // Return role permissions or default to viewer
    if (this.ROLE_PERMISSIONS[normalizedRole]) {
      return JSON.parse(JSON.stringify(this.ROLE_PERMISSIONS[normalizedRole]));
    }
    
    return JSON.parse(JSON.stringify(this.ROLE_PERMISSIONS.viewer));
  }

  /**
   * Convert nested permissions object to flat array format
   * @param {Object} permissionsObj - Nested permissions object
   * @returns {Array<string>} Flat array of permissions (e.g., ['user:create', 'meter:read'])
   */
  static toFlatArray(permissionsObj) {
    if (!permissionsObj || typeof permissionsObj !== 'object') {
      return [];
    }

    const flatArray = [];
    
    for (const [module, actions] of Object.entries(permissionsObj)) {
      if (typeof actions === 'object' && actions !== null) {
        for (const [action, allowed] of Object.entries(actions)) {
          if (allowed === true) {
            flatArray.push(`${module}:${action}`);
          }
        }
      }
    }
    
    return flatArray;
  }

  /**
   * Convert flat array format to nested permissions object
   * @param {Array<string>} flatArray - Flat array of permissions
   * @returns {Object} Nested permissions object
   */
  static toNestedObject(flatArray) {
    if (!Array.isArray(flatArray)) {
      return {};
    }

    const nestedObj = {};
    
    // Initialize all modules with all actions set to false
    for (const module of this.MODULES) {
      nestedObj[module] = {};
      for (const action of this.ACTIONS[module] || []) {
        nestedObj[module][action] = false;
      }
    }
    
    // Set permissions from flat array
    for (const permission of flatArray) {
      const [module, action] = permission.split(':');
      if (module && action && nestedObj[module] && action in nestedObj[module]) {
        nestedObj[module][action] = true;
      }
    }
    
    return nestedObj;
  }

  /**
   * Validate permissions object structure
   * @param {Object} permissionsObj - Permissions object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validatePermissionsObject(permissionsObj) {
    if (!permissionsObj || typeof permissionsObj !== 'object' || Array.isArray(permissionsObj)) {
      return false;
    }

    // Check that all required modules are present
    for (const module of this.MODULES) {
      if (!(module in permissionsObj)) {
        return false;
      }

      const actions = permissionsObj[module];
      if (typeof actions !== 'object' || actions === null || Array.isArray(actions)) {
        return false;
      }

      // Check that all required actions for this module are present
      const expectedActions = this.ACTIONS[module] || [];
      for (const action of expectedActions) {
        if (!(action in actions)) {
          return false;
        }

        if (typeof actions[action] !== 'boolean') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get all available modules
   * @returns {Array<string>} List of module names
   */
  static getAvailableModules() {
    return [...this.MODULES];
  }

  /**
   * Get all available actions for a module
   * @param {string} module - Module name
   * @returns {Array<string>} List of action names
   */
  static getAvailableActions(module) {
    if (module in this.ACTIONS) {
      return [...this.ACTIONS[module]];
    }
    return [];
  }

  /**
   * Get all available roles
   * @returns {Array<string>} List of role names
   */
  static getAvailableRoles() {
    return Object.keys(this.ROLE_PERMISSIONS);
  }
}

module.exports = PermissionsService;
