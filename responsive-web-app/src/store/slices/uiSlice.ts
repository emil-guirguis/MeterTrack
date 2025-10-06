// UI Store Slice

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UIStoreSlice, Notification } from '../types';
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
    
    // Computed
    unreadCount: uiSelectors.unreadCount(store),
    isGlobalLoading: uiSelectors.isGlobalLoading(store),
    
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