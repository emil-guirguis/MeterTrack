import React, { useState } from 'react';
import { Box } from '@mui/material';
import { TemplateList } from './TemplateList';
import { TemplateForm } from './TemplateForm';
import { TemplatePreview } from './TemplatePreview';
import type { EmailTemplate } from '../../types/entities';

export const TemplateManagement: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [refreshList, setRefreshList] = useState(0);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setFormOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormOpen(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedTemplate(null);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setSelectedTemplate(null);
  };

  const handleTemplateSaved = (template: EmailTemplate) => {
    // Refresh the list by incrementing the refresh counter
    setRefreshList(prev => prev + 1);
  };

  const handleSendTest = (_template: EmailTemplate, variables: Record<string, any>) => {
    // TODO: Implement test email sending
    console.log('Send test email:', { _template, variables });
    // This would typically open a dialog to enter test email address
    // and then call an API to send the test email
  };

  return (
    <Box>
      <TemplateList
        key={refreshList} // Force re-render when refreshList changes
        onCreateTemplate={handleCreateTemplate}
        onEditTemplate={handleEditTemplate}
        onPreviewTemplate={handlePreviewTemplate}
      />

      {formOpen && (
        <TemplateForm
          template={selectedTemplate || undefined}
          open={formOpen}
          onClose={handleFormClose}
          onSave={handleTemplateSaved}
        />
      )}

      {previewOpen && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          open={previewOpen}
          onClose={handlePreviewClose}
          onSendTest={handleSendTest}
        />
      )}
    </Box>
  );
};