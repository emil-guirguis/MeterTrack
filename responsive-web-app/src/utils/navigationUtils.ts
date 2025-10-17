import type { BreadcrumbItem } from '../types/ui';

// Route configuration for breadcrumb generation
export interface RouteInfo {
  path: string;
  label: string;
  icon?: string;
  parent?: string;
}

// Define route information for breadcrumb generation
export const ROUTE_INFO: Record<string, RouteInfo> = {
  '/dashboard': {
    path: '/dashboard',
    label: 'Dashboard',
    icon: '📊'
  },
  '/users': {
    path: '/users',
    label: 'Users',
    icon: '👥',
    parent: '/dashboard'
  },
  '/users/create': {
    path: '/users/create',
    label: 'Create User',
    icon: '➕',
    parent: '/users'
  },
  '/users/:id': {
    path: '/users/:id',
    label: 'User Details',
    icon: '👤',
    parent: '/users'
  },
  '/users/:id/edit': {
    path: '/users/:id/edit',
    label: 'Edit User',
    icon: '✏️',
    parent: '/users/:id'
  },
  '/locations': {
    path: '/locations',
    label: 'Locations',
    icon: '🏢',
    parent: '/dashboard'
  },
  '/locations/create': {
    path: '/locations/create',
    label: 'Create Location',
    icon: '➕',
    parent: '/locations'
  },
  '/locations/:id': {
    path: '/locations/:id',
    label: 'Location Details',
    icon: '🏢',
    parent: '/locations'
  },
  '/locations/:id/edit': {
    path: '/locations/:id/edit',
    label: 'Edit Location',
    icon: '✏️',
    parent: '/locations/:id'
  },
  '/equipment': {
    path: '/equipment',
    label: 'Equipment',
    icon: '⚙️',
    parent: '/dashboard'
  },
  '/equipment/create': {
    path: '/equipment/create',
    label: 'Create Equipment',
    icon: '➕',
    parent: '/equipment'
  },
  '/equipment/:id': {
    path: '/equipment/:id',
    label: 'Equipment Details',
    icon: '⚙️',
    parent: '/equipment'
  },
  '/equipment/:id/edit': {
    path: '/equipment/:id/edit',
    label: 'Edit Equipment',
    icon: '✏️',
    parent: '/equipment/:id'
  },
  '/contacts': {
    path: '/contacts',
    label: 'Contacts',
    icon: '📞',
    parent: '/dashboard'
  },
  '/contacts/create': {
    path: '/contacts/create',
    label: 'Create Contact',
    icon: '➕',
    parent: '/contacts'
  },
  '/contacts/:id': {
    path: '/contacts/:id',
    label: 'Contact Details',
    icon: '📞',
    parent: '/contacts'
  },
  '/contacts/:id/edit': {
    path: '/contacts/:id/edit',
    label: 'Edit Contact',
    icon: '✏️',
    parent: '/contacts/:id'
  },
  '/meters': {
    path: '/meters',
    label: 'Meters',
    icon: '📏',
    parent: '/dashboard'
  },
  '/meters/create': {
    path: '/meters/create',
    label: 'Create Meter',
    icon: '➕',
    parent: '/meters'
  },
  '/meters/:id': {
    path: '/meters/:id',
    label: 'Meter Details',
    icon: '📏',
    parent: '/meters'
  },
  '/meters/:id/edit': {
    path: '/meters/:id/edit',
    label: 'Edit Meter',
    icon: '✏️',
    parent: '/meters/:id'
  },
  '/meter-readings': {
    path: '/meter-readings',
    label: 'Meter Readings',
    icon: '📊',
    parent: '/dashboard'
  },
  '/templates': {
    path: '/templates',
    label: 'Email Templates',
    icon: '📧',
    parent: '/dashboard'
  },
  '/templates/create': {
    path: '/templates/create',
    label: 'Create Template',
    icon: '➕',
    parent: '/templates'
  },
  '/templates/:id': {
    path: '/templates/:id',
    label: 'Template Details',
    icon: '📧',
    parent: '/templates'
  },
  '/templates/:id/edit': {
    path: '/templates/:id/edit',
    label: 'Edit Template',
    icon: '✏️',
    parent: '/templates/:id'
  },
  '/settings': {
    path: '/settings',
    label: 'Settings',
    icon: '⚙️',
    parent: '/dashboard'
  },
  '/settings/company': {
    path: '/settings/company',
    label: 'Company Settings',
    icon: '🏢',
    parent: '/settings'
  },
  '/settings/users': {
    path: '/settings/users',
    label: 'User Settings',
    icon: '👥',
    parent: '/settings'
  },
  '/settings/system': {
    path: '/settings/system',
    label: 'System Settings',
    icon: '🔧',
    parent: '/settings'
  }
};

/**
 * Match a dynamic route pattern with actual path
 * @param pattern - Route pattern with parameters (e.g., '/users/:id')
 * @param path - Actual path (e.g., '/users/123')
 * @returns Whether the path matches the pattern
 */
export const matchRoute = (pattern: string, path: string): boolean => {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  return patternParts.every((part, index) => {
    return part.startsWith(':') || part === pathParts[index];
  });
};

/**
 * Find route info for a given path
 * @param path - Current path
 * @returns Route info or null if not found
 */
export const findRouteInfo = (path: string): RouteInfo | null => {
  // First try exact match
  if (ROUTE_INFO[path]) {
    return ROUTE_INFO[path];
  }

  // Then try pattern matching
  for (const [pattern, info] of Object.entries(ROUTE_INFO)) {
    if (matchRoute(pattern, path)) {
      return info;
    }
  }

  return null;
};

/**
 * Generate breadcrumbs for a given path
 * @param currentPath - Current route path
 * @param customLabels - Custom labels for dynamic segments
 * @returns Array of breadcrumb items
 */
export const generateBreadcrumbs = (
  currentPath: string,
  customLabels: Record<string, string> = {}
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  const visited = new Set<string>();

  const buildBreadcrumb = (path: string): void => {
    if (visited.has(path)) return; // Prevent infinite loops
    visited.add(path);

    const routeInfo = findRouteInfo(path);
    if (!routeInfo) return;

    // Recursively build parent breadcrumbs
    if (routeInfo.parent) {
      buildBreadcrumb(routeInfo.parent);
    }

    // Create breadcrumb item
    let label = routeInfo.label;

    // Apply custom labels for dynamic segments
    if (path.includes(':')) {
      const pathParts = currentPath.split('/');
      const patternParts = routeInfo.path.split('/');

      patternParts.forEach((part, index) => {
        if (part.startsWith(':')) {
          const paramName = part.substring(1);
          const paramValue = pathParts[index];

          if (customLabels[paramName]) {
            label = customLabels[paramName];
          } else if (paramValue) {
            // Use the actual value if no custom label provided
            label = paramValue;
          }
        }
      });
    }

    breadcrumbs.push({
      label,
      path: path === currentPath ? undefined : path, // Current page has no link
      icon: routeInfo.icon
    });
  };

  buildBreadcrumb(currentPath);
  return breadcrumbs;
};

/**
 * Get page title from route
 * @param path - Current route path
 * @param customLabels - Custom labels for dynamic segments
 * @returns Page title
 */
export const getPageTitle = (
  path: string,
  customLabels: Record<string, string> = {}
): string => {
  const routeInfo = findRouteInfo(path);
  if (!routeInfo) {
    // Fallback: generate title from path
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
      : 'Page';
  }

  let title = routeInfo.label;

  // Apply custom labels for dynamic segments
  if (path.includes(':')) {
    const pathParts = path.split('/');
    const patternParts = routeInfo.path.split('/');

    patternParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.substring(1);
        const paramValue = pathParts[index];

        if (customLabels[paramName]) {
          title = customLabels[paramName];
        } else if (paramValue) {
          title = paramValue;
        }
      }
    });
  }

  return title;
};

/**
 * Check if user can go back in browser history
 * @returns Whether back navigation is possible
 */
export const canGoBack = (): boolean => {
  return window.history.length > 1;
};

/**
 * Navigate back in browser history
 */
export const goBack = (): void => {
  if (canGoBack()) {
    window.history.back();
  }
};

/**
 * Get navigation state for current location
 * @param currentPath - Current route path
 * @param customLabels - Custom labels for dynamic segments
 * @returns Navigation state object
 */
export const getNavigationState = (
  currentPath: string,
  customLabels: Record<string, string> = {}
) => {
  return {
    currentPath,
    breadcrumbs: generateBreadcrumbs(currentPath, customLabels),
    title: getPageTitle(currentPath, customLabels),
    canGoBack: canGoBack()
  };
};