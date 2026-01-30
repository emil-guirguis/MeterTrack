/**
 * NotificationList Component
 * 
 * Renders a list of notifications with details and clear actions
 */

import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Notification } from '../../types/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  notifications: Notification[];
  onClear: (notificationId: string) => void;
  onClearAll?: () => void;
}

const getNotificationTypeColor = (type: 'failing' | 'stale'): 'error' | 'warning' => {
  return type === 'failing' ? 'error' : 'warning';
};

const getNotificationTypeLabel = (type: 'failing' | 'stale'): string => {
  return type === 'failing' ? 'Failing' : 'Stale';
};

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onClear
}) => {
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  return (
    <List sx={{ width: '100%', maxHeight: 400, overflow: 'auto' }}>
      {notifications.map((notification, index) => (
        <React.Fragment key={notification.id}>
          <ListItem
            data-testid={`notification-item-${notification.id}`}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {notification.meter_id}
                  </Typography>
                  <Chip
                    label={getNotificationTypeLabel(notification.notification_type)}
                    size="small"
                    color={getNotificationTypeColor(notification.notification_type)}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" display="block" color="textSecondary">
                    Element: {notification.element_id}
                  </Typography>
                  <Typography variant="caption" display="block" color="textSecondary">
                    {formatTimestamp(notification.created_at)}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onClear(notification.id)}
                size="small"
                data-testid={`clear-notification-${notification.id}`}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          {index < notifications.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default NotificationList;
