/**
 * Notification Service
 * 
 * Handles API calls for notification operations
 */

import { apiClient } from './apiClient';
import type {
  Notification,
  NotificationSettings,
  NotificationListResponse,
  UpdateNotificationSettingsRequest
} from '../types/notifications';

const API_BASE = '/api';

export const notificationService = {
  /**
   * Get all non-cleared notifications
   */
  async listNotifications(limit = 100, offset = 0): Promise<NotificationListResponse> {
    const response = await apiClient.get(`${API_BASE}/notifications`, {
      params: { limit, offset }
    });
    return response.data.data;
  },

  /**
   * Get count of non-cleared notifications
   */
  async getNotificationCount(): Promise<number> {
    const response = await apiClient.get(`${API_BASE}/notifications/count`);
    return response.data.data.count;
  },

  /**
   * Create a new notification
   */
  async createNotification(
    meterId: string,
    elementId: string,
    notificationType: 'failing' | 'stale'
  ): Promise<Notification> {
    const response = await apiClient.post(`${API_BASE}/notifications`, {
      meter_id: meterId,
      element_id: elementId,
      notification_type: notificationType
    });
    return response.data.data.notification;
  },

  /**
   * Clear (delete) a specific notification
   */
  async clearNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`${API_BASE}/notifications/${notificationId}`);
  },

  /**
   * Clear (delete) all notifications
   */
  async clearAllNotifications(): Promise<number> {
    const response = await apiClient.delete(`${API_BASE}/notifications`);
    return response.data.data.deleted_count;
  },

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get(`${API_BASE}/settings/notifications`);
    return response.data.data.settings;
  },

  /**
   * Update notification settings
   */
  async updateSettings(updates: UpdateNotificationSettingsRequest): Promise<NotificationSettings> {
    const response = await apiClient.put(`${API_BASE}/settings/notifications`, updates);
    return response.data.data.settings;
  }
};
