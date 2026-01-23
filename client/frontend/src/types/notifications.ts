/**
 * Notification types for the frontend
 */

export type NotificationType = 'failing' | 'stale';

export interface Notification {
  id: string;
  meter_id: string;
  element_id: string;
  notification_type: NotificationType;
  created_at: string;
  cleared: boolean;
}

export interface NotificationSettings {
  id: string;
  health_check_cron: string;
  daily_email_cron: string;
  email_template_id: string | null;
  enabled: boolean;
  updated_at: string;
}

export interface UpdateNotificationSettingsRequest {
  health_check_cron?: string;
  daily_email_cron?: string;
  email_template_id?: string | null;
  enabled?: boolean;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotificationCountResponse {
  count: number;
}
