
import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '@mui/material';
import CompanyInfoForm from '../components/settings/CompanyInfoForm';
import BrandingForm from '../components/settings/BrandingForm';
import SystemConfigForm from '../components/settings/SystemConfigForm';
import { useSettingsEnhanced } from '../store/entities/settingsStore';

const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const {
    settings,
    loading,
    error,
    fetchSettings,
    updateCompanyInfo,
    updateBrandingWithNotification,
    updateSystemConfigWithNotification
  } = useSettingsEnhanced();

  // Local form state to prevent focus loss
  const [localCompanyInfo, setLocalCompanyInfo] = useState<any>({});
  const [localBranding, setLocalBranding] = useState<any>({});
  const [localSystemConfig, setLocalSystemConfig] = useState<any>({});

  // Load settings when component mounts
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setLocalCompanyInfo(settings);
      setLocalBranding(settings.branding || {});
      setLocalSystemConfig(settings.systemConfig || {});
    }
  }, [settings]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <div>
      <h2>Settings</h2>
      {/* Debug info */}
      <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
        <strong>Debug Info:</strong><br/>
        Loading: {loading ? 'true' : 'false'}<br/>
        Error: {error || 'none'}<br/>
        Settings loaded: {settings ? 'true' : 'false'}<br/>
        Company name: {settings?.name || 'not loaded'}<br/>
        Settings object: {JSON.stringify(settings, null, 2).substring(0, 200)}...
      </div>
  <Tabs value={tab} onChange={handleTabChange} aria-label="Settings Tabs" className="settings-tabs">
        <Tab label="Company Info" />
        <Tab label="Branding" />
        <Tab label="System Config" />
      </Tabs>
      <div style={{ marginTop: 24 }}>
        {tab === 0 && (
          <div>
            <div style={{ background: '#e0f0ff', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
              <strong>Company Form Debug:</strong><br/>
              Values passed to form: {JSON.stringify(localCompanyInfo, null, 2).substring(0, 300)}...
            </div>
            <CompanyInfoForm
              values={localCompanyInfo}
              onChange={(field, value) => {
                // Update local state only (no immediate store updates)
                const fieldParts = field.split('.');
                if (fieldParts.length > 1) {
                  const [parent, child] = fieldParts;
                  setLocalCompanyInfo((prev: any) => ({
                    ...prev,
                    [parent]: {
                      ...prev[parent],
                      [child]: value
                    }
                  }));
                } else {
                  setLocalCompanyInfo((prev: any) => ({
                    ...prev,
                    [field]: value
                  }));
                }
              }}
              onSubmit={async () => {
                // Save all changes to store
                try {
                  await updateCompanyInfo(localCompanyInfo);
                  console.log('Company info updated successfully');
                } catch (error) {
                  console.error('Failed to update company info:', error);
                }
              }}
              onCancel={() => {
                // Reset local state to original settings
                if (settings) {
                  setLocalCompanyInfo(settings);
                }
              }}
              loading={loading}
              error={error}
            />
          </div>
        )}
        {tab === 1 && (
          <BrandingForm
            values={localBranding}
            onChange={(field, value) => {
              // Update local state only
              setLocalBranding((prev: any) => ({
                ...prev,
                [field]: value
              }));
            }}
            onSubmit={async () => {
              // Save changes to store
              try {
                await updateBrandingWithNotification(localBranding);
                console.log('Branding updated successfully');
              } catch (error) {
                console.error('Failed to update branding:', error);
              }
            }}
            onCancel={() => {
              // Reset local state
              if (settings?.branding) {
                setLocalBranding(settings.branding);
              }
            }}
            loading={loading}
            error={error}
          />
        )}
        {tab === 2 && (
          <SystemConfigForm
            values={localSystemConfig}
            onChange={(field, value) => {
              // Update local state only
              const fieldParts = field.split('.');
              if (fieldParts.length > 1) {
                const [parent, child] = fieldParts;
                setLocalSystemConfig((prev: any) => ({
                  ...prev,
                  [parent]: {
                    ...prev[parent],
                    [child]: value
                  }
                }));
              } else {
                setLocalSystemConfig((prev: any) => ({
                  ...prev,
                  [field]: value
                }));
              }
            }}
            onSubmit={async () => {
              // Save changes to store
              try {
                await updateSystemConfigWithNotification(localSystemConfig);
                console.log('System config updated successfully');
              } catch (error) {
                console.error('Failed to update system config:', error);
              }
            }}
            onCancel={() => {
              // Reset local state
              if (settings?.systemConfig) {
                setLocalSystemConfig(settings.systemConfig);
              }
            }}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
