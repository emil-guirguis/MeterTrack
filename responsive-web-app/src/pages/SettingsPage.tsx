
import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '@mui/material';
import CompanyInfoForm from '../components/settings/CompanyInfoForm';
import BrandingForm from '../components/settings/BrandingForm';
import SystemConfigForm from '../components/settings/SystemConfigForm';
import './SettingsPage.css';
import { useSettings } from '../store/entities/settingsStore';

const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    updateBranding,
    updateSystemConfig,
  } = useSettings();

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, []);

  // Handlers for updating settings
  const handleCompanyInfoChange = (field: string, value: any) => {
    if (!settings) return;
    updateSettings({ ...settings, [field]: value });
  };
  const handleBrandingChange = (field: string, value: any) => {
    if (!settings) return;
    updateBranding({ ...settings.branding, [field]: value });
  };
  const handleSystemConfigChange = (field: string, value: any) => {
    if (!settings) return;
    updateSystemConfig({ ...settings.systemConfig, [field]: value });
  };

  return (
    <div>
      <h2>Settings</h2>
      <Tabs value={tab} onChange={(_event, newValue) => setTab(newValue)} aria-label="Settings Tabs" className="settings-tabs">
        <Tab label="Company Info" />
        <Tab label="Branding" />
        <Tab label="System Config" />
      </Tabs>
      <div className="settings-content">
        {tab === 0 && settings && (
          <CompanyInfoForm
            values={settings}
            onChange={handleCompanyInfoChange}
            onSubmit={() => {}}
            onCancel={() => {}}
            loading={loading}
            error={error}
          />
        )}
        {tab === 1 && settings && (
          <BrandingForm
            values={settings.branding}
            onChange={handleBrandingChange}
            onSubmit={() => {}}
            onCancel={() => {}}
            loading={loading}
            error={error}
          />
        )}
        {tab === 2 && settings && (
          <SystemConfigForm
            values={settings.systemConfig}
            onChange={handleSystemConfigChange}
            onSubmit={() => {}}
            onCancel={() => {}}
            loading={loading}
            error={error}
          />
        )}
        {!settings && loading && <div>Loading...</div>}
        {!settings && error && <div className="settings-form__error">{error}</div>}
      </div>
    </div>
  );
};

export default SettingsPage;
