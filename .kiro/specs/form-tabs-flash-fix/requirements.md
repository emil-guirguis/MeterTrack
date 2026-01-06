# Requirements Document: Form Tabs Flash Fix

## Introduction

When opening forms with tabs, form fields initially display in a flat, unorganized layout on the screen. After a brief moment, tabs are created and fields reorganize into their proper tab sections. This visual "flash" creates a jarring user experience and makes the form appear unstable or broken.

The goal is to ensure fields are only displayed once, already organized into their proper tabs from the moment the form renders.

## Glossary

- **Form**: A component that collects user input with multiple fields
- **Tab**: A named section within a form that groups related fields
- **Section**: A subsection within a tab that further organizes fields
- **Field**: An individual input element (text, select, checkbox, etc.)
- **Flash**: An undesired visual change where content appears, disappears, or reorganizes immediately after rendering
- **Schema**: The backend definition of form structure, fields, tabs, and sections
- **FormTabs**: The React component that renders tab navigation
- **BaseForm**: The main form component that renders fields and tabs

## Requirements

### Requirement 1: Prevent Field Flash on Form Load

**User Story:** As a user, I want forms to display cleanly without visual reorganization, so that the form appears stable and professional.

#### Acceptance Criteria

1. WHEN a form with tabs is opened, THE BaseForm SHALL render fields organized into tabs from the initial render
2. WHEN a form with tabs is opened, THE fields SHALL NOT appear in a flat layout before tabs are created
3. WHEN a form with tabs is opened, THE FormTabs component SHALL be rendered at the same time as the organized fields
4. WHEN the form schema is loading, THE BaseForm SHALL display a loading state instead of unorganized fields

### Requirement 2: Ensure Tab Organization Happens Before Rendering

**User Story:** As a developer, I want the form to calculate tab and section organization before rendering any fields, so that the rendering is clean and efficient.

#### Acceptance Criteria

1. WHEN the form component mounts, THE tab structure SHALL be determined before any fields are rendered
2. WHEN the form component mounts, THE active tab SHALL be set before rendering field content
3. WHEN the form component mounts, THE field sections for the active tab SHALL be calculated before rendering
4. WHEN the form schema changes, THE tab structure SHALL be recalculated before re-rendering fields

### Requirement 3: Coordinate FormTabs and Field Rendering

**User Story:** As a user, I want tabs and fields to appear together as a cohesive unit, so that the form layout is immediately clear.

#### Acceptance Criteria

1. WHEN tabs are present, THE FormTabs component SHALL render in the same render cycle as the organized fields
2. WHEN tabs are present, THE FormTabs component SHALL be positioned above the field sections
3. WHEN only one tab exists, THE FormTabs component SHALL not be rendered (fields display without tab navigation)
4. WHEN switching tabs, THE field content SHALL update without any flash or reorganization

### Requirement 4: Handle Loading and Error States Properly

**User Story:** As a user, I want clear feedback when the form is loading or encounters an error, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN the form schema is loading, THE BaseForm SHALL display a loading message
2. WHEN the form schema fails to load, THE BaseForm SHALL display an error message
3. WHEN the form schema is loading, THE fields SHALL NOT be rendered in an unorganized state
4. WHEN the form schema fails to load, THE fields SHALL NOT be rendered at all
