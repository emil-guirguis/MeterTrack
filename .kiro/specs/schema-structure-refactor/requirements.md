# Requirements: Schema Structure Refactoring

## Introduction

Refactor the schema definition structure to use a hierarchical tab/section/field organization at the schema level instead of embedding formGrouping metadata in each field definition. This provides better organization, clearer intent, and easier maintenance.

## Glossary

- **Schema**: The complete definition of an entity including fields, tabs, and relationships
- **Tab**: A top-level grouping of related sections (e.g., "Contact", "Address", "Additional Info")
- **Section**: A grouping of related fields within a tab (e.g., "Basic Information", "Contact Methods")
- **Field**: An individual data field with its type, validation, and metadata
- **FormGrouping**: Current metadata structure embedded in each field (to be replaced)
- **TabStructure**: New hierarchical structure organizing tabs, sections, and fields

## Requirements

### Requirement 1: Define New Schema Structure

**User Story:** As a developer, I want to define form organization at the schema level, so that the structure is clear and maintainable.

#### Acceptance Criteria

1. WHEN defining a schema, THE Schema SHALL support a `formTabs` property at the top level
2. WHEN defining formTabs, THE Schema SHALL organize tabs hierarchically with name and order
3. WHEN defining sections within tabs, THE Schema SHALL organize sections with name and order
4. WHEN defining fields within sections, THE Schema SHALL reference field names with order
5. THE Schema formTabs structure SHALL be optional (backward compatible with existing schemas)

### Requirement 2: Maintain Field Definitions

**User Story:** As a developer, I want field definitions to remain simple, so that I don't duplicate metadata.

#### Acceptance Criteria

1. WHEN a field is defined in formFields, THE Field SHALL contain only type, validation, and display metadata
2. WHEN a field is referenced in formTabs, THE Field name SHALL be the only reference needed
3. WHEN a field is not referenced in formTabs, THE Field SHALL still be available but not organized in tabs
4. THE formGrouping property SHALL be deprecated but still supported for backward compatibility

### Requirement 3: Support Tab Organization

**User Story:** As a developer, I want to organize form fields into tabs and sections, so that forms are well-structured.

#### Acceptance Criteria

1. WHEN rendering a form, THE Form SHALL read the formTabs structure from the schema
2. WHEN formTabs is defined, THE Form SHALL organize fields according to the tab hierarchy
3. WHEN formTabs is not defined, THE Form SHALL fall back to formGrouping metadata
4. WHEN formTabs is not defined and formGrouping is not present, THE Form SHALL organize fields by default tab

### Requirement 4: Backward Compatibility

**User Story:** As a developer, I want existing schemas to continue working, so that migration is gradual.

#### Acceptance Criteria

1. WHEN a schema uses formGrouping, THE System SHALL continue to work without changes
2. WHEN a schema uses formTabs, THE System SHALL prioritize formTabs over formGrouping
3. WHEN a schema uses both formTabs and formGrouping, THE formTabs SHALL take precedence
4. WHEN migrating schemas, THE Developer SHALL be able to migrate one schema at a time

### Requirement 5: Update SchemaDefinition Helper

**User Story:** As a developer, I want helper functions to define tabs, so that schema definition is clean.

#### Acceptance Criteria

1. WHEN defining a schema, THE defineSchema function SHALL accept a formTabs property
2. WHEN defining tabs, THE Schema SHALL provide a `tab()` helper function
3. WHEN defining sections, THE Schema SHALL provide a `section()` helper function
4. WHEN defining field references, THE Schema SHALL provide a `fieldRef()` helper function

### Requirement 6: Update useFormTabs Hook

**User Story:** As a developer, I want the form hook to support both structures, so that forms work with either organization method.

#### Acceptance Criteria

1. WHEN useFormTabs receives a schema with formTabs, THE Hook SHALL use the formTabs structure
2. WHEN useFormTabs receives a schema without formTabs, THE Hook SHALL fall back to formGrouping
3. WHEN organizing fields, THE Hook SHALL produce the same output regardless of source structure
4. THE Hook output SHALL remain compatible with existing form rendering code

## Example New Structure

```javascript
const schema = defineSchema({
  entityName: 'Contact',
  tableName: 'contact',
  
  // NEW: Hierarchical tab structure with embedded fields
  formTabs: [
    tab({
      name: 'Contact',
      order: 1,
      sections: [
        section({
          name: 'Basic Information',
          order: 1,
          minWidth: '300px',
          maxWidth: '600px',
          fields: [
            formField({
              name: 'name',
              order: 1,
              type: FieldTypes.STRING,
              required: true,
              label: 'Name',
              dbField: 'name',
              minLength: 2,
              maxLength: 100,
              placeholder: 'John Doe',
              minWidth: '250px',
              maxWidth: '500px',
            }),
            formField({
              name: 'company',
              order: 2,
              type: FieldTypes.STRING,
              required: false,
              label: 'Company',
              dbField: 'company',
              maxLength: 200,
              placeholder: 'Acme Corporation',
              minWidth: '250px',
              maxWidth: '500px',
            }),
            formField({
              name: 'role',
              order: 3,
              type: FieldTypes.STRING,
              required: false,
              label: 'Role',
              dbField: 'role',
              enumValues: ['Vendor', 'Customer', 'Contractor', 'Technician', 'Client', 'Sales Manager'],
              minWidth: '200px',
              maxWidth: '400px',
            }),
            formField({
              name: 'email',
              order: 4,
              type: FieldTypes.EMAIL,
              required: true,
              label: 'Email',
              dbField: 'email',
              maxLength: 254,
              placeholder: 'john@example.com',
              minWidth: '250px',
              maxWidth: '500px',
            }),
          ],
        }),
        section({
          name: 'Contact Methods',
          order: 2,
          minWidth: '300px',
          maxWidth: '600px',
          fields: [
            formField({
              name: 'phone',
              order: 1,
              type: FieldTypes.PHONE,
              required: false,
              label: 'Phone',
              dbField: 'phone',
              maxLength: 50,
              placeholder: '(555) 123-4567',
              minWidth: '200px',
              maxWidth: '400px',
            }),
            formField({
              name: 'active',
              order: 2,
              type: FieldTypes.BOOLEAN,
              required: true,
              label: 'Active',
              dbField: 'active',
              minWidth: '150px',
              maxWidth: '300px',
            }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Address',
      order: 2,
      sections: [
        section({
          name: 'Address Information',
          order: 1,
          minWidth: '300px',
          maxWidth: '600px',
          fields: [
            formField({
              name: 'street',
              order: 1,
              type: FieldTypes.STRING,
              required: false,
              label: 'Street Address',
              dbField: 'street',
              maxLength: 200,
              placeholder: '123 Main St',
              minWidth: '250px',
              maxWidth: '500px',
            }),
            formField({
              name: 'street2',
              order: 2,
              type: FieldTypes.STRING,
              required: false,
              label: 'Street Address 2',
              dbField: 'street2',
              maxLength: 100,
              placeholder: 'Suite 100',
              minWidth: '250px',
              maxWidth: '500px',
            }),
            formField({
              name: 'city',
              order: 3,
              type: FieldTypes.STRING,
              required: false,
              label: 'City',
              dbField: 'city',
              maxLength: 100,
              placeholder: 'New York',
              minWidth: '200px',
              maxWidth: '400px',
            }),
            formField({
              name: 'state',
              order: 4,
              type: FieldTypes.STRING,
              required: false,
              label: 'State',
              dbField: 'state',
              maxLength: 50,
              placeholder: 'NY',
              minWidth: '150px',
              maxWidth: '300px',
            }),
            formField({
              name: 'zip',
              order: 5,
              type: FieldTypes.STRING,
              required: false,
              label: 'ZIP Code',
              dbField: 'zip',
              maxLength: 20,
              placeholder: '10001',
              minWidth: '150px',
              maxWidth: '300px',
            }),
            formField({
              name: 'country',
              order: 6,
              type: FieldTypes.COUNTRY,
              required: true,
              label: 'Country',
              dbField: 'country',
              maxLength: 100,
              placeholder: 'USA',
              minWidth: '200px',
              maxWidth: '400px',
            }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Additional Info',
      order: 3,
      sections: [
        section({
          name: 'Notes',
          order: 1,
          minWidth: '300px',
          maxWidth: '600px',
          fields: [
            formField({
              name: 'notes',
              order: 1,
              type: FieldTypes.STRING,
              required: false,
              label: 'Notes',
              dbField: 'notes',
              maxLength: 5000,
              placeholder: 'Additional notes...',
              minWidth: '250px',
              maxWidth: '500px',
            }),
          ],
        }),
        section({
          name: 'Audit',
          order: 2,
          minWidth: '300px',
          maxWidth: '600px',
          fields: [
            formField({
              name: 'created_at',
              order: 1,
              type: FieldTypes.DATE,
              readOnly: true,
              label: 'Created At',
              dbField: 'created_at',
              minWidth: '200px',
              maxWidth: '400px',
            }),
            formField({
              name: 'updated_at',
              order: 2,
              type: FieldTypes.DATE,
              readOnly: true,
              label: 'Updated At',
              dbField: 'updated_at',
              minWidth: '200px',
              maxWidth: '400px',
            }),
          ],
        }),
      ],
    }),
  ],
});
```

## Benefits

1. **Clarity**: Tab structure is immediately visible at schema level
2. **Maintainability**: Changes to organization don't require editing every field
3. **Reusability**: Sections can be easily reordered or reorganized
4. **Scalability**: Easier to manage complex forms with many fields
5. **Documentation**: Schema structure serves as form documentation

## Migration Path

1. Phase 1: Add formTabs support to SchemaDefinition and useFormTabs hook
2. Phase 2: Update Contact schema to use formTabs
3. Phase 3: Update remaining schemas (Device, User, Location, Meter)
4. Phase 4: Deprecate formGrouping in favor of formTabs
5. Phase 5: Remove formGrouping support (future major version)
