# Design Document: Client Architecture Refactor

## Overview

This document details the refactoring of both frontend and backend client projects to follow modern NestJS-inspired architecture with clear separation of concerns. The refactor establishes distinct layers for entities, DTOs, types, modules, and components while maintaining backward compatibility.

## Architecture Layers

### Backend Architecture

#### 1. Entity Layer (`src/entities/`)

**Purpose:** Represent database tables with ORM decorators and metadata.

**Structure:**
```
src/entities/
├── user.entity.ts
├── tenant.entity.ts
├── device.entity.ts
├── meter.entity.ts
├── contact.entity.ts
├── dashboard.entity.ts
├── permission.entity.ts
└── index.ts
```

**Entity Definition Pattern:**
```typescript
/**
 * User entity representing a user in the system
 * Database table: users
 * Primary key: user_id
 * Tenant filtered: Yes
 */
export interface UserEntity {
  user_id: number;
  tenant_id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

**Key Characteristics:**
- Each entity represents a single database table
- Includes JSDoc comments with table name, primary key, and tenant filtering status
- Includes all columns from the database table
- Marks composite keys clearly
- Exported from centralized index file

#### 2. DTO Layer (`src/dtos/`)

**Purpose:** Define API request/response shapes with validation.

**Structure:**
```
src/dtos/
├── users/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── tenants/
│   ├── create-tenant.dto.ts
│   ├── update-tenant.dto.ts
│   └── tenant-response.dto.ts
├── devices/
│   ├── create-device.dto.ts
│   ├── update-device.dto.ts
│   └── device-response.dto.ts
├── meters/
│   ├── create-meter.dto.ts
│   ├── update-meter.dto.ts
│   └── meter-response.dto.ts
├── contacts/
│   ├── create-contact.dto.ts
│   ├── update-contact.dto.ts
│   └── contact-response.dto.ts
├── dashboards/
│   ├── create-dashboard.dto.ts
│   ├── update-dashboard.dto.ts
│   └── dashboard-response.dto.ts
├── auth/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── auth-response.dto.ts
└── index.ts
```

**DTO Definition Pattern:**
```typescript
import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../types';

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}

/**
 * DTO for user response
 */
export class UserResponseDto {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
}
```

**Key Characteristics:**
- Organized by domain (users/, devices/, meters/, etc.)
- Create, update, and response DTOs for each entity
- Includes validation decorators (class-validator)
- Response DTOs match entity structure
- Exported from centralized index file

#### 3. Type Layer (`src/types/`)

**Purpose:** Pure TypeScript types, interfaces, and enums for internal logic.

**Structure:**
```
src/types/
├── auth.types.ts            # Authentication types
├── user.types.ts            # User-related types
├── device.types.ts          # Device-related types
├── meter.types.ts           # Meter-related types
├── contact.types.ts         # Contact-related types
├── dashboard.types.ts       # Dashboard-related types
├── common.types.ts          # Shared types (pagination, responses)
└── index.ts
```

**Type Definition Pattern:**
```typescript
/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
}

/**
 * Device status
 */
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  UNKNOWN = 'unknown',
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
```

**Key Characteristics:**
- No validation decorators or ORM decorators
- Organized by domain (auth.types.ts, user.types.ts, etc.)
- Includes enums for fixed value sets
- Includes utility interfaces for internal logic
- Exported from centralized index file

#### 4. Module Layer (`src/modules/`)

**Purpose:** Organize business logic by feature/domain.

**Structure:**
```
src/modules/
├── auth/
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── index.ts
├── users/
│   ├── users.service.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── index.ts
├── tenants/
│   ├── tenants.service.ts
│   ├── tenants.controller.ts
│   ├── tenants.module.ts
│   └── index.ts
├── devices/
│   ├── devices.service.ts
│   ├── devices.controller.ts
│   ├── devices.module.ts
│   └── index.ts
├── meters/
│   ├── meters.service.ts
│   ├── meters.controller.ts
│   ├── meters.module.ts
│   └── index.ts
├── contacts/
│   ├── contacts.service.ts
│   ├── contacts.controller.ts
│   ├── contacts.module.ts
│   └── index.ts
└── dashboards/
    ├── dashboards.service.ts
    ├── dashboards.controller.ts
    ├── dashboards.module.ts
    └── index.ts
```

**Module Definition Pattern:**
```typescript
/**
 * Users module - handles user-related operations
 */
export class UsersModule {
  // Module exports services and controllers
}

/**
 * Users service - business logic for user operations
 */
export class UsersService {
  constructor(
    private readonly database: Database,
    private readonly logger: Logger,
  ) {}

  async getUsers(tenantId: number): Promise<UserEntity[]> {
    // Implementation
  }

  async createUser(tenantId: number, dto: CreateUserDto): Promise<UserEntity> {
    // Implementation
  }
}
```

**Key Characteristics:**
- Each module represents a business domain
- Services use dependency injection
- Controllers handle HTTP requests
- Modules export related services and controllers
- Clear separation of concerns
- No duplicate logic across modules

### Frontend Architecture

#### 1. Type Layer (`src/types/`)

**Purpose:** Pure TypeScript types and interfaces for domain models and API responses.

**Structure:**
```
src/types/
├── auth.types.ts            # Authentication types
├── user.types.ts            # User domain model
├── device.types.ts          # Device domain model
├── meter.types.ts           # Meter domain model
├── contact.types.ts         # Contact domain model
├── dashboard.types.ts       # Dashboard domain model
├── common.types.ts          # Shared types (pagination, responses)
└── index.ts
```

**Type Definition Pattern:**
```typescript
/**
 * User domain model
 */
export interface User {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Device domain model
 */
export interface Device {
  device_id: number;
  tenant_id: number;
  name: string;
  status: DeviceStatus;
  ip_address: string;
  port: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
}

/**
 * Device status
 */
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error',
  UNKNOWN = 'unknown',
}
```

**Key Characteristics:**
- Matches backend entity and DTO structures
- Includes enums for fixed value sets
- No React-specific code
- Exported from centralized index file

#### 2. Component Props Layer

**Purpose:** Define clear prop interfaces for all components.

**Structure:**
```
src/components/
├── common/
│   ├── Button.tsx
│   ├── Button.props.ts
│   ├── Modal.tsx
│   ├── Modal.props.ts
│   └── ...
├── users/
│   ├── UserForm.tsx
│   ├── UserForm.props.ts
│   ├── UserList.tsx
│   ├── UserList.props.ts
│   └── ...
├── devices/
│   ├── DeviceCard.tsx
│   ├── DeviceCard.props.ts
│   ├── DeviceForm.tsx
│   ├── DeviceForm.props.ts
│   └── ...
└── ...
```

**Component Props Definition Pattern:**
```typescript
/**
 * Props for UserForm component
 */
export interface UserFormProps {
  /** User to edit (undefined for create mode) */
  user?: User;
  
  /** Callback when form is submitted */
  onSubmit: (data: CreateUserDto) => Promise<void>;
  
  /** Callback when form is cancelled */
  onCancel: () => void;
  
  /** Whether form is in loading state */
  isLoading?: boolean;
  
  /** Error message to display */
  error?: string;
}

/**
 * UserForm component
 */
export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isLoading,
  error,
}) => {
  // Implementation
};
```

**Key Characteristics:**
- Props interfaces co-located with components
- Clear JSDoc comments for each prop
- Consistent naming (ComponentNameProps)
- Exported alongside components
- Type-safe prop passing

#### 3. Feature Organization

**Purpose:** Organize features by domain with clear separation of concerns.

**Structure:**
```
src/features/
├── auth/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── hooks/
│   │   ├── useLogin.ts
│   │   └── useRegister.ts
│   ├── services/
│   │   └── auth.service.ts
│   └── index.ts
├── users/
│   ├── pages/
│   │   ├── UsersPage.tsx
│   │   └── UserDetailPage.tsx
│   ├── components/
│   │   ├── UserForm.tsx
│   │   ├── UserList.tsx
│   │   └── UserCard.tsx
│   ├── hooks/
│   │   ├── useUsers.ts
│   │   ├── useUserForm.ts
│   │   └── useUserDetail.ts
│   ├── services/
│   │   └── users.service.ts
│   └── index.ts
├── devices/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── index.ts
└── ...
```

**Feature Service Pattern:**
```typescript
/**
 * Users service - handles API calls and data transformation
 */
export class UsersService {
  constructor(private readonly apiClient: ApiClient) {}

  async getUsers(tenantId: number): Promise<User[]> {
    const response = await this.apiClient.get(`/users?tenant_id=${tenantId}`);
    return response.data;
  }

  async createUser(tenantId: number, dto: CreateUserDto): Promise<User> {
    const response = await this.apiClient.post('/users', {
      ...dto,
      tenant_id: tenantId,
    });
    return response.data;
  }
}
```

**Feature Hook Pattern:**
```typescript
/**
 * Hook for managing user form state and submission
 */
export const useUserForm = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usersService = useService(UsersService);

  const handleSubmit = async (data: CreateUserDto) => {
    setIsLoading(true);
    setError(null);
    try {
      await usersService.createUser(data);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit, isLoading, error };
};
```

**Key Characteristics:**
- Each feature has pages, components, hooks, and services
- Services handle API calls and data transformation
- Hooks encapsulate component logic and state management
- Clear separation of concerns
- No duplicate logic across features

#### 4. API Client Layer (`src/api/`)

**Purpose:** Centralized API client with typed endpoints.

**Structure:**
```
src/api/
├── auth.api.ts              # Authentication endpoints
├── users.api.ts             # User endpoints
├── devices.api.ts           # Device endpoints
├── meters.api.ts            # Meter endpoints
├── contacts.api.ts          # Contact endpoints
├── dashboards.api.ts        # Dashboard endpoints
├── client.ts                # Base API client
└── index.ts
```

**API Client Pattern:**
```typescript
/**
 * Users API client
 */
export class UsersApiClient {
  constructor(private readonly client: ApiClient) {}

  async getUsers(tenantId: number): Promise<User[]> {
    const response = await this.client.get('/users', {
      params: { tenant_id: tenantId },
    });
    return response.data;
  }

  async createUser(tenantId: number, dto: CreateUserDto): Promise<User> {
    const response = await this.client.post('/users', {
      ...dto,
      tenant_id: tenantId,
    });
    return response.data;
  }

  async updateUser(userId: number, dto: UpdateUserDto): Promise<User> {
    const response = await this.client.put(`/users/${userId}`, dto);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.client.delete(`/users/${userId}`);
  }
}
```

**Key Characteristics:**
- Organized by domain (auth.api.ts, users.api.ts, etc.)
- Uses typed request/response shapes from backend DTOs
- Includes error handling and retry logic
- Exported from centralized index file
- Consistent patterns for all endpoints

## File Organization

### Backend - Current Structure (Before Refactor)
```
src/
├── types/
│   └── index.ts             # Mixed entities, DTOs, types
├── models/
│   └── *.js                 # Scattered model definitions
├── routes/
│   └── *.js                 # Scattered type definitions
└── ...
```

### Backend - Target Structure (After Refactor)
```
src/
├── entities/
│   ├── user.entity.ts
│   ├── tenant.entity.ts
│   ├── device.entity.ts
│   ├── meter.entity.ts
│   ├── contact.entity.ts
│   ├── dashboard.entity.ts
│   └── index.ts
├── dtos/
│   ├── users/
│   ├── tenants/
│   ├── devices/
│   ├── meters/
│   ├── contacts/
│   ├── dashboards/
│   ├── auth/
│   └── index.ts
├── types/
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── device.types.ts
│   ├── meter.types.ts
│   ├── contact.types.ts
│   ├── dashboard.types.ts
│   ├── common.types.ts
│   └── index.ts
├── modules/
│   ├── auth/
│   ├── users/
│   ├── tenants/
│   ├── devices/
│   ├── meters/
│   ├── contacts/
│   └── dashboards/
├── routes/
├── models/
└── ...
```

### Frontend - Current Structure (Before Refactor)
```
src/
├── components/
│   └── *.tsx                # Mixed components and types
├── pages/
│   └── *.tsx                # Mixed pages and types
├── services/
│   └── *.ts                 # Scattered type definitions
└── ...
```

### Frontend - Target Structure (After Refactor)
```
src/
├── types/
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── device.types.ts
│   ├── meter.types.ts
│   ├── contact.types.ts
│   ├── dashboard.types.ts
│   ├── common.types.ts
│   └── index.ts
├── components/
│   ├── common/
│   ├── users/
│   ├── devices/
│   ├── meters/
│   ├── contacts/
│   └── dashboards/
├── features/
│   ├── auth/
│   ├── users/
│   ├── devices/
│   ├── meters/
│   ├── contacts/
│   └── dashboards/
├── api/
│   ├── auth.api.ts
│   ├── users.api.ts
│   ├── devices.api.ts
│   ├── meters.api.ts
│   ├── contacts.api.ts
│   ├── dashboards.api.ts
│   ├── client.ts
│   └── index.ts
├── pages/
├── services/
└── ...
```

## Migration Strategy

### Phase 1: Create New Layer Structure
1. Create `src/entities/` directory with entity files (backend)
2. Create `src/dtos/` directory with DTO files (backend)
3. Create `src/types/` directory with type files (both)
4. Create `src/modules/` directory with module files (backend)
5. Create `src/features/` directory with feature files (frontend)
6. Create `src/api/` directory with API client files (frontend)

### Phase 2: Move and Consolidate Types
1. Extract entity interfaces → `src/entities/` (backend)
2. Extract DTO interfaces → `src/dtos/` (backend)
3. Extract utility types → `src/types/` (both)
4. Create centralized index files for each layer

### Phase 3: Update Imports
1. Update all imports in services to use new paths
2. Update all imports in components to use new paths
3. Update all imports in pages to use new paths
4. Update all imports in API handlers to use new paths
5. Update all imports in tests to use new paths

### Phase 4: Verify Functionality
1. Run type checking: `npm run type-check`
2. Run tests: `npm test`
3. Run build: `npm run build`
4. Verify no broken imports or type errors

## Import Consolidation

### Backend - Before Refactor
```typescript
import { UserEntity } from '../types';
import { CreateUserDto } from '../routes/users';
import { UserRole } from '../models/user';
```

### Backend - After Refactor
```typescript
import { UserEntity } from '../entities';
import { CreateUserDto } from '../dtos';
import { UserRole } from '../types';
```

### Frontend - Before Refactor
```typescript
import { User } from '../services/users.service';
import { UserFormProps } from '../components/UserForm';
import { UserRole } from '../pages/UsersPage';
```

### Frontend - After Refactor
```typescript
import { User, UserRole } from '../types';
import { UserFormProps } from '../components/users/UserForm';
import { UsersApiClient } from '../api';
```

## Dependency Injection Pattern

### Backend
All services use constructor-based dependency injection:

```typescript
export class UsersService {
  constructor(
    private readonly database: Database,
    private readonly logger: Logger,
  ) {}
}
```

### Frontend
Services are instantiated and passed to components via context or hooks:

```typescript
const usersService = new UsersService(apiClient);

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    usersService.getUsers().then(setUsers);
  }, []);
  
  return users;
};
```

## Backward Compatibility

- All existing APIs continue to work without modification
- All database operations produce identical results
- All frontend features maintain the same user experience
- All error handling remains consistent
- All tests pass without modification

## Implementation Order

1. **Create type layer** - Define all types and enums (both)
2. **Create entity layer** - Define all entities (backend)
3. **Create DTO layer** - Define all DTOs with validation (backend)
4. **Create module layer** - Organize services into modules (backend)
5. **Create component props layer** - Define all component props (frontend)
6. **Create feature organization** - Organize features by domain (frontend)
7. **Create API client layer** - Define all API clients (frontend)
8. **Update imports** - Update all imports across codebase (both)
9. **Verify functionality** - Run tests and type checking (both)

## Key Decisions

1. **No ORM Framework**: Using interfaces instead of decorators (backend)
2. **Class-Validator**: Using for DTO validation (backend)
3. **Dependency Injection**: Constructor-based injection for testability (backend)
4. **Centralized Exports**: All layers export from index files for clean imports
5. **Domain-Based Organization**: Modules/features organized by business domain
6. **Co-located Props**: Component props defined alongside components (frontend)
7. **Service-Based API**: API clients organized by domain (frontend)

## Success Criteria

- ✓ All entities consolidated in `src/entities/` (backend)
- ✓ All DTOs consolidated in `src/dtos/` (backend)
- ✓ All types consolidated in `src/types/` (both)
- ✓ All modules organized in `src/modules/` (backend)
- ✓ All features organized in `src/features/` (frontend)
- ✓ All API clients organized in `src/api/` (frontend)
- ✓ All component props defined and exported (frontend)
- ✓ All imports updated to use new paths
- ✓ All tests pass
- ✓ Type checking passes
- ✓ Build succeeds
- ✓ No broken imports
- ✓ Backward compatibility maintained
