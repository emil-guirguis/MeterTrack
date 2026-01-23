# Tasks: Client Architecture Refactor

## Task List

### Phase 1: Create Type Layer (Both Projects)

#### Backend Types
- [ ] 1.1 Create `src/types/` directory structure
- [ ] 1.2 Create `src/types/auth.types.ts` with authentication types and UserRole enum
- [ ] 1.3 Create `src/types/user.types.ts` with user-related types
- [ ] 1.4 Create `src/types/device.types.ts` with device-related types and DeviceStatus enum
- [ ] 1.5 Create `src/types/meter.types.ts` with meter-related types
- [ ] 1.6 Create `src/types/contact.types.ts` with contact-related types
- [ ] 1.7 Create `src/types/dashboard.types.ts` with dashboard-related types
- [ ] 1.8 Create `src/types/common.types.ts` with shared types (PaginationMeta, PaginatedResponse, etc.)
- [ ] 1.9 Create `src/types/index.ts` exporting all backend types

#### Frontend Types
- [ ] 1.10 Create `src/types/` directory structure
- [ ] 1.11 Create `src/types/auth.types.ts` with authentication types and UserRole enum
- [ ] 1.12 Create `src/types/user.types.ts` with User domain model
- [ ] 1.13 Create `src/types/device.types.ts` with Device domain model and DeviceStatus enum
- [ ] 1.14 Create `src/types/meter.types.ts` with Meter domain model
- [ ] 1.15 Create `src/types/contact.types.ts` with Contact domain model
- [ ] 1.16 Create `src/types/dashboard.types.ts` with Dashboard domain model
- [ ] 1.17 Create `src/types/common.types.ts` with shared types (PaginationMeta, PaginatedResponse, etc.)
- [ ] 1.18 Create `src/types/index.ts` exporting all frontend types

### Phase 2: Create Entity Layer (Backend Only)

- [ ] 2.1 Create `src/entities/` directory structure
- [ ] 2.2 Create `src/entities/user.entity.ts` with UserEntity interface
- [ ] 2.3 Create `src/entities/tenant.entity.ts` with TenantEntity interface
- [ ] 2.4 Create `src/entities/device.entity.ts` with DeviceEntity interface
- [ ] 2.5 Create `src/entities/meter.entity.ts` with MeterEntity interface
- [ ] 2.6 Create `src/entities/contact.entity.ts` with ContactEntity interface
- [ ] 2.7 Create `src/entities/dashboard.entity.ts` with DashboardEntity interface
- [ ] 2.8 Create `src/entities/permission.entity.ts` with PermissionEntity interface
- [ ] 2.9 Create `src/entities/index.ts` exporting all entities

### Phase 3: Create DTO Layer (Backend Only)

- [ ] 3.1 Create `src/dtos/` directory structure with subdirectories
- [ ] 3.2 Create auth DTOs (login.dto.ts, register.dto.ts, auth-response.dto.ts)
- [ ] 3.3 Create user DTOs (create-user.dto.ts, update-user.dto.ts, user-response.dto.ts)
- [ ] 3.4 Create tenant DTOs (create-tenant.dto.ts, update-tenant.dto.ts, tenant-response.dto.ts)
- [ ] 3.5 Create device DTOs (create-device.dto.ts, update-device.dto.ts, device-response.dto.ts)
- [ ] 3.6 Create meter DTOs (create-meter.dto.ts, update-meter.dto.ts, meter-response.dto.ts)
- [ ] 3.7 Create contact DTOs (create-contact.dto.ts, update-contact.dto.ts, contact-response.dto.ts)
- [ ] 3.8 Create dashboard DTOs (create-dashboard.dto.ts, update-dashboard.dto.ts, dashboard-response.dto.ts)
- [ ] 3.9 Create `src/dtos/index.ts` exporting all DTOs

### Phase 4: Create Module Layer (Backend Only)

- [ ] 4.1 Create `src/modules/auth/` directory with auth.service.ts, auth.controller.ts, and auth.module.ts
- [ ] 4.2 Create `src/modules/users/` directory with users.service.ts, users.controller.ts, and users.module.ts
- [ ] 4.3 Create `src/modules/tenants/` directory with tenants.service.ts, tenants.controller.ts, and tenants.module.ts
- [ ] 4.4 Create `src/modules/devices/` directory with devices.service.ts, devices.controller.ts, and devices.module.ts
- [ ] 4.5 Create `src/modules/meters/` directory with meters.service.ts, meters.controller.ts, and meters.module.ts
- [ ] 4.6 Create `src/modules/contacts/` directory with contacts.service.ts, contacts.controller.ts, and contacts.module.ts
- [ ] 4.7 Create `src/modules/dashboards/` directory with dashboards.service.ts, dashboards.controller.ts, and dashboards.module.ts

### Phase 5: Create Component Props Layer (Frontend Only)

- [ ] 5.1 Create component props interfaces for common components (Button, Modal, etc.)
- [ ] 5.2 Create component props interfaces for user components (UserForm, UserList, UserCard)
- [ ] 5.3 Create component props interfaces for device components (DeviceCard, DeviceForm, DeviceList)
- [ ] 5.4 Create component props interfaces for meter components (MeterCard, MeterForm, MeterList)
- [ ] 5.5 Create component props interfaces for contact components (ContactForm, ContactList, ContactCard)
- [ ] 5.6 Create component props interfaces for dashboard components (DashboardCard, DashboardForm, DashboardList)
- [ ] 5.7 Export all component props from their respective component files

### Phase 6: Create Feature Organization (Frontend Only)

- [ ] 6.1 Create `src/features/auth/` with pages, components, hooks, and services
- [ ] 6.2 Create `src/features/users/` with pages, components, hooks, and services
- [ ] 6.3 Create `src/features/devices/` with pages, components, hooks, and services
- [ ] 6.4 Create `src/features/meters/` with pages, components, hooks, and services
- [ ] 6.5 Create `src/features/contacts/` with pages, components, hooks, and services
- [ ] 6.6 Create `src/features/dashboards/` with pages, components, hooks, and services
- [ ] 6.7 Create feature index files exporting services, hooks, and components

### Phase 7: Create API Client Layer (Frontend Only)

- [ ] 7.1 Create `src/api/` directory structure
- [ ] 7.2 Create `src/api/client.ts` with base API client configuration
- [ ] 7.3 Create `src/api/auth.api.ts` with authentication endpoints
- [ ] 7.4 Create `src/api/users.api.ts` with user endpoints
- [ ] 7.5 Create `src/api/devices.api.ts` with device endpoints
- [ ] 7.6 Create `src/api/meters.api.ts` with meter endpoints
- [ ] 7.7 Create `src/api/contacts.api.ts` with contact endpoints
- [ ] 7.8 Create `src/api/dashboards.api.ts` with dashboard endpoints
- [ ] 7.9 Create `src/api/index.ts` exporting all API clients

### Phase 8: Update Backend Imports

- [ ] 8.1 Update imports in all backend services to use new entity/DTO/type paths
- [ ] 8.2 Update imports in all backend controllers to use new DTO/type paths
- [ ] 8.3 Update imports in all backend routes to use new paths
- [ ] 8.4 Update imports in all backend models to use new paths
- [ ] 8.5 Update imports in any other backend files that reference old type locations

### Phase 9: Update Frontend Imports

- [ ] 9.1 Update imports in all frontend components to use new type paths
- [ ] 9.2 Update imports in all frontend pages to use new type paths
- [ ] 9.3 Update imports in all frontend services to use new type paths
- [ ] 9.4 Update imports in all frontend hooks to use new type paths
- [ ] 9.5 Update imports in all frontend API calls to use new API client paths

### Phase 10: Consolidate and Remove Old Files (Backend)

- [ ] 10.1 Remove old type definitions from scattered locations (after verifying all imports updated)
- [ ] 10.2 Remove old entity definitions from scattered locations
- [ ] 10.3 Remove old DTO definitions from scattered locations
- [ ] 10.4 Verify no remaining references to old type locations

### Phase 11: Consolidate and Remove Old Files (Frontend)

- [ ] 11.1 Remove old type definitions from scattered component files (after verifying all imports updated)
- [ ] 11.2 Remove old type definitions from scattered service files
- [ ] 11.3 Verify no remaining references to old type locations
