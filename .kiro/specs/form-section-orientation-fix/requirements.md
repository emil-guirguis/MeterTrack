# Requirements: Form Section Orientation Fix

## Introduction

The `sectionOrientation: 'vertical'` property defined at the tab level in form schemas is not being properly applied to the form layout. When set to 'vertical', sections should stack vertically (single column), but currently the layout ignores this setting and applies the default horizontal (multi-column) layout.

## Glossary

- **Tab**: A top-level grouping of form sections, defined in `formTabs` array
- **Section**: A container within a tab that groups related form fields
- **Section Orientation**: The layout direction for sections within a tab ('horizontal' or 'vertical')
- **Horizontal Orientation**: Sections arranged side-by-side in multiple columns (default)
- **Vertical Orientation**: Sections stacked vertically in a single column
- **Grid Layout**: CSS Grid used for multi-column layouts
- **Flexbox Layout**: CSS Flexbox used for flexible layouts with flex properties

## Requirements

### Requirement 1: Respect Tab-Level Section Orientation

**User Story:** As a form designer, I want to specify `sectionOrientation: 'vertical'` at the tab level, so that sections within that tab stack vertically instead of side-by-side.

#### Acceptance Criteria

1. WHEN a tab has `sectionOrientation: 'vertical'` defined, THE BaseForm component SHALL render all sections in that tab in a single column layout
2. WHEN a tab has `sectionOrientation: 'horizontal'` or no orientation defined, THE BaseForm component SHALL render sections in a multi-column layout based on section count
3. WHEN switching between tabs with different orientations, THE BaseForm component SHALL immediately apply the correct layout for the active tab
4. WHEN a tab has `sectionOrientation: 'vertical'` and sections have flex properties, THE BaseForm component SHALL use flexbox layout with vertical direction instead of grid

### Requirement 2: Preserve Flex Properties with Vertical Orientation

**User Story:** As a form designer, I want flex properties to work correctly with vertical orientation, so that sections can have proportional heights.

#### Acceptance Criteria

1. WHEN a section has `flex: 1` and the tab has `sectionOrientation: 'vertical'`, THE section SHALL grow to fill available vertical space proportionally
2. WHEN multiple sections have different flex values in a vertical tab, THE sections SHALL distribute vertical space according to their flex ratios
3. WHEN a section has `minWidth` or `maxWidth` in a vertical tab, THE BaseForm component SHALL ignore width constraints and apply height constraints if specified

### Requirement 3: CSS Grid Override Issue

**User Story:** As a developer, I want the CSS grid layout classes to not override inline styles, so that dynamic orientation changes work correctly.

#### Acceptance Criteria

1. WHEN `calculateGridColumns()` returns '1fr' for vertical orientation, THE inline style SHALL take precedence over CSS grid classes
2. WHEN the `.base-form__main--grid-1`, `.base-form__main--grid-2`, or `.base-form__main--grid-3` classes are applied, THE inline `grid-template-columns` style SHALL override the CSS class definition
3. WHEN switching tabs, THE grid layout SHALL update immediately without requiring a page refresh

