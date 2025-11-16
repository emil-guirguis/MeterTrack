# Email Templates Framework Migration Guide

This guide helps you migrate existing email template code to use the new framework.

## Overview

The email templates framework provides:
- Reusable components for template editing and preview
- Hooks for template state management
- Utilities for variable substitution and rendering
- Type-safe interfaces

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { TemplateEditor } from '../../components/templates/TemplateEditor';
import { TemplateForm } from '../../components/templates/TemplateForm';
import { templateService } from '../../services/templateService';
```

**After:**
```typescript
import {
  TemplateEditor,
  TemplatePreview,
  useTemplate
} from '../../../framework/frontend/email-templates';
import { templateService } from '../../services/templateService';
```

### Step 2: Update Component Usage

#### TemplateEditor Component

The TemplateEditor component has been moved to the framework with the same API.

**Before:**
```tsx
import { TemplateEditor } from '../../components/templates/TemplateEditor';

<TemplateEditor
  value={content}
  onChange={setContent}
  availableVariables={variables}
  showToolbar={true}
/>
```

**After:**
```tsx
import { TemplateEditor } from '../../../framework/frontend/email-templates';

<TemplateEditor
  value={content}
  onChange={setContent}
  availableVariables={variables}
  showToolbar={true}
/>
```

#### TemplatePreview Component

**Before:**
```tsx
// Custom preview implementation
<div dangerouslySetInnerHTML={{ __html: previewData.htmlContent }} />
```

**After:**
```tsx
import { TemplatePreview } from '../../../framework/frontend/email-templates';

<TemplatePreview
  preview={previewData}
  showSubject={true}
  showVariables={true}
/>
```

### Step 3: Use useTemplate Hook

Replace custom template state management with the useTemplate hook.

**Before:**
```tsx
const [template, setTemplate] = useState<EmailTemplate | null>(null);
const [content, setContent] = useState('');
const [subject, setSubject] = useState('');
const [validationErrors, setValidationErrors] = useState<string[]>([]);
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    await templateService.updateTemplate({
      id: template.id,
      content,
      subject
    });
  } finally {
    setIsSaving(false);
  }
};

const handleValidate = async () => {
  const result = await templateService.validateTemplate(content, subject);
  setValidationErrors(result.errors);
};
```

**After:**
```tsx
import { useTemplate } from '../../../framework/frontend/email-templates';

const template = useTemplate({
  template: existingTemplate,
  availableVariables: categoryVariables,
  onSave: async (template) => {
    await templateService.updateTemplate(template);
  },
  autoValidate: true
});

// Use template.save(), template.validate(), etc.
```

### Step 4: Update Template Rendering

**Before:**
```tsx
// Custom variable substitution
const renderTemplate = (template: string, variables: Record<string, any>) => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  return result;
};
```

**After:**
```tsx
import { renderTemplate, substituteVariables } from '../../../framework/frontend/email-templates';

// For simple substitution
const result = substituteVariables(template, variables);

// For full rendering with validation
const renderResult = renderTemplate(template, variables, {
  escapeHtml: true,
  strict: false
});
console.log(renderResult.html);
console.log(renderResult.text);
console.log(renderResult.usedVariables);
```

### Step 5: Update Type Definitions

**Before:**
```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  // ... other fields
}
```

**After:**
```typescript
import type { EmailTemplate, TemplateVariable } from '../../../framework/frontend/email-templates';

// Use the framework types directly
```

## Component Migration Examples

### EmailTemplateList Component

**Before:**
```tsx
import { EmailTemplateList } from '../../components/templates/EmailTemplateList';

<EmailTemplateList
  onEditTemplate={handleEdit}
  onCreateTemplate={handleCreate}
  onPreviewTemplate={handlePreview}
/>
```

**After:**
The EmailTemplateList component can continue to use the client implementation, but should import TemplateEditor and TemplatePreview from the framework:

```tsx
import { TemplateEditor, TemplatePreview } from '../../../framework/frontend/email-templates';
import { EmailTemplateList } from '../../components/templates/EmailTemplateList';

// Update EmailTemplateList internally to use framework components
```

### EmailTemplateListSimple Component

**Before:**
```tsx
import { EmailTemplateListSimple } from '../../components/templates/EmailTemplateListSimple';
import { useBaseList } from '../../hooks/useBaseList';

<EmailTemplateListSimple
  onTemplateSelect={handleSelect}
  onTemplateEdit={handleEdit}
/>
```

**After:**
```tsx
import { EmailTemplateListSimple } from '../../components/templates/EmailTemplateListSimple';
import { useBaseList } from '../../../framework/frontend/lists';

// EmailTemplateListSimple already uses the framework's useBaseList
<EmailTemplateListSimple
  onTemplateSelect={handleSelect}
  onTemplateEdit={handleEdit}
/>
```

### TemplateForm Component

**Before:**
```tsx
import { TemplateForm } from '../../components/templates/TemplateForm';

<TemplateForm
  template={selectedTemplate}
  open={isOpen}
  onClose={handleClose}
  onSave={handleSave}
/>
```

**After:**
Update TemplateForm to use the useTemplate hook and framework components:

```tsx
import { useTemplate, TemplateEditor } from '../../../framework/frontend/email-templates';

function TemplateForm({ template, open, onClose, onSave }) {
  const templateHook = useTemplate({
    template,
    onSave: async (updatedTemplate) => {
      await onSave(updatedTemplate);
      onClose();
    }
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <TextField
          label="Template Name"
          value={templateHook.template.name || ''}
          onChange={(e) => templateHook.updateField('name', e.target.value)}
        />
        
        <TextField
          label="Subject"
          value={templateHook.template.subject || ''}
          onChange={(e) => templateHook.updateSubject(e.target.value)}
        />
        
        <TemplateEditor
          value={templateHook.template.content || ''}
          onChange={templateHook.updateContent}
          availableVariables={templateHook.getAvailableVariables()}
        />
        
        {templateHook.hasErrors && (
          <Alert severity="error">
            {templateHook.validationErrors.join(', ')}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={templateHook.save}
          disabled={!templateHook.canSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## Service Integration

The framework doesn't replace your template service, but provides utilities that can be used within it.

**Example: Enhanced Template Service**

```typescript
import {
  renderTemplate,
  validateTemplate,
  substituteVariables
} from '../../../framework/frontend/email-templates';

class TemplateService {
  // ... existing methods ...

  async previewTemplate(request: TemplatePreviewRequest): Promise<TemplatePreviewResponse> {
    // Use framework utilities for rendering
    const renderResult = renderTemplate(
      request.content || '',
      request.variables,
      { escapeHtml: true }
    );

    return {
      subject: substituteVariables(request.subject || '', request.variables),
      htmlContent: renderResult.html,
      textContent: renderResult.text,
      variables: request.variables
    };
  }

  async validateTemplate(content: string, subject: string): Promise<TemplateValidationResponse> {
    // Use framework validation
    return validateTemplate(content, subject);
  }
}
```

## CSS and Styling

The framework includes CSS files that need to be imported:

```tsx
// In your component or app entry point
import '../../../framework/frontend/email-templates/components/TemplateEditor.css';
import '../../../framework/frontend/email-templates/components/TemplatePreview.css';
```

Or if using CSS modules, the framework components will handle their own styles.

## Testing

Update your tests to use framework components:

**Before:**
```tsx
import { TemplateEditor } from '../../components/templates/TemplateEditor';

test('renders template editor', () => {
  render(<TemplateEditor value="" onChange={jest.fn()} />);
  // ...
});
```

**After:**
```tsx
import { TemplateEditor } from '../../../framework/frontend/email-templates';

test('renders template editor', () => {
  render(<TemplateEditor value="" onChange={jest.fn()} />);
  // ...
});
```

## Breaking Changes

### Removed Features

None - the framework maintains backward compatibility with existing APIs.

### Changed APIs

None - all APIs remain the same.

### New Features

- `useTemplate` hook for state management
- `TemplatePreview` component
- Enhanced validation utilities
- HTML to text conversion
- Template sanitization

## Rollback Plan

If you need to rollback:

1. Keep the old components in `client/frontend/src/components/templates/`
2. Update imports back to the old paths
3. The framework doesn't modify existing code, so rollback is safe

## Checklist

- [ ] Update all imports to use framework paths
- [ ] Replace custom template state management with `useTemplate` hook
- [ ] Update TemplateEditor usage to framework component
- [ ] Add TemplatePreview component where needed
- [ ] Update template rendering to use framework utilities
- [ ] Update type definitions to use framework types
- [ ] Import framework CSS files
- [ ] Update tests
- [ ] Test all template functionality
- [ ] Remove old template components (optional, after verification)

## Support

For issues or questions:
1. Check the [README.md](./README.md) for API documentation
2. Review the [ANALYSIS.md](./ANALYSIS.md) for implementation details
3. Check existing examples in the codebase

## Next Steps

After migration:
1. Test all template CRUD operations
2. Verify preview functionality
3. Test variable substitution with different data
4. Validate email rendering in different clients
5. Remove old template components (optional)
