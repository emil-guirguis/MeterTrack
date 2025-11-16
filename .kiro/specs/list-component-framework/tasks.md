# Implementation Plan

- [x] 1. Create type definitions and interfaces




  - Create `client/frontend/src/types/list.ts` with all framework type definitions
  - Define `BaseListConfig`, `BaseListReturn`, `FilterDefinition`, `StatDefinition`, `BulkActionConfig`, `ExportConfig`, `ImportConfig` interfaces
  - Export all types for use in list components
  - _Requirements: 1.1, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2. Implement helper utilities





  - [x] 2.1 Create list helpers utility


    - Create `client/frontend/src/utils/listHelpers.ts`
    - Implement `buildFilters()` function to construct filter objects
    - Implement `extractUniqueValues()` function for filter options
    - Implement `debounceSearch()` function for search input
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Create export helpers utility


    - Create `client/frontend/src/utils/exportHelpers.ts`
    - Implement `generateCSV()` function with proper escaping
    - Implement `downloadCSV()` function for file download
    - Implement `escapeCSVValue()` for special character handling
    - _Requirements: 4.3, 4.4_

  - [x] 2.3 Create import helpers utility


    - Create `client/frontend/src/utils/importHelpers.ts`
    - Implement `parseCSV()` function to parse uploaded files
    - Implement `validateImportData()` function for data validation
    - Implement `generateImportTemplate()` function for template download
    - _Requirements: 4.3, 4.4_

  - [x] 2.4 Create render helpers utility


    - Create `client/frontend/src/utils/renderHelpers.tsx`
    - Implement `renderStatusBadge()` component for status indicators
    - Implement `renderTwoLineCell()` component for two-line table cells
    - Implement `renderDateCell()` component for date formatting
    - Implement `renderBadgeList()` component for tag/badge lists
    - _Requirements: 5.3, 5.4_

- [x] 3. Implement useBaseList hook





  - [x] 3.1 Create hook file and basic structure


    - Create `client/frontend/src/hooks/useBaseList.ts`
    - Set up TypeScript generics for entity type and store type
    - Define hook parameters using `BaseListConfig` interface
    - Define hook return type using `BaseListReturn` interface
    - _Requirements: 1.1, 1.2, 8.1_

  - [x] 3.2 Implement state management


    - Initialize state for search query, filters, modals
    - Implement `setSearchQuery()` with debouncing
    - Implement `setFilter()` and `clearFilters()` functions
    - Implement modal state management (export, import)
    - _Requirements: 1.1, 2.1, 2.4_

  - [x] 3.3 Implement permission and feature flag logic


    - Integrate with `useAuth()` hook for permission checks
    - Implement `canCreate`, `canUpdate`, `canDelete` computed values
    - Implement `canExport`, `canImport`, `canBulkAction` computed values
    - Combine feature flags with permission checks
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 3.4 Implement data fetching and lifecycle


    - Call `store.fetchItems()` on component mount
    - Apply filters and search when they change
    - Handle pagination changes
    - _Requirements: 1.3, 1.4_

  - [x] 3.5 Implement CRUD handlers


    - Implement `handleCreate()` with permission check
    - Implement `handleEdit()` with permission check
    - Implement `handleDelete()` with confirmation and permission check
    - Add error handling for all operations
    - _Requirements: 1.5, 7.2, 7.3, 7.4_

  - [x] 3.6 Implement bulk actions


    - Process bulk action configuration
    - Filter bulk actions based on permissions
    - Implement bulk action execution with confirmation
    - Add standard bulk actions (activate, deactivate, maintenance)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.7 Implement export functionality


    - Implement `handleExport()` for selected items
    - Implement `handleExportAll()` for all items
    - Use export helpers to generate and download CSV
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


  - [x] 3.8 Implement import functionality

    - Implement `handleImport()` for file upload
    - Validate file type and size
    - Parse CSV and validate data
    - Process import with error handling
    - _Requirements: 4.3, 4.4_


  - [x] 3.9 Implement render helper methods

    - Implement `renderFilters()` to generate filter UI
    - Implement `renderHeaderActions()` for create/export/import buttons
    - Implement `renderStats()` for statistics display
    - Implement `renderExportModal()` for export confirmation
    - Implement `renderImportModal()` for import UI
    - _Requirements: 2.5, 4.1, 4.2, 6.1, 6.2_


- [x] 4. Create configuration helpers for common patterns


  - [x] 4.1 Create column definition helpers


    - Create `client/frontend/src/config/listColumns.ts`
    - Implement helper functions for common column types
    - Export reusable column renderers
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 4.2 Create filter definition helpers


    - Create `client/frontend/src/config/listFilters.ts`
    - Implement helper functions for common filter types
    - Export reusable filter configurations
    - _Requirements: 2.5_

  - [x] 4.3 Create bulk action helpers


    - Create `client/frontend/src/config/listBulkActions.ts`
    - Implement standard bulk action configurations
    - Export reusable bulk action definitions
    - _Requirements: 3.5_

- [x] 5. Migrate ContactList component





  - [x] 5.1 Update ContactList to use useBaseList hook


    - Replace custom state management with `useBaseList`
    - Configure columns, filters, stats, bulk actions
    - Configure export functionality
    - Remove duplicate code
    - _Requirements: 9.1, 9.2, 9.3_


  - [x] 5.2 Create contact-specific configurations

    - Create `contactColumns` configuration
    - Create `contactFilters` configuration
    - Create `contactStats` configuration
    - Create `contactBulkActions` configuration
    - Create `contactExportConfig` configuration
    - _Requirements: 5.1, 5.2, 5.3_



- [x] 6. Migrate UserList component




  - [x] 6.1 Update UserList to use useBaseList hook


    - Replace custom state management with `useBaseList`
    - Configure columns, filters, stats, bulk actions
    - Configure export functionality
    - Remove duplicate code
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 6.2 Create user-specific configurations


    - Create `userColumns` configuration
    - Create `userFilters` configuration
    - Create `userStats` configuration
    - Create `userBulkActions` configuration
    - Create `userExportConfig` configuration
    - _Requirements: 5.1, 5.2, 5.3_



- [x] 7. Migrate LocationList component




  - [x] 7.1 Update LocationList to use useBaseList hook


    - Replace custom state management with `useBaseList`
    - Configure columns, filters, stats, bulk actions
    - Configure export functionality
    - Remove duplicate code
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 7.2 Create location-specific configurations


    - Create `locationColumns` configuration
    - Create `locationFilters` configuration
    - Create `locationStats` configuration
    - Create `locationBulkActions` configuration
    - Create `locationExportConfig` configuration
    - _Requirements: 5.1, 5.2, 5.3_



- [x] 8. Migrate MeterList component



  - [x] 8.1 Update MeterList to use useBaseList hook


    - Replace custom state management with `useBaseList`
    - Configure columns, filters, bulk actions
    - Keep custom connection test functionality
    - Remove duplicate code
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 8.2 Create meter-specific configurations


    - Create `meterColumns` configuration
    - Create `meterBulkActions` configuration
    - Handle custom connection test column
    - _Requirements: 5.1, 5.2, 5.3_




- [x] 9. Migrate DeviceList component



  - [x] 9.1 Update DeviceList to use useBaseList hook


    - Replace custom state management with `useBaseList`
    - Configure columns, filters, stats, bulk actions
    - Configure export functionality
    - Remove duplicate code
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.2 Create device-specific configurations


    - Create `deviceColumns` configuration
    - Create `deviceFilters` configuration
    - Create `deviceStats` configuration
    - Create `deviceBulkActions` configuration
    - Create `deviceExportConfig` configuration
    - _Requirements: 5.1, 5.2, 5.3_




- [x] 10. Rename and migrate TemplateList to EmailTemplateList



  - [x] 10.1 Rename component files


    - Rename `TemplateList.tsx` to `EmailTemplateList.tsx`
    - Rename `TemplateListSimple.tsx` to `EmailTemplateListSimple.tsx`
    - Update all imports across the codebase
    - _Requirements: 9.1_

  - [x] 10.2 Update EmailTemplateList to use useBaseList hook


    - Replace custom state management with `useBaseList`
    - Configure columns, filters, bulk actions
    - Configure export functionality
    - Remove duplicate code
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 10.3 Create email template-specific configurations


    - Create `emailTemplateColumns` configuration
    - Create `emailTemplateFilters` configuration
    - Create `emailTemplateBulkActions` configuration
    - Create `emailTemplateExportConfig` configuration
    - _Requirements: 5.1, 5.2, 5.3_




- [x] 11. Create documentation and examples





  - [x] 11.1 Create framework documentation

    - Document `useBaseList` hook API
    - Document configuration options
    - Document feature flags vs permissions
    - Document helper utilities
    - _Requirements: 9.4_


  - [x] 11.2 Create migration guide

    - Document step-by-step migration process
    - Provide before/after code examples
    - Document common patterns and pitfalls
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 11.3 Create example implementations


    - Create example for basic list
    - Create example for read-only list
    - Create example for list with import
    - Create example for list with custom actions
    - _Requirements: 9.4_
-

- [ ] 12. Performance optimization and refinement




  - [x] 12.1 Optimize hook performance


    - Add memoization for expensive computations
    - Optimize re-render behavior
    - Profile and optimize bundle size
    - _Requirements: 1.1_

  - [x] 12.2 Add accessibility improvements


    - Ensure keyboard navigation works
    - Add proper ARIA labels
    - Test with screen readers
    - Verify color contrast
    - _Requirements: 2.5, 4.1_

  - [x] 12.3 Final review and bug fixes


    - Review all migrated components
    - Fix any discovered issues
    - Verify backward compatibility
    - _Requirements: 9.2, 9.5_
