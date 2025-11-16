# Email Templates Framework Analysis

## Existing Email Template Patterns

### Components Identified

1. **EmailTemplateList.tsx** - Full-featured list component with:
   - CRUD operations (create, read, update, delete)
   - Search and filtering
   - Pagination
   - Bulk actions (activate, deactivate, set as draft)
   - Export/import functionality
   - Preview and duplicate features
   - Status management (active, inactive, draft)
   - Category filtering

2. **EmailTemplateListSimple.tsx** - Simplified list using useBaseList hook:
   - Uses framework's list infrastructure
   - Configured with emailTemplateConfig
   - Integrates with templatesStore

3. **TemplateForm.tsx** - Comprehensive form component with:
   - Template creation and editing
   - Rich text editor integration
   - Variable management
   - Template validation
   - Preview functionality
   - Category selection
   - Help dialog

4. **TemplateEditor.tsx** - Rich text editor with:
   - WYSIWYG editing capabilities
   - Formatting toolbar (bold, italic, underline, lists, links, images)
   - Variable insertion with formatting options
   - Keyboard shortcuts
   - Variable helper panel
   - Preview integration

### Template Rendering Logic

1. **Variable Substitution**:
   - Variables use Handlebars-style syntax: `{{variable_name}}`
   - Support for formatting: `{{variable_name | format}}`
   - Conditional logic: `{{#if condition}}...{{/if}}`
   - Loops: `{{#each items}}...{{/each}}`

2. **Rendering Process**:
   - Template validation checks for syntax errors
   - Variable extraction identifies all variables in template
   - Preview renders template with sample data
   - Final rendering substitutes actual values

3. **Template Service** (templateService.ts):
   - API integration for CRUD operations
   - Preview generation with variable substitution
   - Template validation
   - Variable availability by category
   - Export/import functionality
   - Usage statistics tracking

### Template Variables

1. **Variable Structure**:
   ```typescript
   interface TemplateVariable {
     name: string;
     description: string;
     type: 'text' | 'number' | 'date' | 'boolean';
     required: boolean;
     defaultValue?: any;
   }
   ```

2. **Variable Categories**:
   - **meter_readings**: Meter-related variables (meter_id, reading_value, timestamp, location_name)
   - **meter_errors**: Error notification variables (error_type, error_message, meter_id)
   - **maintenance**: Maintenance schedule variables (maintenance_date, technician_name, location)
   - **general**: General purpose variables (recipient_name, company_name, current_date)

3. **Variable Features**:
   - Type-specific formatting (date, currency, number)
   - Required vs optional variables
   - Default values
   - Sample data for preview
   - Description for user guidance

### Data Models

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

### Key Features to Migrate

1. **Template Editor**:
   - Rich text editing with toolbar
   - Variable insertion and management
   - Preview functionality
   - Validation

2. **Template Management**:
   - CRUD operations
   - Status management
   - Category organization
   - Usage tracking

3. **Variable System**:
   - Variable definition and validation
   - Category-specific variables
   - Formatting options
   - Sample data for preview

4. **Rendering Engine**:
   - Variable substitution
   - Conditional logic
   - Loop support
   - HTML and text output

## Migration Strategy

### Phase 1: Core Types and Utilities
- Migrate template types
- Create variable substitution utilities
- Create template rendering utilities

### Phase 2: Components
- Migrate TemplateEditor component
- Create TemplatePreview component
- Create reusable template components

### Phase 3: Hooks
- Create useTemplate hook for state management
- Create useTemplateEditor hook for editing logic
- Create useTemplateValidation hook

### Phase 4: Integration
- Update client to use framework components
- Test all template functionality
- Ensure backward compatibility

## Dependencies

- React and Material-UI for UI components
- Rich text editor (contentEditable API)
- Template rendering engine (Handlebars-like syntax)
- API service for backend integration

## Notes

- Templates support HTML content with rich formatting
- Variable system is extensible for new categories
- Preview uses sample data from backend
- Export/import uses JSON format
- Validation checks for syntax errors and missing variables
