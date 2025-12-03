/**
 * Simple Email Template Example
 * 
 * This example demonstrates basic usage of the email templates framework.
 */

import React, { useState } from 'react';
import {
  TemplateEditor,
  TemplatePreview,
  useTemplate,
  type EmailTemplate,
  type TemplateVariable
} from '../index';

// Define available variables for the template
const availableVariables: Record<string, TemplateVariable> = {
  recipient_name: {
    name: 'recipient_name',
    description: 'Name of the email recipient',
    type: 'text',
    required: true,
    sample: 'John Doe'
  },
  company_name: {
    name: 'company_name',
    description: 'Company name',
    type: 'text',
    required: false,
    sample: 'Acme Corp'
  },
  current_date: {
    name: 'current_date',
    description: 'Current date',
    type: 'date',
    required: false,
    sample: new Date().toISOString()
  }
};

export function SimpleTemplateExample() {
  const [showPreview, setShowPreview] = useState(false);

  // Initialize the template hook
  const template = useTemplate({
    availableVariables,
    onSave: async (savedTemplate) => {
      console.log('Saving template:', savedTemplate);
      // Call your API service here
      // await templateService.createTemplate(savedTemplate);
    },
    autoValidate: true,
    validationDelay: 500
  });

  // Handle preview
  const handlePreview = async () => {
    try {
      await template.preview({
        recipient_name: 'John Doe',
        company_name: 'Acme Corp',
        current_date: new Date().toISOString()
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Create Email Template</h1>

      {/* Template Name */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Template Name:
          <input
            type="text"
            value={template.template.name || ''}
            onChange={(e) => template.updateField('name', e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
          />
        </label>
      </div>

      {/* Template Subject */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Subject:
          <input
            type="text"
            value={template.template.subject || ''}
            onChange={(e) => template.updateSubject(e.target.value)}
            placeholder="Enter email subject (can use {{variables}})"
            style={{ marginLeft: '10px', padding: '5px', width: '500px' }}
          />
        </label>
      </div>

      {/* Template Category */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Category:
          <select
            value={template.template.category || 'general'}
            onChange={(e) => template.updateCategory(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="general">General</option>
            <option value="meter_reading">Meter Readings</option>
            <option value="meter_errors">Meter Errors</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </label>
      </div>

      {/* Template Editor */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Template Content</h3>
        <TemplateEditor
          value={template.template.content || ''}
          onChange={template.updateContent}
          availableVariables={availableVariables}
          placeholder="Enter your email template content here. Use {{variable_name}} for dynamic content."
          height={400}
          showToolbar={true}
          showVariableHelper={true}
        />
      </div>

      {/* Validation Errors */}
      {template.hasErrors && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>Validation Errors:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {template.validationErrors.map((error, index) => (
              <li key={index} style={{ color: '#d32f2f' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {template.hasWarnings && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff3e0', border: '1px solid #ff9800', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Warnings:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {template.validationWarnings.map((warning, index) => (
              <li key={index} style={{ color: '#f57c00' }}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={template.validate}
          disabled={template.isValidating}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          {template.isValidating ? 'Validating...' : 'Validate'}
        </button>

        <button
          onClick={handlePreview}
          disabled={template.isPreviewing || !template.template.content}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          {template.isPreviewing ? 'Generating Preview...' : 'Preview'}
        </button>

        <button
          onClick={template.save}
          disabled={!template.canSave}
          style={{
            padding: '10px 20px',
            cursor: template.canSave ? 'pointer' : 'not-allowed',
            backgroundColor: template.canSave ? '#4caf50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {template.isSaving ? 'Saving...' : 'Save Template'}
        </button>

        <button
          onClick={template.reset}
          disabled={!template.isModified}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>

      {/* Template Info */}
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <p><strong>Modified:</strong> {template.isModified ? 'Yes' : 'No'}</p>
        <p><strong>Can Save:</strong> {template.canSave ? 'Yes' : 'No'}</p>
        <p><strong>Has Errors:</strong> {template.hasErrors ? 'Yes' : 'No'}</p>
        <p><strong>Has Warnings:</strong> {template.hasWarnings ? 'Yes' : 'No'}</p>
      </div>

      {/* Preview Modal */}
      {showPreview && template.previewData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Template Preview</h2>
            <TemplatePreview
              preview={template.previewData}
              showSubject={true}
              showVariables={true}
              maxHeight={500}
            />
            <button
              onClick={() => setShowPreview(false)}
              style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleTemplateExample;
