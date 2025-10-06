
import React, { useState } from 'react';
import { Tabs, Tab } from '@mui/material';
import CompanyInfoForm from '../components/settings/CompanyInfoForm';
import BrandingForm from '../components/settings/BrandingForm';
import SystemConfigForm from '../components/settings/SystemConfigForm';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  // Mock state for demonstration; replace with real state management
  const [companyInfo, setCompanyInfo] = useState<any>({});
  const [branding, setBranding] = useState<any>({});
  const [systemConfig, setSystemConfig] = useState<any>({});
  const [loading] = useState(false);
  const [error] = useState<string|null>(null);

  return (
    <div>
      <h2>Settings</h2>
  <Tabs value={tab} onChange={handleTabChange} aria-label="Settings Tabs" className="settings-tabs">
        <Tab label="Company Info" />
        <Tab label="Branding" />
        <Tab label="System Config" />
      </Tabs>
      <div className="settings-content">
        {tab === 0 && (
          <CompanyInfoForm
            values={companyInfo}
            onChange={(field, value) => setCompanyInfo((prev: any) => ({ ...prev, [field]: value }))}
            onSubmit={() => {}}
            onCancel={() => {}}
            loading={loading}
            error={error}
          />
        )}
        {tab === 1 && (
          <BrandingForm
            values={branding}
            onChange={(field, value) => setBranding((prev: any) => ({ ...prev, [field]: value }))}
            onSubmit={() => {}}
            onCancel={() => {}}
            loading={loading}
            error={error}
          />
        )}
        {tab === 2 && (
          <SystemConfigForm
            values={systemConfig}
            onChange={(field, value) => setSystemConfig((prev: any) => ({ ...prev, [field]: value }))}
            onSubmit={() => {}}
            onCancel={() => {}}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
