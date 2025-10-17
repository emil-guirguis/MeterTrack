// UI Store Slice

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UIStoreSlice, Notification, HeaderLayout, SidebarHeaderConfig } from '../types';
import { generateId } from '../utils';

// Initial state
const initialState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
  notifications: [],
  modals: {},
  loading: {},
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  // Responsive header initial state
  headerLayout: {
    left: {
      visible: false,
      elements: ['menu-toggle', 'brand'],
    },
    center: {
      visible: true,
      content: 'title',
    },
    right: {
      visible: true,
      elements: ['notifications', 'user-menu'],
    },
  } as HeaderLayout,
  showSidebarInHeader: false,
  isTransitioning: false,
  lastBreakpoint: 'desktop' as 'mobile' | 'tablet' | 'desktop',
  sidebarHeaderConfig: {
    brand: {
      icon: '🏢',
      text: 'MeterIt',
      showIcon: true,
      showText: true,
    },
    toggle: {
      position: 'left',
      style: 'hamburger',
      ariaLabel: 'Toggle navigation menu',
    },
    responsive: {
      hideOnDesktop: true,
      showInHeaderBelow: 1024,
      animationDuration: 300,
    },
  } as SidebarHeaderConfig,
};

export const useUIStore = create<UIStoreSlice>()(
  persist(
    immer((set, get) => ({
      ...initialState,



      // Sidebar actions
      toggleSidebar: () => {
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
          try {
            // Use error-level logging to bypass common console filtering
            console.error('[uiSlice] toggleSidebar ->', state.sidebarCollapsed);
            console.trace();
          } catch (e) {
            // ignore in non-browser envs
          }
        });
      },

      setSidebarCollapsed: (collapsed) => {
        set((state) => {
          state.sidebarCollapsed = collapsed;
          try {
            console.error('[uiSlice] setSidebarCollapsed ->', collapsed);
            console.trace();
          } catch (e) {
            // ignore
          }
        });
      },

      // Mobile navigation actions
      setMobileNavOpen: (open) => {
        set((state) => {
          state.mobileNavOpen = open;
        });
      },

      // Notification actions
      addNotification: (notification) => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: new Date(),
          read: false,
        };

        set((state) => {
          state.notifications.unshift(newNotification);
          
          // Limit to 50 notifications
          if (state.notifications.length > 50) {
            state.notifications = state.notifications.slice(0, 50);
          }
        });

        // Auto-remove notification after duration
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }

        return id;
      },

      removeNotification: (id) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      markNotificationRead: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification) {
            notification.read = true;
          }
        });
      },

      clearNotifications: () => {
        set((state) => {
          state.notifications = [];
        });
      },

      // Modal actions
      openModal: (modalId, data) => {
        set((state) => {
          state.modals[modalId] = {
            isOpen: true,
            data,
            loading: false,
            error: null,
          };
        });
      },

      closeModal: (modalId) => {
        set((state) => {
          if (state.modals[modalId]) {
            state.modals[modalId].isOpen = false;
            state.modals[modalId].data = undefined;
            state.modals[modalId].error = null;
          }
        });
      },

      setModalLoading: (modalId, loading) => {
        set((state) => {
          if (state.modals[modalId]) {
            state.modals[modalId].loading = loading;
          }
        });
      },

      setModalError: (modalId, error) => {
        set((state) => {
          if (state.modals[modalId]) {
            state.modals[modalId].error = error;
            state.modals[modalId].loading = false;
          }
        });
      },

      // Global loading actions
      setGlobalLoading: (key, loading) => {
        set((state) => {
          if (loading) {
            state.loading[key] = true;
          } else {
            delete state.loading[key];
          }
        });
      },

      // Screen size actions
      setScreenSize: (isMobile, isTablet, isDesktop) => {
        set((state) => {
          state.isMobile = isMobile;
          state.isTablet = isTablet;
          state.isDesktop = isDesktop;
          
          // Auto-collapse sidebar on mobile
          if (isMobile && !state.sidebarCollapsed) {
            state.sidebarCollapsed = true;
          }
        });
      },

      // Responsive header actions
      setHeaderLayout: (layout) => {
        set((state) => {
          state.headerLayout = layout;
        });
      },

      setShowSidebarInHeader: (show) => {
        set((state) => {
          state.showSidebarInHeader = show;
          
          // Update header layout based on sidebar visibility
          if (show) {
            state.headerLayout.left.visible = true;
            state.headerLayout.left.elements = ['menu-toggle', 'brand'];
          } else {
            state.headerLayout.left.visible = false;
            state.headerLayout.left.elements = [];
          }
        });
      },

      setTransitioning: (transitioning) => {
        set((state) => {
          state.isTransitioning = transitioning;
        });
      },

      updateBreakpoint: (breakpoint) => {
        set((state) => {
          state.lastBreakpoint = breakpoint;
          
          // Update header layout based on breakpoint
          const shouldShowInHeader = breakpoint !== 'desktop';
          if (shouldShowInHeader !== state.showSidebarInHeader) {
            state.showSidebarInHeader = shouldShowInHeader;
            
            if (shouldShowInHeader) {
              state.headerLayout.left.visible = true;
              state.headerLayout.left.elements = ['menu-toggle', 'brand'];
              state.headerLayout.center.visible = true;
              state.headerLayout.center.content = 'title';
            } else {
              state.headerLayout.left.visible = false;
              state.headerLayout.left.elements = [];
              state.headerLayout.center.visible = true;
              state.headerLayout.center.content = null;
            }
          }
        });
      },

      setSidebarHeaderConfig: (config) => {
        set((state) => {
          state.sidebarHeaderConfig = {
            ...state.sidebarHeaderConfig,
            ...config,
            brand: config.brand ? { ...state.sidebarHeaderConfig.brand, ...config.brand } : state.sidebarHeaderConfig.brand,
            toggle: config.toggle ? { ...state.sidebarHeaderConfig.toggle, ...config.toggle } : state.sidebarHeaderConfig.toggle,
            responsive: config.responsive ? { ...state.sidebarHeaderConfig.responsive, ...config.responsive } : state.sidebarHeaderConfig.responsive,
          };
        });
      },
    })),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      version: 1,
    }
  )
);

// Selectors
export const uiSelectors = {
  sidebarCollapsed: (state: UIStoreSlice) => state.sidebarCollapsed,
  mobileNavOpen: (state: UIStoreSlice) => state.mobileNavOpen,
  notifications: (state: UIStoreSlice) => state.notifications,
  modals: (state: UIStoreSlice) => state.modals,
  loading: (state: UIStoreSlice) => state.loading,
  screenSize: (state: UIStoreSlice) => ({
    isMobile: state.isMobile,
    isTablet: state.isTablet,
    isDesktop: state.isDesktop,
  }),
  
  // Responsive header selectors
  headerLayout: (state: UIStoreSlice) => state.headerLayout,
  showSidebarInHeader: (state: UIStoreSlice) => state.showSidebarInHeader,
  isTransitioning: (state: UIStoreSlice) => state.isTransitioning,
  lastBreakpoint: (state: UIStoreSlice) => state.lastBreakpoint,
  sidebarHeaderConfig: (state: UIStoreSlice) => state.sidebarHeaderConfig,
  
  // Computed selectors
  unreadNotifications: (state: UIStoreSlice) => 
    state.notifications.filter(n => !n.read),
  
  unreadCount: (state: UIStoreSlice) => 
    state.notifications.filter(n => !n.read).length,
  
  isModalOpen: (modalId: string) => (state: UIStoreSlice) => 
    state.modals[modalId]?.isOpen ?? false,
  
  getModalData: (modalId: string) => (state: UIStoreSlice) => 
    state.modals[modalId]?.data,
  
  isModalLoading: (modalId: string) => (state: UIStoreSlice) => 
    state.modals[modalId]?.loading ?? false,
  
  getModalError: (modalId: string) => (state: UIStoreSlice) => 
    state.modals[modalId]?.error,
  
  isGlobalLoading: (state: UIStoreSlice) => 
    Object.keys(state.loading).length > 0,
  
  getLoadingKeys: (state: UIStoreSlice) => 
    Object.keys(state.loading),
  
  // Responsive header computed selectors
  shouldShowSidebarInHeader: (state: UIStoreSlice) => 
    !state.isDesktop && state.showSidebarInHeader,
  
  headerLeftElements: (state: UIStoreSlice) => 
    state.headerLayout.left.visible ? state.headerLayout.left.elements : [],
  
  headerCenterContent: (state: UIStoreSlice) => 
    state.headerLayout.center.visible ? state.headerLayout.center.content : null,
  
  headerRightElements: (state: UIStoreSlice) => 
    state.headerLayout.right.visible ? state.headerLayout.right.elements : [],
};

// Notification helpers
export const notificationHelpers = {
  success: (title: string, message?: string, duration = 5000) => ({
    type: 'success' as const,
    title,
    message,
    duration,
  }),
  
  error: (title: string, message?: string, duration = 0) => ({
    type: 'error' as const,
    title,
    message,
    duration, // 0 means no auto-dismiss
  }),
  
  warning: (title: string, message?: string, duration = 7000) => ({
    type: 'warning' as const,
    title,
    message,
    duration,
  }),
  
  info: (title: string, message?: string, duration = 5000) => ({
    type: 'info' as const,
    title,
    message,
    duration,
  }),
};

// Hook for easy access to UI state and actions
export const useUI = () => {
  const store = useUIStore();
  
  return {
    // State
    sidebarCollapsed: store.sidebarCollapsed,
    mobileNavOpen: store.mobileNavOpen,
    notifications: store.notifications,
    screenSize: uiSelectors.screenSize(store),
    
    // Responsive header state
    headerLayout: store.headerLayout,
    showSidebarInHeader: store.showSidebarInHeader,
    isTransitioning: store.isTransitioning,
    lastBreakpoint: store.lastBreakpoint,
    sidebarHeaderConfig: store.sidebarHeaderConfig,
    
    // Actions
    toggleSidebar: store.toggleSidebar,
    setSidebarCollapsed: store.setSidebarCollapsed,
    setMobileNavOpen: store.setMobileNavOpen,
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    markNotificationRead: store.markNotificationRead,
    clearNotifications: store.clearNotifications,
    openModal: store.openModal,
    closeModal: store.closeModal,
    setGlobalLoading: store.setGlobalLoading,
    setScreenSize: store.setScreenSize,
    
    // Responsive header actions
    setHeaderLayout: store.setHeaderLayout,
    setShowSidebarInHeader: store.setShowSidebarInHeader,
    setTransitioning: store.setTransitioning,
    updateBreakpoint: store.updateBreakpoint,
    setSidebarHeaderConfig: store.setSidebarHeaderConfig,
    
    // Computed
    unreadCount: uiSelectors.unreadCount(store),
    isGlobalLoading: uiSelectors.isGlobalLoading(store),
    shouldShowSidebarInHeader: uiSelectors.shouldShowSidebarInHeader(store),
    headerLeftElements: uiSelectors.headerLeftElements(store),
    headerCenterContent: uiSelectors.headerCenterContent(store),
    headerRightElements: uiSelectors.headerRightElements(store),
    
    // Helpers
    notify: {
      success: (title: string, message?: string) => 
        store.addNotification(notificationHelpers.success(title, message)),
      error: (title: string, message?: string) => 
        store.addNotification(notificationHelpers.error(title, message)),
      warning: (title: string, message?: string) => 
        store.addNotification(notificationHelpers.warning(title, message)),
      info: (title: string, message?: string) => 
        store.addNotification(notificationHelpers.info(title, message)),
    },
  };
};