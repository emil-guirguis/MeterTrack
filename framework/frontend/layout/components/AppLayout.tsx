import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LayoutProps, MenuItem } from '../types';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';
import { MobileNav } from './MobileNav.tsx';
import './AppLayout.css';

export interface AppLayoutConfig {
  /** Menu items for navigation */
  menuItems: MenuItem[];
  /** Sidebar branding configuration */
  sidebarBrand: {
    icon: string;
    text: string;
  };
  /** User information */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  /** Notifications array */
  notifications?: any[];
  /** Logout handler */
  onLogout: () => void;
  /** Permission checker function */
  checkPermission: (permission?: string) => boolean;
  /** Responsive hooks */
  responsive: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    showSidebarInHeader: boolean;
  };
  /** UI state management */
  uiState: {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    mobileNavOpen: boolean;
    setMobileNavOpen: (open: boolean) => void;
  };
  /** Optional page title hook */
  usePageTitle?: (title: string) => void;
  /** Optional breadcrumb generator */
  generateBreadcrumbs?: (pathname: string) => any[];
  /** Optional page title generator */
  getPageTitle?: (pathname: string) => string;
}

export interface AppLayoutProps extends LayoutProps {
  config: AppLayoutConfig;
}

/**
 * AppLayout Component
 * 
 * Framework-provided layout component that handles:
 * - Responsive header, sidebar, and mobile navigation
 * - Breadcrumb navigation
 * - User menu and notifications
 * - Sidebar collapse/expand state
 * 
 * Client apps should provide configuration via the config prop.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  breadcrumbs,
  loading = false,
  config
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    menuItems,
    sidebarBrand,
    user,
    notifications = [],
    onLogout,
    checkPermission,
    responsive,
    uiState,
    usePageTitle,
    generateBreadcrumbs,
    getPageTitle
  } = config;

  const { isMobile, isTablet, isDesktop } = responsive;
  const { sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen } = uiState;

  // Generate page title and breadcrumbs from route if not provided
  const pageTitle = title || (getPageTitle ? getPageTitle(location.pathname) : 'Dashboard');

  // Set document title
  if (usePageTitle) {
    usePageTitle(pageTitle);
  }

  // Auto-collapse sidebar on mobile and tablet
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, setSidebarCollapsed]);

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return checkPermission(item.requiredPermission);
  });

  const handleToggleSidebar = () => {
    // Below 1024px: Always use mobile nav overlay
    if (isMobile || isTablet) {
      setMobileNavOpen(!mobileNavOpen);
    } else {
      // Desktop (≥1024px): Toggle sidebar collapse
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleNavigate = (path: string) => {
    // Navigate to the path
    navigate(path);
    // Close mobile nav after navigation
    if (isMobile) {
      setMobileNavOpen(false);
    }
  };

  const handleCloseMobileNav = () => {
    setMobileNavOpen(false);
  };

  return (
    <div className={`app-layout ${!isMobile && sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <Header
        title={pageTitle}
        user={user}
        notifications={notifications}
        onLogout={onLogout}
        onToggleSidebar={handleToggleSidebar}
        isMobile={isMobile}
        showSidebarElements={true}
        sidebarBrand={sidebarBrand}
        sidebarCollapsed={sidebarCollapsed || !isDesktop}
      />

      {/* Main Content Area */}
      <div className="app-layout__body">
        {/* Desktop Sidebar (≥1024px only) */}
        {isDesktop && (
          <Sidebar
            isCollapsed={sidebarCollapsed}
            isMobile={false}
            menuItems={filteredMenuItems}
            currentPath={location.pathname}
            onToggle={handleToggleSidebar}
            onNavigate={handleNavigate}
          />
        )}

        {/* Mobile/Tablet Navigation (<1024px) */}
        {(isMobile || isTablet) && (
          <MobileNav
            isOpen={mobileNavOpen}
            onClose={handleCloseMobileNav}
            menuItems={filteredMenuItems}
            currentPath={location.pathname}
            onNavigate={handleNavigate}
          />
        )}

        {/* Content Area */}
        <main className={`app-layout__content ${!isMobile && sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
          {/* Page Content */}
          <div className="app-layout__page-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <span>Loading...</span>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
