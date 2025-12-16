# Design Document: DataList and BaseList Consolidation

## Overview

This design fixes the broken DataList component by removing the non-functional datalist directory and creating a proper re-export alias in the list directory. Currently:

1. `framework/frontend/components/datalist/DataList.tsx` is broken (imports BaseList from wrong location)
2. `framework/frontend/components/list/index.ts` tries to export DataList from `./DataList` (doesn't exist)
3. Multiple files import DataList expecting it to work

The fix will:

1. Delete the broken datalist directory
2. Create a simple re-export file `DataList.ts` in the list directory
3. Update list/index.ts to import from the correct location
4. Maintain backward compatibility for all existing imports

## Architecture

### Current State (Broken)
```
framework/frontend/components/
├── datalist/
│   ├── DataList.tsx (BROKEN - imports BaseList from wrong location)
│   └── DataList.css
└── list/
    ├── BaseList.tsx (actual implementation)
    ├── BaseList.css
    ├── DataList.css (imported by BaseList)
    ├── index.ts (tries to export DataList from ./DataList - doesn't exist)
    └── [other list files]
```

### Target State (Fixed)
```
framework/frontend/components/
└── list/
    ├── BaseList.tsx (actual implementation)
    ├── BaseList.css
    ├── DataList.css (imported by BaseList)
    ├── DataList.ts (re-export alias for backward compatibility)
    ├── index.ts (exports both names correctly)
    └── [other list files]
```

## Components and Interfaces

### BaseList Component
- **Location**: `framework/frontend/components/list/BaseList.tsx`
- **Responsibility**: Provides the complete list layout with filters, data table, and sidebar
- **Props**: `BaseListProps<T>` interface remains unchanged
- **Exports**: Named export and default export

### DataList Alias
- **Location**: `framework/frontend/components/list/DataList.ts` (new file)
- **Responsibility**: Re-export BaseList for backward compatibility
- **Type**: Simple re-export file (not a component)
- **Purpose**: Allows existing imports to continue working without modification
- **Content**: `export { BaseList as DataList, BaseList as default } from './BaseList';`

### Framework Exports
- **Location**: `framework/frontend/index.ts`
- **Change**: Update to import from consolidated location
- **Backward Compatibility**: Both `DataList` and `BaseList` names exported

## Data Models

No changes to data models. The component interface remains:

```typescript
export interface BaseListProps<T> {
  title?: string;
  filters?: ReactNode;
  headerActions?: ReactNode;
  stats?: ReactNode;
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSelect?: (selected: T[]) => void;
  bulkActions?: BulkAction<T>[];
  pagination?: DataTableProps<T>['pagination'];
  responsive?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. 
Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: DataList and BaseList are equivalent
*For any* component import path, importing DataList and importing BaseList should provide the same component with identical functionality.

**Validates: Requirements 1.1, 1.2**

### Property 2: Backward compatibility maintained
*For any* existing code that imports DataList from `@framework/components/list`, the import should continue to work without modification after consolidation.

**Validates: Requirements 1.3**

### Property 3: No duplicate logic
*For any* list-related functionality, the implementation should exist in exactly one location (BaseList), with no duplicated code across multiple files.

**Validates: Requirements 2.4, 3.1**

### Property 4: Single export path
*For any* list component import from the framework, the import should resolve to the consolidated BaseList component regardless of whether DataList or BaseList name is used.

**Validates: Requirements 3.4**

## Error Handling

No new error handling required. The consolidated component will maintain existing error handling from BaseList.

## Testing Strategy

### Unit Testing
- Verify that DataList re-export provides the same component as BaseList
- Test that all existing BaseList functionality continues to work
- Verify that component props and behavior are unchanged

### Property-Based Testing
- **Property 1**: Generate random component props and verify DataList and BaseList render identically
- **Property 2**: Verify that imports from both paths resolve to the same component
- **Property 3**: Scan codebase to ensure no duplicate list component logic exists
- **Property 4**: Verify that all framework exports correctly point to consolidated component

### Integration Testing
- Run existing tests for all components that use DataList
- Verify that no import paths break
- Test that all features (filtering, sorting, pagination, etc.) continue to work

## Implementation Notes

1. **No Logic Changes**: This is purely a structural fix. No component logic will be modified.
2. **Broken Code Removal**: The broken `framework/frontend/components/datalist/` directory will be deleted entirely.
3. **CSS Consolidation**: The `DataList.css` file is already imported by BaseList. It will remain in the list directory.
4. **Export Strategy**: Create a simple re-export file (`DataList.ts`) in the list directory to maintain backward compatibility.
5. **Framework Exports**: The `framework/frontend/index.ts` already exports from `./components/list`, so no changes needed there.
6. **Client Code**: No changes needed to client code that imports DataList - it will continue to work after the fix.
7. **Import Fix**: The list/index.ts already tries to export DataList, but after creating the DataList.ts file, the import will resolve correctly.
