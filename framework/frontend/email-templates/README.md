# Email Templates Framework

A comprehensive framework for managing email templates with rich text editing, variable substitution, and preview capabilities.

## Features

- **Rich Text Editor**: WYSIWYG editor with formatting toolbar
- **Variable System**: Dynamic content with Handlebars-style syntax `{{variable_name}}`
- **Template Validation**: Syntax checking and variable validation
- **Preview**: Real-time preview with sample data
- **Formatting**: Support for date, currency, number, and text formatting
- **Conditional Logic**: `{{#if condition}}...{{/if}}` blocks
- **Loops**: `{{#each items}}...{{/each}}` blocks
- **HTML & Text**: Generate both HTML and plain text versions

## Installation

The email templates framework is part of the main framework package:

```typescript
import {
  // Components
  TemplateEditor,
  TemplatePreview,
  
  // Hooks
  useTemplate,
  
  // Utilities
  renderTemplate,
  validateTemplate,
  substituteVariables,
  
  // Types
  EmailTemplate,
  TemplateVariable
} from '../../../framework/frontend/email-templates';
```

## Quick Start

### Basic Template Editor

```tsx
import { TemplateEditor } from '../../../framework/frontend/email-templates';

function MyTemplateEditor() {
  const [content, setContent] = useState('');
  
  return (
    <TemplateEditor
      value={content}
      onChange={setContent}
      availableVariables={{
        recipient_name: {
          name: 'recipient_name',
          description: 'Recipient name',
          type: 'text',
          required: true
        }
      }}
      showToolbar={true}
      showVariableHelper={true}
    />
  );
}
```

### Using the useTemplate Hook

```tsx
import { useTemplate } from '../../../framework/frontend/email-templates';

function MyTemplateForm() {
  const template = useTemplate({
    template: existingTemplate,
    availableVariables: categoryVariables,
    onSave: async (template) => {
      await templateService.updateTemplate(template);
    },
    autoValidate: true
  });
  
  return (
    <div>
      <input
        value={template.template.name || ''}
        onChange={(e) => template.updateField('name', e.target.value)}
      />
      
      <TemplateEditor
        value={template.template.content || ''}
        onChange={template.updateContent}
        availableVariables={template.getAvailableVariables()}
      />
      
      {template.hasErrors && (
        <div>
          {template.validationErrors.map(error => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}
      
      <button
        onClick={template.save}
        disabled={!template.canSave}
      >
        Save Template
      </button>
    </div>
  );
}
```

### Template Preview

```tsx
import { TemplatePreview } from '../../../framework/frontend/email-templates';

function MyPreview({ previewData }) {
  return (
    <TemplatePreview
      preview={previewData}
      showSubject={true}
      showVariables={true}
      maxHeight={600}
    />
  );
}
```

### Variable Substitution

```tsx
import { substituteVariables } from '../../../framework/frontend/email-templates';

const template = 'Hello {{name}}, your balance is {{balance | currency}}';
const variables = { name: 'John Doe', balance: 1234.56 };

const result = substituteVariables(template, variables);
// Result: "Hello John Doe, your balance is $1,234.56"
```

### Template Rendering

```tsx
import { renderTemplate } from '../../../framework/frontend/email-templates';

const result = renderTemplate(
  '<p>Hello {{name}}</p>',
  { name: 'John Doe' },
  { escapeHtml: true, strict: false }
);

console.log(result.html); // "<p>Hello John Doe</p>"
console.log(result.text); // "Hello John Doe"
console.log(result.usedVariables); // ["name"]
```

## Variable Syntax

### Basic Variables

```
{{variable_name}}
```

### Formatted Variables

```
{{variable_name | format}}
```

Available formats:
- `uppercase` - Convert to UPPERCASE
- `lowercase` - Convert to lowercase
- `capitalize` - Capitalize First Letter
- `date` - Format as date (e.g., "January 1, 2024")
- `currency` - Format as currency (e.g., "$1,234.56")
- `number` - Format as number (e.g., "1,234.56")

### Custom Formats

```
{{date_field | date:'YYYY-MM-DD'}}
{{amount | currency:'EUR'}}
{{value | number:'0,0.00'}}
```

### Conditional Blocks

```
{{#if show_section}}
  This content is only shown if show_section is true
{{/if}}
```

### Loop Blocks

```
{{#each items}}
  <li>{{name}}: {{price | currency}}</li>
{{/each}}
```

## Components

### TemplateEditor

Rich text editor for creating and editing email templates.

**Props:**
- `value: string` - Current template content
- `onChange: (value: string) => void` - Content change handler
- `availableVariables?: Record<string, TemplateVariable>` - Variables available for insertion
- `placeholder?: string` - Placeholder text
- `height?: number` - Editor height in pixels
- `showToolbar?: boolean` - Show formatting toolbar
- `showVariableHelper?: boolean` - Show variable helper panel
- `onPreview?: (content: string) => void` - Preview callback

### TemplatePreview

Component for displaying rendered template previews.

**Props:**
- `preview: TemplatePreviewResponse` - Preview data
- `showSubject?: boolean` - Show subject line
- `showVariables?: boolean` - Show variables used
- `maxHeight?: number` - Maximum content height
- `className?: string` - Custom CSS class

## Hooks

### useTemplate

Hook for managing template state and operations.

**Config:**
- `template?: EmailTemplate` - Initial template
- `availableVariables?: Record<string, TemplateVariable>` - Available variables
- `onSave?: (template: EmailTemplate) => Promise<void>` - Save callback
- `onValidate?: (content: string, subject: string) => Promise<TemplateValidationResponse>` - Validation callback
- `onPreview?: (content: string, subject: string, variables: Record<string, any>) => Promise<TemplatePreviewResponse>` - Preview callback
- `autoValidate?: boolean` - Auto-validate on change
- `validationDelay?: number` - Validation debounce delay

**Returns:**
- `template: Partial<EmailTemplate>` - Current template state
- `isModified: boolean` - Whether template has been modified
- `isSaving: boolean` - Whether save is in progress
- `isValidating: boolean` - Whether validation is in progress
- `isPreviewing: boolean` - Whether preview is in progress
- `validationResult: TemplateValidationResponse | null` - Validation result
- `validationErrors: string[]` - Validation errors
- `validationWarnings: string[]` - Validation warnings
- `previewData: TemplatePreviewResponse | null` - Preview data
- `updateField: (field, value) => void` - Update template field
- `updateContent: (content: string) => void` - Update content
- `updateSubject: (subject: string) => void` - Update subject
- `save: () => Promise<void>` - Save template
- `validate: () => Promise<TemplateValidationResponse>` - Validate template
- `preview: (variables) => Promise<TemplatePreviewResponse>` - Preview template
- `render: (variables, options?) => TemplateRenderResult` - Render template
- `reset: () => void` - Reset to original state
- `canSave: boolean` - Whether template can be saved
- `hasErrors: boolean` - Whether template has errors
- `hasWarnings: boolean` - Whether template has warnings

## Utilities

### renderTemplate

Render a template with variable substitution.

```typescript
function renderTemplate(
  template: string,
  variables: Record<string, any>,
  options?: TemplateRenderOptions
): TemplateRenderResult
```

### validateTemplate

Validate template syntax and structure.

```typescript
function validateTemplate(
  content: string,
  subject: string
): TemplateValidationResponse
```

### substituteVariables

Substitute variables in a template string.

```typescript
function substituteVariables(
  template: string,
  variables: Record<string, any>,
  options?: VariableFormatOptions
): string
```

### extractVariables

Extract all variables from a template.

```typescript
function extractVariables(template: string): string[]
```

### htmlToText

Convert HTML to plain text.

```typescript
function htmlToText(html: string): string
```

### sanitizeHtml

Remove potentially dangerous HTML content.

```typescript
function sanitizeHtml(html: string): string
```

## Types

### EmailTemplate

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  category: string;
  usageCount: number;
  status: 'active' | 'inactive' | 'draft';
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### TemplateVariable

```typescript
interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  sample?: any;
}
```

## Best Practices

1. **Always validate templates** before saving or sending
2. **Use meaningful variable names** (e.g., `recipient_name` instead of `name`)
3. **Provide sample values** for all variables for preview
4. **Test with different email clients** to ensure compatibility
5. **Keep templates simple** - complex HTML may not render correctly in all clients
6. **Avoid JavaScript** - it's not supported in email clients
7. **Use inline styles** for better email client compatibility
8. **Provide plain text versions** for accessibility and spam filters

## Email Client Compatibility

The framework generates HTML that's compatible with major email clients:
- Gmail
- Outlook (desktop and web)
- Apple Mail
- Yahoo Mail
- Mobile clients (iOS Mail, Android Gmail)

**Not supported:**
- JavaScript
- External stylesheets (use inline styles)
- Complex CSS (flexbox, grid)
- Video embeds
- Forms

## Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions on migrating existing email template code to use this framework.

## Examples

See the `examples/` directory for complete working examples.

## License

Part of the MeterItPro framework.
