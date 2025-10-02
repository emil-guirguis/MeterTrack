// Company Settings Store

import type { CompanySettings } from '../../types/entities';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';

// Settings store state interface
interface SettingsStoreState {
  settings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

// Settings store actions interface
interface SettingsStoreActions {
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<void>;
  updateBranding: (branding: Partial<CompanySettings['branding']>) => Promise<void>;
  updateSystemConfig: (config: Partial<CompanySettings['systemConfig']>) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Combined store interface
interface SettingsStore extends SettingsStoreState, SettingsStoreActions {}

// Mock service for now - will be replaced with actual API service
const settingsService = {
  async getSettings() {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const mockSettings: CompanySettings = {
        id: '1',
        name: 'Acme Facility Management',
        logo: '/assets/logo.png',
        address: {
          street: '123 Business Center Dr',
          city: 'Business City',
          state: 'BC',
          zipCode: '12345',
          country: 'USA',
        },
        contactInfo: {
          phone: '555-0100',
          email: 'info@acme-fm.com',
          website: 'https://acme-fm.com',
        },
        branding: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          logoUrl: '/assets/logo.png',
          faviconUrl: '/assets/favicon.ico',
          customCSS: '',
          emailSignature: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <p><strong>Acme Facility Management</strong></p>
              <p>123 Business Center Dr<br>Business City, BC 12345</p>
              <p>Phone: 555-0100 | Email: info@acme-fm.com</p>
              <p><a href="https://acme-fm.com">www.acme-fm.com</a></p>
            </div>
          `,
        },
        systemConfig: {
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          currency: 'USD',
          language: 'en',
          defaultPageSize: 20,
          sessionTimeout: 30, // minutes
          enableNotifications: true,
          enableEmailAlerts: true,
          enableSMSAlerts: false,
          maintenanceMode: false,
          allowUserRegistration: false,
          requireEmailVerification: true,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxAge: 90, // days
          },
          backupSettings: {
            enabled: true,
            frequency: 'daily',
            retentionDays: 30,
            includeFiles: true,
          },
        },
        features: {
          userManagement: true,
          buildingManagement: true,
          equipmentManagement: true,
          meterManagement: true,
          contactManagement: true,
          emailTemplates: true,
          reporting: true,
          analytics: true,
          mobileApp: false,
          apiAccess: true,
        },
        integrations: {
          emailProvider: 'smtp',
          smsProvider: null,
          paymentProcessor: null,
          calendarSync: false,
          weatherAPI: false,
          mapProvider: 'google',
        },
        updatedAt: new Date('2024-01-01'),
      };

      return mockSettings;
    });
  },

  async updateSettings(updates: Partial<CompanySettings>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // In real implementation, this would make PUT request
      const updatedSettings: CompanySettings = {
        id: '1',
        name: updates.name || 'Acme Facility Management',
        logo: updates.logo || '/assets/logo.png',
        address: updates.address || {
          street: '123 Business Center Dr',
          city: 'Business City',
          state: 'BC',
          zipCode: '12345',
          country: 'USA',
        },
        contactInfo: updates.contactInfo || {
          phone: '555-0100',
          email: 'info@acme-fm.com',
          website: 'https://acme-fm.com',
        },
        branding: updates.branding || {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          logoUrl: '/assets/logo.png',
          faviconUrl: '/assets/favicon.ico',
          customCSS: '',
          emailSignature: '',
        },
        systemConfig: updates.systemConfig || {
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          currency: 'USD',
          language: 'en',
          defaultPageSize: 20,
          sessionTimeout: 30,
          enableNotifications: true,
          enableEmailAlerts: true,
          enableSMSAlerts: false,
          maintenanceMode: false,
          allowUserRegistration: false,
          requireEmailVerification: true,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxAge: 90,
          },
          backupSettings: {
            enabled: true,
            frequency: 'daily',
            retentionDays: 30,
            includeFiles: true,
          },
        },
        features: updates.features || {
          userManagement: true,
          buildingManagement: true,
          equipmentManagement: true,
          meterManagement: true,
          contactManagement: true,
          emailTemplates: true,
          reporting: true,
          analytics: true,
          mobileApp: false,
          apiAccess: true,
        },
        integrations: updates.integrations || {
          emailProvider: 'smtp',
          smsProvider: null,
          paymentProcessor: null,
          calendarSync: false,
          weatherAPI: false,
          mapProvider: 'google',
        },
        updatedAt: new Date(),
      };

      return updatedSettings;
    });
  },
};

// Initial state
const initialState: SettingsStoreState = {
  settings: null,
  loading: false,
  error: null,
  lastFetch: null,
};

// Create settings store
export const useSettingsStore = create<SettingsStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Actions
      fetchSettings: async () => {
        const state = get();
        
        // Check cache freshness (5 minutes)
        const cacheAge = state.lastFetch ? Date.now() - state.lastFetch : Infinity;
        if (cacheAge < 5 * 60 * 1000 && state.settings) {
          return; // Use cached data
        }

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const settings = await settingsService.getSettings();

          set((state) => {
            state.settings = settings as any;
            state.loading = false;
            state.error = null;
            state.lastFetch = Date.now();
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch settings';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          throw error;
        }
      },

      updateSettings: async (updates) => {
        const state = get();
        const originalSettings = state.settings;

        // Optimistic update
        if (originalSettings) {
          set((state) => {
            state.settings = { ...originalSettings, ...updates } as any;
          });
        }

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const updatedSettings = await settingsService.updateSettings(updates);

          set((state) => {
            state.settings = updatedSettings as any;
            state.loading = false;
            state.error = null;
            state.lastFetch = Date.now();
          });
        } catch (error) {
          // Rollback optimistic update
          if (originalSettings) {
            set((state) => {
              state.settings = originalSettings as any;
            });
          }

          const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
          
          set((state) => {
            state.loading = false;
            state.error = errorMessage;
          });

          throw error;
        }
      },

      updateBranding: async (branding) => {
        const state = get();
        if (!state.settings) {
          throw new Error('Settings not loaded');
        }

        const updates = {
          branding: { ...state.settings.branding, ...branding },
        };

        return get().updateSettings(updates);
      },

      updateSystemConfig: async (config) => {
        const state = get();
        if (!state.settings) {
          throw new Error('Settings not loaded');
        }

        const updates = {
          systemConfig: { ...state.settings.systemConfig, ...config },
        };

        return get().updateSettings(updates);
      },

      setLoading: (loading) => {
        set((state) => {
          state.loading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastFetch: state.lastFetch,
      }),
      version: 1,
    }
  )
);

// Enhanced settings hook
export const useSettings = () => {
  const store = useSettingsStore();
  
  return {
    // State
    settings: store.settings,
    loading: store.loading,
    error: store.error,
    
    // Actions
    fetchSettings: store.fetchSettings,
    updateSettings: store.updateSettings,
    updateBranding: store.updateBranding,
    updateSystemConfig: store.updateSystemConfig,
    reset: store.reset,
    
    // Computed values
    isLoaded: !!store.settings,
    companyName: store.settings?.name || 'Company',
    primaryColor: store.settings?.branding?.primaryColor || '#2563eb',
    timezone: store.settings?.systemConfig?.timezone || 'America/New_York',
    dateFormat: store.settings?.systemConfig?.dateFormat || 'MM/DD/YYYY',
    currency: store.settings?.systemConfig?.currency || 'USD',
  };
};

// Enhanced settings hook with additional functionality
export const useSettingsEnhanced = () => {
  const settings = useSettings();
  
  return {
    ...settings,
    
    // Enhanced actions with notifications
    updateCompanyInfo: async (info: Partial<Pick<CompanySettings, 'name' | 'logo' | 'address' | 'contactInfo'>>) => {
      return withApiCall(
        () => settings.updateSettings(info),
        {
          loadingKey: 'updateCompanyInfo',
          showSuccessNotification: true,
          successMessage: 'Company information updated successfully',
        }
      );
    },
    
    updateBrandingWithNotification: async (branding: Partial<CompanySettings['branding']>) => {
      return withApiCall(
        () => settings.updateBranding(branding),
        {
          loadingKey: 'updateBranding',
          showSuccessNotification: true,
          successMessage: 'Branding updated successfully',
        }
      );
    },
    
    updateSystemConfigWithNotification: async (config: Partial<CompanySettings['systemConfig']>) => {
      return withApiCall(
        () => settings.updateSystemConfig(config),
        {
          loadingKey: 'updateSystemConfig',
          showSuccessNotification: true,
          successMessage: 'System configuration updated successfully',
        }
      );
    },
    
    // Feature management
    toggleFeature: async (feature: keyof CompanySettings['features'], enabled: boolean) => {
      if (!settings.settings?.features) return;
      
      const updates = {
        features: { ...settings.settings.features, [feature]: enabled },
      };
      
      return withApiCall(
        () => settings.updateSettings(updates),
        {
          loadingKey: 'toggleFeature',
          showSuccessNotification: true,
          successMessage: `Feature ${enabled ? 'enabled' : 'disabled'} successfully`,
        }
      );
    },
    
    // Integration management
    updateIntegration: async (integration: keyof CompanySettings['integrations'], value: any) => {
      if (!settings.settings?.integrations) return;
      
      const updates = {
        integrations: { ...settings.settings.integrations, [integration]: value },
      };
      
      return withApiCall(
        () => settings.updateSettings(updates),
        {
          loadingKey: 'updateIntegration',
          showSuccessNotification: true,
          successMessage: 'Integration updated successfully',
        }
      );
    },
    
    // Maintenance mode
    toggleMaintenanceMode: async (enabled: boolean) => {
      if (!settings.settings?.systemConfig) return;
      
      return settings.updateSystemConfig({ maintenanceMode: enabled });
    },
    
    // Password policy
    updatePasswordPolicy: async (policy: Partial<CompanySettings['systemConfig']['passwordPolicy']>) => {
      if (!settings.settings?.systemConfig?.passwordPolicy) return;
      
      const updatedPolicy = { ...settings.settings.systemConfig.passwordPolicy, ...policy };
      return settings.updateSystemConfig({ passwordPolicy: updatedPolicy });
    },
    
    // Backup settings
    updateBackupSettings: async (backup: Partial<CompanySettings['systemConfig']['backupSettings']>) => {
      if (!settings.settings?.systemConfig?.backupSettings) return;
      
      const updatedBackup = { ...settings.settings.systemConfig.backupSettings, ...backup };
      return settings.updateSystemConfig({ backupSettings: updatedBackup });
    },
    
    // Validation helpers
    validateSettings: (settingsData: Partial<CompanySettings>) => {
      const errors: string[] = [];
      
      if (settingsData.name && settingsData.name.trim().length < 2) {
        errors.push('Company name must be at least 2 characters long');
      }
      
      if (settingsData.contactInfo?.email && !settingsData.contactInfo.email.includes('@')) {
        errors.push('Invalid email address');
      }
      
      if (settingsData.contactInfo?.phone && settingsData.contactInfo.phone.length < 10) {
        errors.push('Phone number must be at least 10 digits');
      }
      
      if (settingsData.systemConfig?.sessionTimeout && settingsData.systemConfig.sessionTimeout < 5) {
        errors.push('Session timeout must be at least 5 minutes');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    
    // Theme helpers
    applyTheme: () => {
      if (!settings.settings?.branding) return;
      
      const root = document.documentElement;
      root.style.setProperty('--primary-color', settings.settings.branding.primaryColor);
      root.style.setProperty('--secondary-color', settings.settings.branding.secondaryColor);
      root.style.setProperty('--accent-color', settings.settings.branding.accentColor);
      
      // Apply custom CSS if provided
      if (settings.settings.branding.customCSS) {
        let styleElement = document.getElementById('custom-styles');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'custom-styles';
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = settings.settings.branding.customCSS;
      }
    },
    
    // Export/Import settings
    exportSettings: () => {
      if (!settings.settings) return null;
      
      const exportData = {
        ...settings.settings,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };
      
      return JSON.stringify(exportData, null, 2);
    },
    
    importSettings: async (settingsJson: string) => {
      try {
        const importedSettings = JSON.parse(settingsJson);
        
        // Remove metadata fields
        delete importedSettings.id;
        delete importedSettings.exportedAt;
        delete importedSettings.version;
        delete importedSettings.updatedAt;
        
        return settings.updateSettings(importedSettings);
      } catch (error) {
        throw new Error('Invalid settings file format');
      }
    },
  };
};