# Design Document

## Overview

This design addresses the synchronization between the API device models and the PostgreSQL database structure. The system currently has inconsistencies where:

1. MongoDB `Devices` model uses `manufacture` and `notes` fields
2. PostgreSQL `DeviceService` uses `name` and `description` fields  
3. Meters API references both `brands` and `devices` tables
4. Frontend expects `name` and `description` fields

The solution will standardize on PostgreSQL as the single source of truth and ensure all API layers work consistently with the database schema.

## Architecture

### Current State
```
Frontend (Device Interface) → Backend Routes → DeviceService (PostgreSQL) ✓
                                            → Devices Model (MongoDB) ✗
Meters API → brands table (legacy) ✗
           → devices table (new) ✓
```

### Target State
```
Frontend (Device Interface) → Backend Routes → DeviceService (PostgreSQL) ✓
Meters API → devices table (unified) ✓
```

### Database Schema Alignment

**PostgreSQL devices table (target schema):**
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Components and Interfaces

### 1. Device API Layer

**Existing Components:**
- `backend/src/routes/devices.js` - Already implemented and working
- `backend/src/services/deviceService.js` - Already implemented and working

**Required Changes:**
- Remove MongoDB `Devices` model dependency
- Ensure consistent error handling and validation

### 2. Meters API Integration

**Current Issue:**
The meters API currently references both `brands` and `devices` tables, creating confusion.

**Solution:**
- Update `backend/src/models/MeterPG.js` to reference `devices` instead of `brands`
- Update `backend/src/routes/meters.js` to use `devices` table for device lookups
- Migrate existing `brands` data to `devices` table

### 3. Data Migration Strategy

**Migration Components:**
1. **Data Transfer:** Copy `brands` table data to `devices` table
2. **Field Mapping:** 
   - `brands.name` → `devices.name`
   - `brands.model` → `devices.description` (concatenated with name if needed)
3. **Reference Updates:** Update all `device_id` foreign keys to point to new device records

## Data Models

### Device Model (PostgreSQL)
```typescript
interface Device {
  id: string;           // UUID
  name: string;         // Device manufacturer/brand name
  description?: string; // Device model or additional details
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### API Response Format
```typescript
interface DeviceResponse {
  success: boolean;
  data: Device | Device[];
  error?: string;
}
```

### Migration Data Mapping
```typescript
interface BrandToDeviceMapping {
  // Source (brands table)
  brands: {
    id: string;
    name: string;
    model?: string;
  };
  
  // Target (devices table)
  devices: {
    id: string;        // New UUID
    name: string;      // brands.name
    description: string; // brands.model or combination
  };
}
```

## Error Handling

### API Error Responses
- **400 Bad Request:** Invalid input data or validation errors
- **404 Not Found:** Device not found for update/delete operations
- **409 Conflict:** Duplicate device name (unique constraint violation)
- **500 Internal Server Error:** Database connection or unexpected errors

### Migration Error Handling
- **Duplicate Names:** Handle by appending model information to make unique
- **Missing References:** Log orphaned meter records for manual review
- **Rollback Strategy:** Maintain backup of original brands table

## Testing Strategy

### Unit Tests
- DeviceService CRUD operations
- Data validation and error handling
- Migration script functionality

### Integration Tests
- Device API endpoints
- Meter-device relationship integrity
- Frontend-backend data flow

### Migration Testing
- Test migration with sample data
- Verify referential integrity after migration
- Validate no data loss during transition

## Implementation Phases

### Phase 1: Code Cleanup
- Remove MongoDB Devices model references
- Ensure DeviceService is the single source for device operations
- Add proper validation and error handling

### Phase 2: Database Migration
- Create migration script to transfer brands → devices
- Update meter references to use devices table
- Verify data integrity

### Phase 3: API Updates
- Update MeterPG model to join with devices instead of brands
- Update meters API to reference devices table
- Test all device-related endpoints

### Phase 4: Validation
- Run comprehensive tests
- Verify frontend functionality
- Monitor for any remaining inconsistencies