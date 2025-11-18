import React, { useState, useCallback } from 'react';
import { AppLayout } from '../../components/layout';
import { FormModal } from '@framework/shared/components';
import { EmailTemplateListSimple } from '../../components/templates/EmailTemplateListSimple';
import { TemplateForm } from '../../components/templates/TemplateForm';
import { useTemplatesEnhanced } from '../../store/entities/templatesStore';
import { useAuth } from '../../hooks/useAuth';
import type { EmailTemplate } from '../../types/entities';
import { Permission } from '../../types/auth';

export const TemplatesPage: React.FC = () => {
  const { checkPermission } = useAuth();
  const templates = useTemplatesEnhanced();
  
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Check permissions
  const canCreate = checkPermission(Permission.TEMPLATE_CREATE);
  const canUpdate = checkPermission(Permission.TEMPLATE_UPDATE);

  // Handle template selection for viewing
  const handleTemplateSelect = useCallback((template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowViewModal(true);
  }, []);

  // Handle template editing
  const handleTemplateEdit = useCallback((template: EmailTemplate) => {
    if (!canUpdate) return;
    setSelectedTemplate(template);
    setShowEditModal(true);
  }, [canUpdate]);

  // Handle template creation
  const handleTemplateCreate = useCallback(() => {
    if (!canCreate) return;
    setSelectedTemplate(null);
    setShowCreateModal(true);
  }, [canCreate]);

  // Handle form submission for creating template
  const handleCreateSubmit = useCallback(async (templateData: Partial<EmailTemplate>) => {
    try {
      await templates.createItem(templateData);
      setShowCreateModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  }, [templates]);

  // Handle form submission for editing template
  const handleEditSubmit = useCallback(async (templateData: Partial<EmailTemplate>) => {
    if (!selectedTemplate) return;
    
    try {
      await templates.updateItem(selectedTemplate.id, templateData);
      setShowEditModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error updating template:', error);
    }
  }, [templates, selectedTemplate]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedTemplate(null);
  }, []);

  return (
    <AppLayout title="Email Templates">
      <EmailTemplateListSimple
        onTemplateSelect={handleTemplateSelect}
        onTemplateEdit={handleTemplateEdit}
        onTemplateCreate={handleTemplateCreate}
      />

      {/* Create Template Modal */}
      <FormModal
        isOpen={showCreateModal}
        title="Create New Template"
        onClose={handleModalClose}
        onSubmit={() => {}} // TemplateForm handles its own submission
        size="lg"
      >
        <TemplateForm
          onSubmit={handleCreateSubmit}
          onCancel={handleModalClose}
        />
      </FormModal>

      {/* Edit Template Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Template"
        onClose={handleModalClose}
        onSubmit={() => {}} // TemplateForm handles its own submission
        size="lg"
      >
        <TemplateForm
          template={selectedTemplate || undefined}
          onSubmit={handleEditSubmit}
          onCancel={handleModalClose}
        />
      </FormModal>

      {/* View Template Modal */}
      <FormModal
        isOpen={showViewModal}
        title="Template Details"
        onClose={handleModalClose}
        onSubmit={() => {}} // Read-only modal
        size="lg"
      >
        {selectedTemplate && (
          <div className="template-details">
            <h3>{selectedTemplate.name}</h3>
            <p><strong>Subject:</strong> {selectedTemplate.subject}</p>
            <p><strong>Category:</strong> {selectedTemplate.category}</p>
            <p><strong>Status:</strong> {selectedTemplate.status}</p>
            <p><strong>Usage Count:</strong> {selectedTemplate.usageCount || 0}</p>
            <div>
              <strong>Content:</strong>
              <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '5px' }}>
                {selectedTemplate.content}
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </AppLayout>
  );
};