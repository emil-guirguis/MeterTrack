# Implementation Plan

- [x] 1. Setup framework directory structure




  - Create base directory structure for all domains
  - Create barrel export files (index.ts) at each level
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7_

- [x] 2. Migrate shared utilities and types





  - [x] 2.1 Create shared/types directory with common type definitions


    - Create auth.ts with AuthContextProvider interface
    - Create common.ts with shared types
    - Create index.ts barrel export
    - _Requirements: 16.2_

  - [x] 2.2 Create shared/hooks directory with common React hooks


    - Move useResponsive hook if it exists
    - Create useDebounce hook
    - Create index.ts barrel export
    - _Requirements: 16.3_

  - [x] 2.3 Create shared/utils directory with common utilities


    - Create dateHelpers.ts
    - Create stringHelpers.ts
    - Create index.ts barrel export
    - _Requirements: 16.1_

  - [x] 2.4 Create shared/components directory with common UI components


    - Move Toast component if reusable
    - Move Modal component if reusable
    - Create index.ts barrel export
    - _Requirements: 16.4_
-

- [x] 3. Migrate Lists Framework (Phase 1 - Priority 1)





  - [x] 3.1 Create lists directory structure



    - Create types, hooks, components, utils, config subdirectories
    - Create index.ts barrel exports
    - _Requirements: 1.2, 2.1_


  - [x] 3.2 Migrate list types


    - Copy list.ts to framework/frontend/lists/types/
    - Copy ui.ts to framework/frontend/lists/types/
    - Update imports to use framework shared types
    - Create index.ts barrel export
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


  - [x] 3.3 Migrate list components


    - Copy DataList.tsx to framework/frontend/lists/components/
    - Copy DataTable.tsx to framework/frontend/lists/components/
    - Copy DataTable.css to framework/frontend/lists/components/
    - Copy ListFilters.css to framework/frontend/lists/components/
    - Update imports to use framework types
    - Create index.ts barrel export
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.4 Migrate useBaseList hook with auth context injection



    - Copy useBaseList.tsx to framework/frontend/lists/hooks/
    - Add authContext parameter to hook configuration
    - Update to use injected auth context or default from React Context
    - Update imports to use framework types and utilities
    - Create index.ts barrel export
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4_


  - [x] 3.5 Migrate list utilities



    - Copy listHelpers.ts to framework/frontend/lists/utils/
    - Copy exportHelpers.ts to framework/frontend/lists/utils/
    - Copy importHelpers.ts to framework/frontend/lists/utils/
    - Copy renderHelpers.tsx to framework/frontend/lists/utils/
    - Update imports to use framework types
    - Create index.ts barrel export
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


  - [x] 3.6 Migrate list configuration builders


    - Copy listColumns.ts to framework/frontend/lists/config/
    - Copy listFilters.ts to framework/frontend/lists/config/
    - Copy listBulkActions.ts to framework/frontend/lists/config/
    - Update imports to use framework types
    - Create index.ts barrel export
    - _Requirements: 6.1, 6.2, 6.3, 6.4_


  - [x] 3.7 Migrate list documentation



    - Copy LIST_FRAMEWORK_DOCUMENTATION.md to framework/frontend/docs/
    - Copy MIGRATION_GUIDE.md to framework/frontend/docs/
    - Copy EXAMPLES.md to framework/frontend/docs/
    - Copy PERFORMANCE_OPTIMIZATIONS.md to framework/frontend/docs/
    - Update documentation to reflect framework location
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 3.8 Update client imports for lists framework




    - Update ContactList.tsx imports
    - Update MeterList.tsx imports
    - Update LocationList.tsx imports
    - Update UserList.tsx imports
    - Update DeviceList.tsx imports
    - Update EmailTemplateList.tsx imports
    - Update all entity-specific config files
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 3.9 Test lists framework migration



    - Test ContactList component (CRUD, filters, search, pagination, bulk actions, export)
    - Test MeterList component
    - Test LocationList component
    - Test UserList component
    - Test DeviceList component
    - Test EmailTemplateList component
    - Verify no regressions
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 3.10 Remove old list framework files from client/frontend


    - Remove client/frontend/src/hooks/useBaseList.tsx
    - Remove client/frontend/src/components/common/DataList.tsx
    - Remove client/frontend/src/components/common/DataTable.tsx
    - Remove client/frontend/src/utils/listHelpers.ts
    - Remove client/frontend/src/utils/exportHelpers.ts
    - Remove client/frontend/src/utils/importHelpers.ts
    - Remove client/frontend/src/utils/renderHelpers.tsx
    - Remove client/frontend/src/config/listColumns.ts
    - Remove client/frontend/src/config/listFilters.ts
    - Remove client/frontend/src/config/listBulkActions.ts
    - Remove client/frontend/src/types/list.ts
    - Remove list documentation files
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 4. Migrate Forms Framework (Phase 2 - Priority 2)






  - [x] 4.1 Analyze existing form patterns in client/frontend


    - Identify reusable form components
    - Identify common form hooks
    - Identify form validation patterns
    - Document findings
    - _Requirements: 12.1_

  - [x] 4.2 Create forms directory structure


    - Create types, hooks, components, utils subdirectories
    - Create index.ts barrel exports
    - _Requirements: 1.2, 12.1_

  - [x] 4.3 Create form types


    - Create form.ts with form-related type definitions
    - Define ValidationSchema, ValidationRule, FormPermissions types
    - Create index.ts barrel export
    - _Requirements: 12.4_

  - [x] 4.4 Create useBaseForm hook


    - Implement form state management
    - Implement field validation
    - Implement submission handling
    - Add auth context integration
    - Create index.ts barrel export
    - _Requirements: 12.2, 12.6_

  - [x] 4.5 Create form components


    - Create FormField.tsx component
    - Create FormSection.tsx component
    - Create FormActions.tsx component
    - Create index.ts barrel export
    - _Requirements: 12.1_

  - [x] 4.6 Create form utilities


    - Create validation.ts with validation functions
    - Create transformation.ts with data transformation utilities
    - Create index.ts barrel export
    - _Requirements: 12.3_

  - [x] 4.7 Update client forms to use framework


    - Update CompanyInfoForm to use framework
    - Update other forms as needed
    - Test form functionality
    - _Requirements: 12.5_
-

- [x] 5. Migrate Dashboards Framework (Phase 3 - Priority 3)





  - [x] 5.1 Analyze existing dashboard patterns


    - Identify dashboard components in client/frontend
    - Identify widget components
    - Document dashboard layouts
    - _Requirements: 13.1_


  - [x] 5.2 Create dashboards directory structure

    - Create types, hooks, components, utils subdirectories
    - Create index.ts barrel exports
    - _Requirements: 1.2, 13.1_


  - [x] 5.3 Create dashboard types

    - Create dashboard.ts with dashboard type definitions
    - Create widget.ts with widget type definitions
    - Create index.ts barrel export
    - _Requirements: 13.4_

  - [x] 5.4 Create useDashboard hook


    - Implement dashboard state management
    - Implement layout management
    - Create index.ts barrel export
    - _Requirements: 13.3_


  - [x] 5.5 Create dashboard components

    - Create DashboardGrid.tsx component
    - Create DashboardWidget.tsx component
    - Create StatCard.tsx component
    - Create index.ts barrel export
    - _Requirements: 13.2, 13.5_

  - [x] 5.6 Create dashboard utilities


    - Create layoutHelpers.ts
    - Create index.ts barrel export
    - _Requirements: 13.4_

  - [x] 5.7 Update client dashboards to use framework


    - Update existing dashboard pages
    - Test dashboard functionality
    - _Requirements: 13.6_

- [x] 6. Migrate Reports Framework (Phase 4 - Priority 4)






  - [x] 6.1 Analyze existing report patterns


    - Identify report components
    - Identify report generation logic
    - Document report formats
    - _Requirements: 14.1_


  - [x] 6.2 Create reports directory structure


    - Create types, hooks, components, utils subdirectories
    - Create index.ts barrel exports
    - _Requirements: 1.2, 14.1_


  - [x] 6.3 Create report types


    - Create report.ts with report type definitions
    - Create index.ts barrel export
    - _Requirements: 14.4_


  - [x] 6.4 Create useReport hook


    - Implement report state management
    - Implement report generation logic
    - Create index.ts barrel export
    - _Requirements: 14.2_

  - [x] 6.5 Create report components



    - Create ReportViewer.tsx component
    - Create ReportHeader.tsx component
    - Create index.ts barrel export
    - _Requirements: 14.1_


  - [x] 6.6 Create report utilities


    - Create pdfGenerator.ts
    - Create excelGenerator.ts
    - Integrate with existing CSV export
    - Create index.ts barrel export
    - _Requirements: 14.3, 14.5_



  - [x] 6.7 Update client reports to use framework



    - Update existing report pages
    - Test report generation

    - _Requirements: 14.6_

- [x] 7. Migrate Email Templates Framework (Phase 5 - Priority 5)





  - [x] 7.1 Analyze existing email template patterns


    - Identify template components
    - Identify template rendering logic
    - Document template variables
    - _Requirements: 15.1_

  - [x] 7.2 Create email-templates directory structure



    - Create types, hooks, components, utils subdirectories
    - Create index.ts barrel exports
    - _Requirements: 1.2, 15.1_

  - [x] 7.3 Create email template types


    - Create template.ts with template type definitions
    - Create index.ts barrel export
    - _Requirements: 15.5_

  - [x] 7.4 Create useTemplate hook



    - Implement template state management
    - Implement template editing logic
    - Create index.ts barrel export
    - _Requirements: 15.2_

  - [x] 7.5 Create email template components


    - Create TemplateEditor.tsx component
    - Create TemplatePreview.tsx component
    - Create index.ts barrel export
    - _Requirements: 15.1, 15.2_

  - [x] 7.6 Create email template utilities


    - Create templateRenderer.ts
    - Create variableSubstitution.ts
    - Create index.ts barrel export
    - _Requirements: 15.3, 15.4, 15.6, 15.7_

  - [x] 7.7 Update client email templates to use framework


    - Update EmailTemplateList to use framework
    - Update template editor pages
    - Test template functionality
    - _Requirements: 15.7_

- [x] 8. Create root framework exports and documentation








  - [x] 8.1 Create root barrel export


    - Create framework/frontend/index.ts
    - Export all domain modules
    - _Requirements: 1.3, 1.6_




  - [x] 8.2 Create framework README

    - Document framework structure
    - Document usage examples
    - Document migration guide
    - _Requirements: 1.7, 17.5_



  - [x] 8.3 Create domain-specific documentation



    - Create docs/LISTS.md
    - Create docs/FORMS.md
    - Create docs/DASHBOARDS.md
    - Create docs/REPORTS.md
    - Create docs/EMAIL_TEMPLATES.md
    - _Requirements: 1.7_

- [ ] 9. Migrate API Framework (Phase 6 - Priority 2)

  - [x] 9.1 Analyze existing API patterns

    - Identify common route patterns in client/backend
    - Identify common controller patterns
    - Identify common service patterns
    - Identify common middleware
    - Document findings
    - _Requirements: 20.1_


  - [ ] 9.2 Create backend shared utilities
    - Create framework/backend/shared directory structure
    - Create shared/types/common.ts
    - Create shared/utils/database.ts
    - Create shared/utils/logging.ts
    - Create shared/utils/validation.ts
    - Create index.ts barrel exports
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

  - [x] 9.3 Create API directory structure


    - Create framework/backend/api directory
    - Create types, base, middleware, utils, examples subdirectories
    - Create index.ts barrel exports
    - _Requirements: 1.2, 20.1_


  - [x] 9.4 Create API types

    - Create types/router.ts
    - Create types/controller.ts
    - Create types/service.ts
    - Create types/request.ts
    - Create types/response.ts
    - Create index.ts barrel export
    - _Requirements: 20.7_




  - [ ] 9.5 Create API base classes
    - Create base/BaseRouter.ts with route initialization and helpers
    - Create base/BaseController.ts with response formatting
    - Create base/BaseService.ts with CRUD operations
    - Create index.ts barrel export
    - _Requirements: 20.2, 20.3, 20.4, 20.8_

  - [x] 9.6 Create API middleware


    - Create middleware/auth.ts for authentication
    - Create middleware/validation.ts for request validation
    - Create middleware/errorHandler.ts for error handling
    - Create middleware/logging.ts for request logging
    - Create index.ts barrel export
    - _Requirements: 21.1, 21.2, 21.3, 21.4_



  - [x] 9.7 Create API utilities

    - Create utils/pagination.ts
    - Create utils/filtering.ts
    - Create utils/sorting.ts
    - Create utils/responseFormatter.ts
    - Create index.ts barrel export
    - _Requirements: 21.5, 21.6, 21.7_

  - [x] 9.8 Create API examples


    - Create examples/simple-crud-api.ts
    - Create examples/authenticated-api.ts
    - _Requirements: 22.2_






  - [ ] 9.9 Create API documentation

    - Create docs/API_GUIDE.md with comprehensive guide
    - Include route creation examples
    - Include controller examples
    - Include middleware usage examples
    - Include best practices
    - Include migration guide
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

  - [-] 9.10 Migrate existing API routes to use framework


    - Update contacts.js to use BaseRouter
    - Update meters.js to use BaseRouter
    - Update sync.js to use BaseRouter
    - Test all API endpoints
    - _Requirements: 20.8_

- [ ] 10. Migrate MCP Server Framework (Phase 7 - Priority 3)



  - [ ] 10.1 Analyze existing MCP server patterns

    - Review client/mcp MCP server
    - Review sync/mcp MCP server
    - Identify common patterns
    - Document server structures


    - _Requirements: 17.1_

  - [ ] 10.2 Create MCP directory structure

    - Create framework/backend/mcp directory

    - Create types, base, utils, examples subdirectories

    - Create index.ts barrel exports
    - _Requirements: 1.2, 17.1_

  - [ ] 10.3 Create MCP types

    - Create types/server.ts

    - Create types/tool.ts
    - Create types/resource.ts
    - Create index.ts barrel export
    - _Requirements: 17.6_


  - [x] 10.4 Create MCP base classes

    - Create base/MCPServer.ts with lifecycle management
    - Create base/MCPTool.ts for tool definitions
    - Create base/MCPResource.ts for resource definitions
    - Create index.ts barrel export
    - _Requirements: 17.2, 17.3, 17.4, 17.7, 17.8_



  - [x] 10.5 Create MCP utilities

    - Create utils/toolValidation.ts
    - Create utils/resourceCaching.ts
    - Create index.ts barrel export
    - _Requirements: 18.1, 18.2, 18.3, 18.4_


  - [x] 10.6 Create MCP examples


    - Create examples/simple-server.ts
    - Create examples/database-server.ts
    - _Requirements: 19.2_


  - [x] 10.7 Create MCP documentation


    - Create docs/MCP_SERVER_GUIDE.md
    - Include server creation examples
    - Include tool definition examples
    - Include resource definition examples
    - Include best practices
    - Include migration guide
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_



  - [ ] 10.8 Migrate existing MCP servers to use framework
    - Update client/mcp to use MCPServer base class
    - Update sync/mcp to use MCPServer base class
    - Test all MCP tools and resources
    - _Requirements: 17.7, 18.5_

- [x] 11. Create backend root exports and documentation



  - [x] 11.1 Create backend root barrel export

    - Create framework/backend/index.ts
    - Export API module
    - Export MCP module
    - Export shared utilities
    - _Requirements: 1.3, 1.6_


  - [ ] 11.2 Create backend README
    - Document backend framework structure
    - Document API framework usage
    - Document MCP framework usage
    - Document shared utilities

    - _Requirements: 1.7, 23.5_


- [x] 12. Final testing and validation


  - [ ] 12.1 Run full application test suite
    - Test all list components
    - Test all form components
    - Test all dashboard components
    - Test all report generation
    - Test all email template functionality
    - Test all API endpoints

    - Test all MCP servers
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 12.2 Verify no regressions
    - Check all existing functionality works
    - Verify performance is maintained
    - Verify accessibility standards

    - Verify API response times
    - Verify MCP tool execution
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 12.3 Update project documentation
    - Update root README with framework information
    - Update developer guides
    - Create framework usage examples
    - _Requirements: 23.5_
