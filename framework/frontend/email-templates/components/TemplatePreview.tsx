import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Alert,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import type { TemplatePreviewResponse } from '../types/template';
import './TemplatePreview.css';

/**
 * Props for TemplatePreview component
 */
export interface TemplatePreviewProps {
  /** Preview data to display */
  preview: TemplatePreviewResponse;
  /** Show subject line */
  showSubject?: boolean;
  /** Show variables used */
  showVariables?: boolean;
  /** Maximum height for content area */
  maxHeight?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Component for previewing rendered email templates
 * 
 * Displays the rendered subject and content of an email template
 * with the variables substituted.
 * 
 * @example
 * ```tsx
 * <TemplatePreview
 *   preview={{
 *     subject: 'Welcome John Doe',
 *     htmlContent: '<p>Hello John Doe!</p>',
 *     variables: { recipient_name: 'John Doe' }
 *   }}
 *   showSubject={true}
 *   showVariables={true}
 * />
 * ```
 */
export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  preview,
  showSubject = true,
  showVariables = true,
  maxHeight = 600,
  className = ''
}) => {
  const { subject, htmlContent, textContent, variables } = preview;

  return (
    <Box className={`template-preview ${className}`}>
      {/* Subject Line */}
      {showSubject && subject && (
        <Paper className="template-preview-subject" elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Subject:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {subject}
          </Typography>
        </Paper>
      )}

      {/* Variables Used */}
      {showVariables && variables && Object.keys(variables).length > 0 && (
        <Paper className="template-preview-variables" elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'info.50' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Variables Used:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {Object.entries(variables).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${value}`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* HTML Content */}
      {htmlContent && (
        <Paper 
          className="template-preview-content"
          elevation={1}
          sx={{ 
            p: 3,
            maxHeight,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <div
            className="template-preview-html"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </Paper>
      )}

      {/* Text Content (if available) */}
      {textContent && (
        <Paper 
          className="template-preview-text"
          elevation={0}
          sx={{ 
            p: 2,
            mt: 2,
            bgcolor: 'grey.50',
            maxHeight: 200,
            overflow: 'auto'
          }}
        >
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Plain Text Version:
          </Typography>
          <Typography 
            variant="body2" 
            component="pre"
            sx={{ 
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              mt: 1
            }}
          >
            {textContent}
          </Typography>
        </Paper>
      )}

      {/* Empty State */}
      {!htmlContent && !textContent && (
        <Alert severity="info">
          No preview content available
        </Alert>
      )}
    </Box>
  );
};

/**
 * Props for TemplatePreviewDialog component
 */
export interface TemplatePreviewDialogProps extends TemplatePreviewProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Dialog title */
  title?: string;
}

/**
 * Dialog wrapper for TemplatePreview
 * 
 * @example
 * ```tsx
 * <TemplatePreviewDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Email Preview"
 *   preview={previewData}
 * />
 * ```
 */
export const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  open,
  onClose,
  title = 'Template Preview',
  preview,
  ...previewProps
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TemplatePreview preview={preview} {...previewProps} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
