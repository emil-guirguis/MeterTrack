# Design: Form Section Orientation Fix

## Overview

The form layout system needs to properly respect the `sectionOrientation` property defined at the tab level. Currently, the BaseForm component reads this property but the CSS grid layout classes override the inline styles that should enforce vertical orientation. This design addresses the root cause: CSS specificity issues and the need to apply orientation-aware layout logic.

## Architecture

### Current Flow (Broken)
1. Schema defines `sectionOrientation: 'vertical'` at tab level
2. BaseForm reads the orientation in `calculateGridColumns()`
3. Function returns '1fr' for vertical orientation
4. Inline style `grid-template-columns: '1fr'` is applied to `.base-form__sections-container`
5. **Problem**: CSS classes like `.base-form__main--grid-2` have `!important` and override inline styles
6. Result: Sections still render in multi-column layout

### Fixed Flow
1. Schema defines `sectionOrientation: 'vertical'` at tab level
2. BaseForm reads orientation and determines layout mode (grid vs flexbox)
3. For vertical orientation with flex properties: Use flexbox with `flex-direction: column`
4. For vertical orientation without flex: Use grid with single column
5. Apply layout via inline styles with proper CSS specificity
6. Remove `!important` from CSS grid classes or use more specific selectors

## Components and Interfaces

### BaseForm Component Changes

**Current calculateGridColumns() function:**
```typescript
const calculateGridColumns = () => {
  const sectionsToRender = fieldSections || formTabsFieldSections || {};
  const sectionCount = Object.keys(sectionsToRender).length;
  
  const activeTabData = schema?.formTabs?.find(tab => tab.name === effectiveActiveTab);
  const orientation = activeTabData?.sectionOrientation || 'horizontal';
  
  if (orientation === 'vertical') {
    return '1fr';  // This gets overridden by CSS classes!
  }
  
  if (sectionCount === 0) return '1fr';
  if (sectionCount === 1) return '1fr';
  if (sectionCount === 2) return 'repeat(2, 1fr)';
  return 'repeat(3, 1fr)';
};
```

**New approach:**
- Create a `getLayoutStyle()` function that returns complete layout configuration
- Returns object with `display`, `gridTemplateColumns`, `flexDirection`, etc.
- Handles both grid and flexbox layouts based on orientation and flex properties
- Applies styles directly to `.base-form__sections-container`

### Layout Calculation Logic

**New function: `getLayoutStyle()`**
```typescript
const getLayoutStyle = () => {
  const sectionsToRender = fieldSections || formTabsFieldSections || {};
  const activeTabData = schema?.formTabs?.find(tab => tab.name === effectiveActiveTab);
  const orientation = activeTabData?.sectionOrientation || 'horizontal';
  const useFlexbox = shouldUseFlexbox();
  
  // Vertical orientation: always single column
  if (orientation === 'vertical') {
    if (useFlexbox) {
      return {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%',
        alignItems: 'stretch',
      };
    } else {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.25rem',
        width: '100%',
      };
    }
  }
  
  // Horizontal orientation: multi-column based on section count
  const sectionCount = Object.keys(sectionsToRender).length;
  let columns = '1fr';
  if (sectionCount === 2) columns = 'repeat(2, 1fr)';
  if (sectionCount >= 3) columns = 'repeat(3, 1fr)';
  
  if (useFlexbox) {
    return {
      display: 'flex',
      flexDirection: 'row',
      gap: '1.25rem',
      width: '100%',
      alignItems: 'flex-start',
    };
  } else {
    return {
      display: 'grid',
      gridTemplateColumns: columns,
      gap: '1.25rem',
      width: '100%',
    };
  }
};
```

## Data Models

### Tab Schema Structure
```typescript
interface Tab {
  name: string;
  order?: number | null;
  sectionOrientation?: 'horizontal' | 'vertical' | null;  // NEW: Controls section layout
  sections: Section[];
}

interface Section {
  name: string;
  order?: number | null;
  fields: FieldRef[];
  minWidth?: string | null;
  maxWidth?: string | null;
  flex?: number | null;           // For flexbox layouts
  flexGrow?: number | null;       // For flexbox layouts
  flexShrink?: number | null;     // For flexbox layouts
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Vertical Orientation Single Column

**For any** tab with `sectionOrientation: 'vertical'`, when that tab is active, the rendered sections container SHALL have `grid-template-columns: 1fr` or `flex-direction: column`, ensuring all sections stack vertically in a single column.

**Validates: Requirements 1.1, 1.2**

### Property 2: Horizontal Orientation Multi-Column

**For any** tab with `sectionOrientation: 'horizontal'` (or undefined), when that tab is active with N sections, the rendered sections container SHALL have `grid-template-columns` set to accommodate N columns (1fr for 1 section, repeat(2, 1fr) for 2 sections, repeat(3, 1fr) for 3+ sections).

**Validates: Requirements 1.2**

### Property 3: Orientation Persistence Across Tab Switches

**For any** form with multiple tabs having different orientations, switching from one tab to another SHALL immediately apply the correct layout for the newly active tab without requiring a page refresh or manual intervention.

**Validates: Requirements 1.3**

### Property 4: Flex Properties with Vertical Orientation

**For any** section with flex properties in a tab with `sectionOrientation: 'vertical'`, the section SHALL use flexbox layout with `flex-direction: column` and the flex values SHALL control vertical space distribution.

**Validates: Requirements 1.4, 2.1, 2.2**

## Error Handling

1. **Missing sectionOrientation**: Default to 'horizontal' (current behavior)
2. **Invalid orientation value**: Log warning and default to 'horizontal'
3. **Conflicting flex and grid**: Detect flex properties and switch to flexbox layout automatically
4. **CSS specificity issues**: Use inline styles with proper precedence to override CSS classes

## Testing Strategy

### Unit Tests
- Test `getLayoutStyle()` function with various orientation and section count combinations
- Test that vertical orientation returns single-column layout
- Test that horizontal orientation returns multi-column layout based on section count
- Test flex property detection and flexbox layout selection
- Test tab switching updates layout correctly

### Property-Based Tests

**Property 1: Vertical Orientation Single Column**
- Generate random tabs with `sectionOrientation: 'vertical'`
- Render form with each tab
- Verify computed style has `grid-template-columns: 1fr` or `flex-direction: column`

**Property 2: Horizontal Orientation Multi-Column**
- Generate random tabs with `sectionOrientation: 'horizontal'` and varying section counts
- Render form with each tab
- Verify computed style matches expected column count

**Property 3: Orientation Persistence**
- Generate form with multiple tabs of different orientations
- Switch between tabs multiple times
- Verify layout updates correctly each time

**Property 4: Flex Properties with Vertical**
- Generate tabs with `sectionOrientation: 'vertical'` and sections with flex properties
- Render form
- Verify flexbox layout is used and flex values are applied

## Implementation Notes

1. **CSS Specificity**: The `.base-form__main--grid-1/2/3` classes use `!important` which overrides inline styles. Either:
   - Remove `!important` from CSS classes
   - Use more specific selectors in CSS
   - Apply styles via JavaScript class manipulation instead of inline styles

2. **Flexbox vs Grid**: 
   - Use flexbox when sections have flex properties
   - Use grid for simple multi-column layouts
   - Vertical orientation with flexbox: `flex-direction: column`
   - Vertical orientation with grid: `grid-template-columns: 1fr`

3. **Backward Compatibility**: 
   - Default to horizontal orientation if not specified
   - Existing forms without `sectionOrientation` continue to work as before

