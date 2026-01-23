/**
 * Notification Settings Tab Component
 * 
 * Allows administrators to configure notification system behavior
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { notificationService } from '../../services/notificationService';
import { NotificationSettings } from '../../types/notifications';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
}

interface NotificationSettingsTabProps {
  emailTemplates?: EmailTemplate[];
}

export const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({
  emailTemplates = []
}) => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    health_check_cron: '',
    daily_email_cron: '',
    email_template_id: '',
    enabled: true
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedSettings = await notificationService.getSettings();
      setSettings(loadedSettings);
      setFormData({
        health_check_cron: loadedSettings.health_check_cron,
        daily_email_cron: loadedSettings.daily_email_cron,
        email_template_id: loadedSettings.email_template_id || '',
        enabled: loadedSettings.enabled
      });
    } catch (err) {
      console.error('Error loading notification settings:', err);
      setError('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCronExpression = (cron: string): boolean => {
    if (!cron) return false;
    const parts = cron.trim().split(/\s+/);
    return (parts.length === 5 || parts.length === 6) && /^[\d\*\/\-,]+$/.test(parts.join(''));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Validate cron expressions
      if (!validateCronExpression(formData.health_check_cron)) {
        setError('Invalid health check cron expression');
        setIsSaving(false);
        return;
      }

      if (!validateCronExpression(formData.daily_email_cron)) {
        setError('Invalid daily email cron expression');
        setIsSaving(false);
        return;
      }

      // Save settings
      const updatedSettings = await notificationService.updateSettings({
        health_check_cron: formData.health_check_cron,
        daily_email_cron: formData.daily_email_cron,
        email_template_id: formData.email_template_id || null,
        enabled: formData.enabled
      });

      setSettings(updatedSettings);
      setSuccess('Notification settings saved successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Filter email templates to only show meter_reading_notification type
  const notificationTemplates = emailTemplates.filter(t => t.type === 'meter_reading_notification');

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Notification Settings
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Enable Notifications Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => handleInputChange('enabled', e.target.checked)}
                  data-testid="enable-notifications-toggle"
                />
              }
              label="Enable Notifications"
            />

            {/* Health Check Interval */}
            <TextField
              fullWidth
              label="Health Check Interval (Cron)"
              value={formData.health_check_cron}
              onChange={(e) => handleInputChange('health_check_cron', e.target.value)}
              placeholder="0 */2 * * *"
              helperText="Cron expression for meter health checks (default: every 2 hours)"
              data-testid="health-check-cron-input"
            />

            {/* Daily Email Time */}
            <TextField
              fullWidth
              label="Daily Email Time (Cron)"
              value={formData.daily_email_cron}
              onChange={(e) => handleInputChange('daily_email_cron', e.target.value)}
              placeholder="0 9 * * *"
              helperText="Cron expression for daily email delivery (default: 9 AM daily)"
              data-testid="daily-email-cron-input"
            />

            {/* Email Template Selection */}
            <FormControl fullWidth>
              <InputLabel>Email Template</InputLabel>
              <Select
                value={formData.email_template_id}
                label="Email Template"
                onChange={(e) => handleInputChange('email_template_id', e.target.value)}
                data-testid="email-template-select"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {notificationTemplates.map(template => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Save Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={loadSettings}
                disabled={isSaving}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={isSaving}
                data-testid="save-settings-button"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationSettingsTab;
