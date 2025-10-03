import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { useUI } from '../../store/slices/uiSlice';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { LayoutProps, MenuItem } from '../../types/ui';
import { Permission } from '../../types/auth';
import { generateBreadcrumbs, getPageTitle } from '../../utils/navigationUtils';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Breadcrumb from './Breadcrumb';
import './AppLayout.css';

// Menu configuration with role-based filtering
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'users',
    path: '/users',
    requiredPermission: Permission.USER_READ
  },
  {
    id: 'buildings',
    label: 'Buildings',
    icon: 'building',
    path: '/buildings',
    requiredPermission: Permission.BUILDING_READ
  },
  {
    id: 'equipment',
    label: 'Equipment',
    icon: 'equipment',
    path: '/equipment',
    requiredPermission: Permission.EQUIPMENT_READ
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: 'contacts',
    path: '/contacts',
    requiredPermission: Permission.CONTACT_READ
  },
  {
    id: 'meters',
    label: 'Meters',
    icon: 'meter',
    path: '/meters',
    requiredPermission: Permission.METER_READ
  },
  {
    id: 'templates',
    label: 'Email Templates',
    icon: 'template',
    path: '/templates',
    requiredPermission: Permission.TEMPLATE_READ
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    requiredPermission: Permission.SETTINGS_READ
  }
];

const AppLayout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  breadcrumbs, 
  loading = false 
}) => {
  const { user, logout, checkPermission } = useAuth();
  const location = useLocation();
  const { isMobile } = useResponsive();
  // Use persisted UI store for sidebar state so preference is remembered
  const { sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen } = useUI();

  // Generate page title and breadcrumbs from route if not provided
  const pageTitle = title || getPageTitle(location.pathname);
  const pageBreadcrumbs = breadcrumbs || generateBreadcrumbs(location.pathname);

  // Set document title
  usePageTitle(pageTitle);

  // Auto-collapse sidebar on mobile and tablet
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, setSidebarCollapsed]);

  // Note: sidebarCollapsed is persisted in UI store; we intentionally
  // do not override it on login so the app remembers the user's last state.

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return checkPermission(item.requiredPermission as any);
  });

  const handleToggleSidebar = () => {
    console.debug('[AppLayout] handleToggleSidebar called, isMobile=', isMobile, 'sidebarCollapsed=', sidebarCollapsed);
    if (isMobile) {
      // On mobile, toggle mobile nav instead of sidebar
      setMobileNavOpen(!mobileNavOpen);
    } else {
      // On desktop/tablet, toggle sidebar collapse
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleNavigate = () => {
    // Close mobile nav after navigation
    if (isMobile) {
      setMobileNavOpen(false);
    }
  };

  // Debug: log when sidebarCollapsed changes so we can trace unexpected toggles
  useEffect(() => {
    console.debug('[AppLayout] sidebarCollapsed changed ->', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const handleCloseMobileNav = () => {
    setMobileNavOpen(false);
  };

  return (
    <div className={`app-layout ${!isMobile && sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <Header
        title={pageTitle}
        user={user ? {
          name: user.name,
          email: user.email
        } : undefined}
        notifications={[]} // TODO: Implement notifications
        onLogout={logout}
        onToggleSidebar={handleToggleSidebar}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div className="app-layout__body">
        {/* Desktop/Tablet Sidebar */}
        {!isMobile && (
          <Sidebar
            isCollapsed={sidebarCollapsed}
            isMobile={isMobile}
            menuItems={filteredMenuItems}
            currentPath={location.pathname}
            onToggle={handleToggleSidebar}
            onNavigate={handleNavigate}
          />
        )}

        {/* Mobile Navigation */}
        <MobileNav
          isOpen={mobileNavOpen}
          onClose={handleCloseMobileNav}
          menuItems={filteredMenuItems}
        />

        {/* Content Area */}
        <main className={`app-layout__content ${!isMobile && sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
          {/* Breadcrumbs */}
          {pageBreadcrumbs && pageBreadcrumbs.length > 1 && (
            <div className="app-layout__breadcrumbs">
              <Breadcrumb items={pageBreadcrumbs} />
            </div>
          )}


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

export default AppLayout;