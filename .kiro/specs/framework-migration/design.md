# Design Document

## Overview

This document outlines the design for migrating reusable UI components from `client/frontend` to a shared `framework/frontend` location. The framework will be organized by feature domain (lists, forms, dashboards, reports, email templates) with shared utilities, creating a comprehensive UI component library that can be used across multiple projects.

## Architecture

### Directory Structure

```
framework/
├── frontend/
    ├── index.ts                    # Root barrel export
    ├── docs/                       # Framework documentation
    │   ├── README.md
    │   ├── LISTS.md
    │   ├── FORMS.md
    │   ├── DASHBOARDS.md
    │   ├── REPORTS.md
    │   └── EMAIL_TEMPLATES.md
    ├── shared/                     # Cross-domain utilities
    │   ├── index.ts
    │   ├── types/
    │   │   ├── auth.ts
    │   │   ├── common.ts
    │   │   └── index.ts
    │   ├── hooks/
    │   │   ├── useResponsive.ts
    │   │   ├── useDebounce.ts
    │   │   └── index.ts
    │   ├── utils/
    │   │   ├── dateHelpers.ts
    │   │   ├── stringHelpers.ts
    │   │   └── index.ts
    │   └── components/
    │       ├── Toast.tsx
    │       ├── Modal.tsx
    │       └── index.ts
    ├── lists/                      # List framework domain
    │   ├── index.ts
    │   ├── types/
    │   │   ├── list.ts
    │   │   ├── ui.ts
    │   │   └── index.ts
    │   ├── hooks/
    │   │   ├── useBaseList.tsx
    │   │   └── index.ts
    │   ├── components/
    │   │   ├── DataList.tsx
    │   │   ├── DataTable.tsx
    │   │   ├── DataTable.css
    │   │   ├── ListFilters.css
    │   │   └── index.ts
    │   ├── utils/
    │   │   ├── listHelpers.ts
    │   │   ├── exportHelpers.ts
    │   │   ├── importHelpers.ts
    │   │   ├── renderHelpers.tsx
    │   │   └── index.ts
    │   └── config/
    │       ├── listColumns.ts
    │       ├── listFilters.ts
    │       ├── listBulkActions.ts
    │       └── index.ts
    ├── forms/                      # Form framework domain
    │   ├── index.ts
    │   ├── types/
    │   │   ├── form.ts
    │   │   └── index.ts
    │   ├── hooks/
    │   │   ├── useBaseForm.tsx
    │   │   ├── useFieldValidation.ts
    │   │   └── index.ts
    │   ├── components/
    │   │   ├── FormField.tsx
    │   │   ├── FormSection.tsx
    │   │   ├── FormActions.tsx
    │   │   └── index.ts
    │   └── utils/
    │       ├── validation.ts
    │       ├── transformation.ts
    │       └── index.ts
    ├── dashboards/                 # Dashboard framework domain
    │   ├── index.ts
    │   ├── types/
    │   │   ├── dashboard.ts
    │   │   ├── widget.ts
    │   │   └── index.ts
    │   ├── hooks/
    │   │   ├── useDashboard.ts
    │   │   └── index.ts
    │   ├── components/
    │   │   ├── DashboardGrid.tsx
    │   │   ├── DashboardWidget.tsx
    │   │   ├── StatCard.tsx
    │   │   └── index.ts
    │   └── utils/
    │       ├── layoutHelpers.ts
    │       └── index.ts
    ├── reports/                    # Report framework domain
    │   ├── index.ts
    │   ├── types/
    │   │   ├── report.ts
    │   │   └── index.ts
    │   ├── hooks/
    │   │   ├── useReport.ts
    │   │   └── index.ts
    │   ├── components/
    │   │   ├── ReportViewer.tsx
    │   │   ├── ReportHeader.tsx
    │   │   └── index.ts
    │   └── utils/
    │       ├── pdfGenerator.ts
    │       ├── excelGenerator.ts
    │       └── index.ts
    └── email-templates/            # Email template framework domain
        ├── index.ts
        ├── types/
        │   ├── template.ts
        │   └── index.ts
        ├── hooks/
        │   ├── useTemplate.ts
        │   └── index.ts
        ├── components/
        │   ├── TemplateEditor.tsx
        │   ├── TemplatePreview.tsx
        │   └── index.ts
        └── utils/
            ├── templateRenderer.ts
            ├── variableSubstitution.ts
            └── index.ts
└── backend/                        # Backend framework
    ├── index.ts                    # Root barrel export
    ├── docs/                       # Backend documentation
    │   ├── README.md
    │   ├── API_GUIDE.md
    │   └── MCP_SERVER_GUIDE.md
    ├── shared/                     # Shared backend utilities
    │   ├── index.ts
    │   ├── types/
    │   │   ├── common.ts
    │   │   └── index.ts
    │   └── utils/
    │       ├── database.ts
    │       ├── logging.ts
    │       ├── validation.ts
    │       └── index.ts
    ├── api/                        # REST API framework
    │   ├── index.ts
    │   ├── types/
    │   │   ├── router.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── request.ts
    │   │   ├── response.ts
    │   │   └── index.ts
    │   ├── base/
    │   │   ├── BaseRouter.ts
    │   │   ├── BaseController.ts
    │   │   ├── BaseService.ts
    │   │   └── index.ts
    │   ├── middleware/
    │   │   ├── auth.ts
    │   │   ├── validation.ts
    │   │   ├── errorHandler.ts
    │   │   ├── logging.ts
    │   │   └── index.ts
    │   ├── utils/
    │   │   ├── pagination.ts
    │   │   ├── filtering.ts
    │   │   ├── sorting.ts
    │   │   ├── responseFormatter.ts
    │   │   └── index.ts
    │   └── examples/
    │       ├── simple-crud-api.ts
    │       └── authenticated-api.ts
    └── mcp/                        # MCP server framework
        ├── index.ts
        ├── types/
        │   ├── server.ts
        │   ├── tool.ts
        │   ├── resource.ts
        │   └── index.ts
        ├── base/
        │   ├── MCPServer.ts
        │   ├── MCPTool.ts
        │   ├── MCPResource.ts
        │   └── index.ts
        ├── utils/
        │   ├── toolValidation.ts
        │   ├── resourceCaching.ts
        │   └── index.ts
        └── examples/
            ├── simple-server.ts
            └── database-server.ts
```

## Components and Interfaces

### 1. Lists Framework

#### useBaseList Hook

The core hook for list management with auth context injection:

```typescript
interface UseBaseListConfig<T, StoreType> {
  entityName: string;
  entityNamePlural: string;
  useStore: () => StoreType;
  features?: ListFeatures;
  permissions?: ListPermissions;
  columns: ColumnDefinition<T>[];
  filters?: FilterDefinition[];
  stats?: StatDefinition<T>[];
  bulkActions?: BulkActionConfig<T>[];
  export?: ExportConfig<T>;
  import?: ImportConfig<T>;
  authContext?: AuthContextProvider; // Injectable auth context
  onEdit?: (item: T) => void;
  onCreate?: () => void;
  onSelect?: (item: T) => void;
}

function useBaseList<T, StoreType>(config: UseBaseListConfig<T, StoreType>): BaseListReturn<T>
```

#### DataList and DataTable Components

Presentational components that render list data with filtering, sorting, and pagination.

### 2. Forms Framework

#### useBaseForm Hook

```typescript
interface UseBaseFormConfig<T> {
  initialValues: Partial<T>;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T) => Promise<void>;
  authContext?: AuthContextProvider;
  permissions?: FormPermissions;
}

function useBaseForm<T>(config: UseBaseFormConfig<T>): BaseFormReturn<T>
```

#### Form Components

- `FormField`: Reusable field component with validation
- `FormSection`: Groups related fields
- `FormActions`: Submit/cancel buttons with loading states

### 3. Dashboards Framework

#### useDashboard Hook

```typescript
interface UseDashboardConfig {
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  onLayoutChange?: (layout: DashboardLayout) => void;
}

function useDashboard(config: UseDashboardConfig): DashboardReturn
```

#### Dashboard Components

- `DashboardGrid`: Responsive grid layout
- `DashboardWidget`: Container for dashboard widgets
- `StatCard`: Displays key metrics

### 4. Reports Framework

#### useReport Hook

```typescript
interface UseReportConfig<T> {
  data: T[];
  template: ReportTemplate;
  format: 'pdf' | 'csv' | 'excel';
}

function useReport<T>(config: UseReportConfig<T>): ReportReturn
```

#### Report Components

- `ReportViewer`: Displays generated reports
- `ReportHeader`: Report title and metadata

### 5. Email Templates Framework

#### useTemplate Hook

```typescript
interface UseTemplateConfig {
  template: EmailTemplate;
  variables: Record<string, any>;
  onSave?: (template: EmailTemplate) => Promise<void>;
}

function useTemplate(config: UseTemplateConfig): TemplateReturn
```

#### Template Components

- `TemplateEditor`: Rich text editor for templates
- `TemplatePreview`: Live preview with variable substitution

## Data Models

### Auth Context Interface

```typescript
interface AuthContextProvider {
  checkPermission: (permission: Permission) => boolean;
  user?: User;
}
```

Projects must provide an implementation of this interface to the framework.

### List Types

All existing list types remain unchanged and are moved to `framework/frontend/lists/types/`.

### Form Types

```typescript
interface ValidationSchema<T> {
  [K in keyof T]?: ValidationRule[];
}

interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  message: string;
  value?: any;
  validator?: (value: any) => boolean;
}

interface FormPermissions {
  read?: Permission;
  update?: Permission;
}
```

### Dashboard Types

```typescript
interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
}

interface WidgetConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  props: Record<string, any>;
}
```

### Report Types

```typescript
interface ReportTemplate {
  id: string;
  name: string;
  sections: ReportSection[];
  styles: ReportStyles;
}

interface ReportSection {
  type: 'header' | 'table' | 'chart' | 'text';
  content: any;
}
```

### Email Template Types

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: TemplateVariable[];
}

interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
  required: boolean;
}
```

## Error Handling

### Framework Errors

The framework will throw descriptive errors for:
- Missing required configuration
- Invalid auth context
- Type mismatches
- Permission violations

### Client Error Handling

Clients should wrap framework components in error boundaries and handle errors appropriately.

## Testing Strategy

### Unit Tests

- Test each hook independently
- Test utility functions with various inputs
- Test component rendering with different props

### Integration Tests

- Test complete list workflows (CRUD operations)
- Test form submission and validation
- Test dashboard layout changes
- Test report generation
- Test template rendering

### Migration Testing

- Test each migrated component in the client application
- Verify backward compatibility
- Test all existing list, form, and dashboard pages

## Migration Strategy

### Phase 1: Lists Framework (Priority 1)

1. Create framework directory structure
2. Copy list types to framework
3. Copy list components to framework
4. Copy list hooks to framework
5. Copy list utilities to framework
6. Copy list config builders to framework
7. Update imports in client project
8. Test all list components
9. Remove old files from client

### Phase 2: Forms Framework (Priority 2)

1. Identify reusable form components
2. Create form framework structure
3. Extract form hooks and utilities
4. Update imports in client project
5. Test all form pages

### Phase 3: Dashboards Framework (Priority 3)

1. Identify dashboard components
2. Create dashboard framework structure
3. Extract dashboard utilities
4. Update imports in client project
5. Test dashboard pages

### Phase 4: Reports Framework (Priority 4)

1. Identify report components
2. Create report framework structure
3. Extract report generation utilities
4. Update imports in client project
5. Test report generation

### Phase 5: Email Templates Framework (Priority 5)

1. Identify template components
2. Create template framework structure
3. Extract template utilities
4. Update imports in client project
5. Test template management

## Performance Considerations

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load framework modules
- Minimize bundle size with tree shaking
- Cache computed values with useMemo

## Security Considerations

- Auth context must be provided by the client
- Permission checks occur before rendering sensitive UI
- Form validation occurs on both client and server
- Export/import operations validate file types and sizes
- Template rendering sanitizes user input

## Accessibility

- All components follow WCAG 2.1 AA standards
- Keyboard navigation supported
- Screen reader friendly
- Proper ARIA labels and roles
- Focus management

## Backend Framework Components

### 1. API Framework

#### BaseRouter Class

Base class for defining API routes with automatic validation and error handling:

```typescript
abstract class BaseRouter {
  protected router: Router;
  
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }
  
  protected abstract initializeRoutes(): void;
  
  protected validate(schema: ValidationSchema): RequestHandler;
  protected authenticate(permission?: Permission): RequestHandler;
  protected paginate(): RequestHandler;
  
  getRouter(): Router;
}
```

#### BaseController Class

Base class for controllers with standardized response formatting:

```typescript
abstract class BaseController<T> {
  protected service: BaseService<T>;
  
  protected success(res: Response, data: any, message?: string): void;
  protected error(res: Response, error: Error, statusCode?: number): void;
  protected paginated(res: Response, data: PaginatedResult<T>): void;
}
```

#### BaseService Class

Base class for business logic with database operations:

```typescript
abstract class BaseService<T> {
  protected model: any;
  
  async findAll(filters?: any): Promise<T[]>;
  async findById(id: string): Promise<T | null>;
  async create(data: Partial<T>): Promise<T>;
  async update(id: string, data: Partial<T>): Promise<T>;
  async delete(id: string): Promise<void>;
  async paginate(page: number, pageSize: number, filters?: any): Promise<PaginatedResult<T>>;
}
```

#### API Middleware

Common middleware functions:

```typescript
// Authentication middleware
function authenticate(permission?: Permission): RequestHandler;

// Validation middleware
function validate(schema: ValidationSchema): RequestHandler;

// Error handling middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;

// Logging middleware
function requestLogger(req: Request, res: Response, next: NextFunction): void;
```

#### API Utilities

```typescript
// Pagination utilities
function buildPaginationQuery(page: number, pageSize: number): PaginationQuery;
function formatPaginatedResponse<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResult<T>;

// Filtering utilities
function buildFilterQuery(filters: Record<string, any>): FilterQuery;

// Sorting utilities
function buildSortQuery(sortBy: string, sortOrder: 'asc' | 'desc'): SortQuery;

// Response formatting
function formatSuccessResponse(data: any, message?: string): ApiResponse;
function formatErrorResponse(error: Error): ApiErrorResponse;
```

### 2. MCP Server Framework

#### MCPServer Base Class

Base class for MCP servers with lifecycle management:

```typescript
abstract class MCPServer {
  protected name: string;
  protected version: string;
  protected tools: Map<string, MCPTool>;
  protected resources: Map<string, MCPResource>;
  
  constructor(config: MCPServerConfig);
  
  protected abstract initialize(): Promise<void>;
  
  registerTool(tool: MCPTool): void;
  registerResource(resource: MCPResource): void;
  
  async start(): Promise<void>;
  async stop(): Promise<void>;
  
  protected handleToolCall(toolName: string, args: any): Promise<any>;
  protected handleResourceRequest(resourceId: string): Promise<any>;
}
```

#### MCPTool Base Class

Base class for defining MCP tools:

```typescript
abstract class MCPTool {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: JSONSchema;
  
  abstract execute(args: any): Promise<any>;
  
  validate(args: any): ValidationResult;
}
```

#### MCPResource Base Class

Base class for defining MCP resources:

```typescript
abstract class MCPResource {
  abstract uri: string;
  abstract name: string;
  abstract description: string;
  abstract mimeType: string;
  
  abstract fetch(): Promise<any>;
  
  protected cache?: ResourceCache;
}
```

## Backend Data Models

### API Types

```typescript
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  timestamp: string;
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
  timestamp: string;
}

interface ValidationSchema {
  body?: any;
  query?: any;
  params?: any;
}

interface PaginationQuery {
  skip: number;
  limit: number;
}

interface FilterQuery {
  [key: string]: any;
}

interface SortQuery {
  [key: string]: 1 | -1;
}
```

### MCP Types

```typescript
interface MCPServerConfig {
  name: string;
  version: string;
  transport: 'stdio' | 'http';
  port?: number;
  database?: DatabaseConfig;
}

interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
}

interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

interface ResourceCache {
  ttl: number;
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  invalidate(key: string): Promise<void>;
}
```

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox
- No IE11 support required

## Node.js Compatibility

- Node.js 18+ required
- ES2020+ features
- Native ESM modules
- TypeScript 5.0+
