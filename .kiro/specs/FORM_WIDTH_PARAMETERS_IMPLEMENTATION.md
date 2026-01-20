# Form Layout System - Smart Grid & Flexbox Implementation

## Overview
Implemented a comprehensive form layout system with:
- Dynamic form width constraints (`formMaxWidth`, `formMinWidth`)
- Smart grid layout that adapts to section count
- Section orientation control (horizontal/vertical)
- Individual section width constraints (`minWidth`, `maxWidth`)
- Flexbox support for intelligent section sizing
- Automatic layout switching between grid and flexbox

## Key Features

### 1. Smart Layout Switching
- **Grid Layout (Default)**: Used when no flex properties are specified
- **Flexbox Layout (Smart)**: Automatically activated when any section has flex properties
- Allows sections to grow/shrink based on available space

### 2. Section Sizing Options
- `maxWidth`: Limit section width (e.g., `'100px'`)
- `minWidth`: Set minimum section width (e.g., `'300px'`)
- `flex`: Shorthand for flex-grow, flex-shrink, flex-basis (e.g., `1`)
- `flexGrow`: How much section grows relative to others (e.g., `2`)
- `flexShrink`: How much section shrinks when space is limited (e.g., `1`)

### 3. Orientation Control
- `sectionOrientation: 'horizontal'` (default): Sections arrange side-by-side
- `sectionOrientation: 'vertical'`: Sections stack vertically

## Schema Usage Examples

### Example 1: Smart Flex Layout (Information + Status)
```javascript
{
  name: 'Contact',
  order: 1,
  sections: [
    section({
      name: 'Information',
      order: 1,
      flex: 1,  // Takes remaining space
      fields: ['name', 'company', 'email']
    }),
    section({
      name: 'Status',
      order: 2,
      maxWidth: '100px',  // Fixed width on right
      fields: ['status']
    })
  ]
}
```

**Result**: Information section takes all available space, Status section stays fixed at 100px on the right.

### Example 2: Proportional Flex
```javascript
{
  name: 'Layout',
  order: 1,
  sections: [
    section({
      name: 'Main',
      flex: 2,  // Takes 2x the space
      fields: ['content']
    }),
    section({
      name: 'Sidebar',
      flex: 1,  // Takes 1x the space
      fields: ['sidebar_content']
    })
  ]
}
```

**Result**: Main section takes 2/3 of space, Sidebar takes 1/3.

### Example 3: Vertical Orientation
```javascript
{
  name: 'Additional Info',
  order: 3,
  sectionOrientation: 'vertical',  // Stack vertically
  sections: [
    section({
      name: 'Details',
      order: 1,
      fields: ['description', 'notes']
    }),
    section({
      name: 'Status',
      order: 2,
      maxWidth: '100px',
      fields: ['status']
    })
  ]
}
```

**Result**: Sections stack vertically, Status section width limited to 100px.

### Example 4: Equal Width Sections
```javascript
{
  name: 'Basic Info',
  order: 1,
  sections: [
    section({
      name: 'Personal',
      flex: 1,
      fields: ['name', 'email']
    }),
    section({
      name: 'Contact',
      flex: 1,
      fields: ['phone', 'address']
    })
  ]
}
```

**Result**: Both sections take equal space.

## Component Usage

### Basic Form with Width Constraints
```typescript
<BaseForm
  schemaName="contact"
  entity={contact}
  store={contacts}
  onCancel={onCancel}
  formMaxWidth="800px"
  formMinWidth="350px"
/>
```

### Form with Flex Layout
```typescript
<BaseForm
  schemaName="contact"
  entity={contact}
  store={contacts}
  onCancel={onCancel}
  className="contact-form"
  fieldSections={fieldSections}
  loading={loading}
  validationDataProvider={validationDataProvider}
  showSidebar={false}
  showTabs={false}
  formMaxWidth="1000px"
/>
```

## Flex Properties Reference

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `flex` | number | Shorthand for flex-grow, flex-shrink, flex-basis | `flex: 1` |
| `flexGrow` | number | How much section grows relative to others | `flexGrow: 2` |
| `flexShrink` | number | How much section shrinks when space is limited | `flexShrink: 1` |
| `maxWidth` | string | Maximum width constraint | `maxWidth: '100px'` |
| `minWidth` | string | Minimum width constraint | `minWidth: '300px'` |

## CSS Units Supported

- Pixels: `"800px"`, `"100px"`
- Percentages: `"90%"`, `"50%"`
- Relative units: `"50em"`, `"60rem"`
- Viewport units: `"80vw"`
- Calc expressions: `"calc(100% - 40px)"`

## Implementation Details

### Smart Layout Detection
```typescript
const shouldUseFlexbox = () => {
  const sections = schema?.formTabs
    ?.flatMap(tab => tab.sections || [])
    .filter(sec => Object.keys(sectionsToRender).includes(sec.name)) || [];
  
  // Use flexbox if any section has flex properties
  return sections.some(sec => 
    sec.flex !== undefined || 
    sec.flexGrow !== undefined || 
    sec.flexShrink !== undefined
  );
};
```

### Sections Container
```typescript
<div 
  style={{
    display: useFlexbox ? 'flex' : 'grid',
    ...(useFlexbox ? {
      flexDirection: 'row',
      gap: '1.25rem',
      width: '100%',
      alignItems: 'flex-start',
    } : {
      gridTemplateColumns: calculateGridColumns(),
      gap: '1.25rem',
      width: '100%',
    }),
  }}
>
```

### Section Styling
```typescript
<div 
  style={{
    ...(sectionMinWidth && { minWidth: sectionMinWidth }),
    ...(sectionMaxWidth && { maxWidth: sectionMaxWidth }),
    ...(sectionFlex !== undefined && { flex: sectionFlex }),
    ...(sectionFlexGrow !== undefined && { flexGrow: sectionFlexGrow }),
    ...(sectionFlexShrink !== undefined && { flexShrink: sectionFlexShrink }),
  }}
>
```

## Testing Checklist

- [ ] Add `formMaxWidth="800px"` and verify form respects constraint
- [ ] Add `formMinWidth="350px"` and verify form respects constraint
- [ ] Resize browser window and verify responsive behavior
- [ ] Add `flex: 1` to one section and `maxWidth: '100px'` to another
- [ ] Verify first section takes remaining space, second stays fixed
- [ ] Test proportional flex: `flex: 2` and `flex: 1`
- [ ] Add `sectionOrientation: 'vertical'` and verify sections stack
- [ ] Verify grid layout used when no flex properties present
- [ ] Verify flexbox layout used when flex properties detected
- [ ] Test combinations of form-level and section-level constraints
- [ ] Test with different CSS units (px, %, em, rem, vw, calc)
- [ ] Verify backward compatibility with existing forms

## Benefits

✅ **Flexible Layouts**: Create complex layouts without custom CSS
✅ **Responsive**: Automatically adapts to available space
✅ **Schema-Driven**: All layout defined in schema, not code
✅ **Smart Switching**: Automatically uses best layout method
✅ **Type-Safe**: Full TypeScript support
✅ **Backward Compatible**: Existing forms work unchanged
✅ **No Breaking Changes**: Opt-in feature
