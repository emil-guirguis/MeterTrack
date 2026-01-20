# Design Document: Database-Driven Dashboard

## Overview

The Database-Driven Dashboard feature enables users to create customizable dashboard cards that display aggregated power metrics from the meter_reading table. Users can select any numeric power columns, configure time frames (preset or custom), choose visualization types, and drill down to detailed meter readings. The system uses a PostgreSQL-backed Dashboard table to persist user configurations and provides efficient data aggregation through SQL queries.

## Architecture

### High-Level Flow

```
User Dashboard Page
    ↓
Load Dashboard Cards (Dashboard table)
    ↓
For each card:
  - Discover selected power columns
  - Calculate time frame (preset or custom)
  - Query meter_reading table with aggregation
  - Render card with visualization
    ↓
User clicks card → Drill-down view
    ↓
Display detailed meter readings in data grid
    ↓
User can export to CSV or refresh data
```

### System Components

1. **Backend API Layer**
   - Dashboard card CRUD endpoints
   - Power column discovery endpoint
   - Meter reading aggregation endpoint
   - Detailed meter reading retrieval with pagination
   - CSV export endpoint

2. **Database Layer**
   - Dashboard table (configuration storage)
   - Existing meter_reading table (data source)
   - Indexes for efficient querying

3. **Frontend Layer**
   - Dashboard page with card grid layout
   - Dashboard card creation/edit modal
   - Card display component with visualization
   - Drill-down detail view with data grid
   - CSV export functionality

## Components and Interfaces

### Database Schema

#### Dashboard Table

```sql
CREATE TABLE dashboard (
  dashboard_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  created_by_users_id BIGINT NOT NULL,
  meter_id BIGINT NOT NULL,
  meter_element_id BIGINT NOT NULL,
  card_name VARCHAR(255) NOT NULL,
  card_description TEXT,
  
  -- Column selection (JSON array of column names)
  selected_columns JSONB NOT NULL DEFAULT '[]',
  
  -- Time frame configuration
  time_frame_type VARCHAR(50) NOT NULL DEFAULT 'last_month',
    -- Values: 'custom', 'last_month', 'this_month_to_date', 'since_installation'
  custom_start_date TIMESTAMP,
  custom_end_date TIMESTAMP,
  
  -- Visualization configuration
  visualization_type VARCHAR(50) NOT NULL DEFAULT 'line',
    -- Values: 'pie', 'line', 'candlestick', 'bar', 'area'
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_dashboard_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id),
  CONSTRAINT fk_dashboard_users FOREIGN KEY (created_by_users_id) REFERENCES "users"(users_id),
    CONSTRAINT fk_dashboard_meter FOREIGN KEY (meter_id) REFERENCES meter(meter_id),
  CONSTRAINT fk_dashboard_meter_element FOREIGN KEY (meter_element_id) REFERENCES meter_element(meter_element_id),
  CONSTRAINT check_time_frame_type CHECK (time_frame_type IN ('custom', 'last_month', 'this_month_to_date', 'since_installation')),
  CONSTRAINT check_visualization_type CHECK (visualization_type IN ('pie', 'line', 'candlestick', 'bar', 'area'))
);

-- Indexes for efficient querying
CREATE INDEX idx_dashboard_tenant_id ON dashboard(tenant_id);
CREATE INDEX idx_dashboard_created_by ON dashboard(created_by_user_id);
CREATE INDEX idx_dashboard_meter ON dashboard(meter_id);
CREATE INDEX idx_dashboard_meter_element ON dashboard(meter_element_id);
```

### API Endpoints

#### 1. Get All Dashboard Cards
```
GET /api/dashboard/cards
Headers: Authorization: Bearer {token}
Response:
{
  success: true,
  data: [
    {
      dasboard_id: 1,
      card_name: "Monthly Energy",
      meter_id: 1,
      meter_element_id: 5,
      selected_columns: ["active_energy", "power"],
      time_frame_type: "last_month",
      visualization_type: "line",
      aggregated_data: {
        active_energy: 1250.50,
        power: 45.25
      },
      meter_element: { id: 5, name: "Main Panel" }
    }
  ]
}
```

#### 2. Create Dashboard Card
```
POST /api/dashboard/cards
Body:
{
  card_name: "Monthly Energy",
  card_description: "Total energy consumption last month",
  meter_element_id: 5,
  selected_columns: ["active_energy", "power"],
  time_frame_type: "last_month",
  visualization_type: "line"
}
Response: { success: true, data: { id: 1, ... } }
```

#### 3. Update Dashboard Card
```
PUT /api/dashboard/cards/:id
Body: { card_name, selected_columns, time_frame_type, visualization_type, ... }
Response: { success: true, data: { id: 1, ... } }
```

#### 4. Delete Dashboard Card
```
DELETE /api/dashboard/cards/:id
Response: { success: true, message: "Card deleted" }
```

#### 5. Get Available Power Columns
```
GET /api/dashboard/power-columns
Response:
{
  success: true,
  data: [
    { name: "active_energy", type: "numeric", label: "Active Energy" },
    { name: "power", type: "numeric", label: "Power" },
    { name: "power_phase_a", type: "numeric", label: "Power Phase A" },
    ...
  ]
}
```

#### 6. Get Aggregated Card Data
```
GET /api/dashboard/cards/:id/data
Response:
{
  success: true,
  data: {
    card_id: 1,
    time_frame: { start: "2024-01-01", end: "2024-01-31" },
    aggregated_values: {
      active_energy: 1250.50,
      power: 45.25
    }
  }
}
```

#### 7. Get Detailed Meter Readings (Drill-Down)
```
GET /api/dashboard/cards/:id/readings?page=1&pageSize=50&sortBy=created_at&sortOrder=desc
Response:
{
  success: true,
  data: {
    items: [
      {
        meter_reading_id: "uuid-1",
        created_at: "2024-01-31T23:59:00Z",
        active_energy: 1250.50,
        power: 45.25,
        ...
      }
    ],
    pagination: {
      page: 1,
      pageSize: 50,
      total: 1500,
      totalPages: 30,
      hasMore: true
    }
  }
}
```

#### 8. Export Meter Readings to CSV
```
GET /api/dashboard/cards/:id/readings/export?format=csv
Response: CSV file download
```

### Frontend Components

#### DashboardPage Component
- Displays grid of dashboard cards
- Add/Edit/Delete card buttons
- Global refresh button
- Responsive layout

#### DashboardCard Component
- Card header with name and meter element
- Visualization (pie, line, candlestick, bar, area)
- Aggregated values display
- Drill-down link
- Individual refresh button

#### DashboardCardModal Component
- Form for creating/editing cards
- Multi-select dropdown for power columns (auto-populated)
- Time frame selector (preset or custom date range)
- Visualization type selector
- Validation and error handling

#### DetailedReadingsView Component
- Data grid with pagination
- Sortable columns
- Timestamp and selected power columns
- Export to CSV button
- Back to dashboard link

### Data Models

#### Dashboard Card Model (Backend)
```typescript
interface DashboardCard {
  id: number;
  tenant_id: number;
  created_by_user_id: number;
  meter_element_id: number;
  card_name: string;
  card_description?: string;
  selected_columns: string[];
  time_frame_type: 'custom' | 'last_month' | 'this_month_to_date' | 'since_installation';
  custom_start_date?: Date;
  custom_end_date?: Date;
  visualization_type: 'pie' | 'line' | 'candlestick' | 'bar' | 'area';
  created_at: Date;
  updated_at: Date;
}
```

#### Aggregated Data Model
```typescript
interface AggregatedData {
  card_id: number;
  time_frame: {
    start: Date;
    end: Date;
  };
  aggregated_values: Record<string, number>;
  meter_element: {
    id: number;
    name: string;
  };
}
```

#### Meter Reading Detail Model
```typescript
interface MeterReadingDetail {
  meter_reading_id: string;
  created_at: Date;
  [key: string]: any; // Selected power columns
}
```

## Data Aggregation Logic

### Time Frame Calculation

```typescript
function calculateTimeFrame(timeFrameType: string, customStart?: Date, customEnd?: Date) {
  const now = new Date();
  
  switch (timeFrameType) {
    case 'custom':
      return { start: customStart, end: customEnd };
    
    case 'last_month':
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start: lastMonthStart, end: lastMonthEnd };
    
    case 'this_month_to_date':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
    
    case 'since_installation':
      // Query earliest meter reading for this element
      const earliestReading = await queryEarliestReading(meterElementId);
      return { start: earliestReading.created_at, end: now };
  }
}
```

### Aggregation Query Pattern

```sql
SELECT
  SUM(active_energy) as active_energy,
  MAX(power) as power,
  AVG(power_factor) as power_factor,
  -- Add more columns based on selected_columns
FROM meter_reading
WHERE
  tenant_id = $1
  AND meter_element_id = $2
  AND created_at >= $3
  AND created_at <= $4
GROUP BY meter_element_id;
```

### Aggregation Strategy

- **SUM**: For energy columns (active_energy, reactive_energy, apparent_energy)
- **MAX**: For instantaneous power columns (power, apparent_power, reactive_power)
- **AVG**: For factor columns (power_factor, voltage_thd)
- **MIN/MAX**: For voltage and current measurements

## Error Handling

### Validation

1. **Card Creation/Update**
   - Validate meter_element_id exists and belongs to tenant
   - Validate selected_columns are numeric and exist in meter_reading table
   - Validate time_frame_type is valid
   - Validate custom date range (start < end) if time_frame_type is 'custom'
   - Validate visualization_type is supported

2. **Data Retrieval**
   - Handle empty result sets gracefully
   - Return zero values for missing data
   - Handle timezone differences in date calculations

3. **CSV Export**
   - Handle special characters and escaping
   - Validate file size limits
   - Handle encoding issues

### Error Responses

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "selected_columns", "message": "Column 'invalid_col' does not exist" },
    { "field": "custom_end_date", "message": "End date must be after start date" }
  ]
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Meter Element Validation
*For any* dashboard card creation attempt with a meter_element_id, the system should only accept the card if the meter element exists and belongs to the authenticated user's tenant.
**Validates: Requirements 1.4, 1.5, 7.3**

### Property 2: Time Frame Consistency
*For any* dashboard card with a preset time frame type, querying the card at different times should return data within the expected time boundaries (e.g., 'last_month' always returns previous calendar month).
**Validates: Requirements 2.3, 2.4, 2.5, 5.6**

### Property 3: Aggregation Correctness
*For any* set of meter readings within a time frame, the aggregated values returned by the dashboard should match the result of applying the same aggregation function (SUM for energy, MAX for power) to all readings in that time frame.
**Validates: Requirements 2.1, 2.2, 2.7, 3.1**

### Property 4: Tenant Data Isolation
*For any* dashboard card query, the returned data should only include meter readings from the card's tenant_id, and users should never see data from other tenants.
**Validates: Requirements 1.7, 5.7, 7.2, 9.8**

### Property 5: Column Selection Validity
*For any* dashboard card, all selected_columns should exist in the meter_reading table and be numeric columns, and attempting to select non-existent or non-numeric columns should be rejected.
**Validates: Requirements 1.9, 2.1, 6.5**

### Property 6: Drill-Down Data Consistency
*For any* dashboard card, the sum of individual meter readings in the drill-down view (for SUM aggregations) should equal the aggregated value displayed in the card.
**Validates: Requirements 9.1, 9.3, 9.9**

### Property 7: CSV Export Round-Trip
*For any* set of meter readings, exporting to CSV and parsing the CSV should produce equivalent data with all columns and values preserved.
**Validates: Requirements 10.2, 10.3, 10.7**

### Property 8: Visualization Type Validation
*For any* dashboard card creation or update, the system should only accept visualization_type values from the supported set ('pie', 'line', 'candlestick', 'bar', 'area').
**Validates: Requirements 6.1, 6.5**

### Property 9: Card Update Idempotence
*For any* dashboard card, updating it multiple times with the same values should result in identical stored data.
**Validates: Requirements 4.6**

### Property 10: Pagination Consistency
*For any* drill-down view with pagination, requesting the same page multiple times should return identical results, and the total count should remain consistent.
**Validates: Requirements 9.5, 9.6**

## Testing Strategy

### Unit Tests

1. **Time Frame Calculation**
   - Test each preset time frame calculation
   - Test custom date range validation
   - Test edge cases (month boundaries, leap years)

2. **Aggregation Logic**
   - Test SUM aggregation for energy columns
   - Test MAX aggregation for power columns
   - Test AVG aggregation for factor columns
   - Test with empty result sets

3. **Validation**
   - Test meter_element_id validation
   - Test column existence validation
   - Test date range validation
   - Test visualization_type validation

4. **CSV Export**
   - Test CSV formatting with special characters
   - Test header row generation
   - Test metadata inclusion
   - Test file naming

### Property-Based Tests

**Property 1: Time Frame Consistency**
*For any* dashboard card with a preset time frame, querying the same card at different times should return data within the expected time boundaries.
**Validates: Requirements 4.3, 4.4, 4.5**

**Property 2: Aggregation Idempotence**
*For any* dashboard card, refreshing the data multiple times within the same time frame should return identical aggregated values.
**Validates: Requirements 5.1, 5.2**

**Property 3: Tenant Data Isolation**
*For any* dashboard card, the aggregated data should only include meter readings from the card's tenant_id.
**Validates: Requirements 1.7, 5.7**

**Property 4: Column Selection Validity**
*For any* dashboard card, all selected_columns should exist in the meter_reading table and be numeric.
**Validates: Requirements 1.9, 2.3**

**Property 5: Drill-Down Data Consistency**
*For any* dashboard card, the sum of individual meter readings in the drill-down view should equal the aggregated value in the card (for SUM aggregations).
**Validates: Requirements 10.3, 10.7**

**Property 6: CSV Export Round-Trip**
*For any* set of meter readings, exporting to CSV and parsing the CSV should produce equivalent data.
**Validates: Requirements 11.2, 11.3**

### Integration Tests

1. **Full CRUD Workflow**
   - Create card → Read card → Update card → Delete card
   - Verify data persists correctly

2. **Dashboard Page Flow**
   - Load dashboard → Display cards → Refresh cards → Drill down → Export data

3. **Multi-Card Scenarios**
   - Create multiple cards with different configurations
   - Verify each card displays correct data
   - Verify tenant isolation across cards

4. **Time Frame Transitions**
   - Create card with preset time frame
   - Verify data updates as time progresses
   - Switch between preset and custom time frames

## Performance Considerations

### Database Indexes

```sql
-- Primary indexes for filtering
CREATE INDEX idx_dashboard_tenant_id ON dashboard(tenant_id);
CREATE INDEX idx_dashboard_meter ON dashboard(meter_id);
CREATE INDEX idx_dashboard_meter_element ON dashboard(meter_element_id);

-- Indexes for meter_reading queries
CREATE INDEX idx_meter_reading_tenant_element_date 
  ON meter_reading(tenant_id, meter_id,  meter_element_id, created_at);
```

### Query Optimization

1. **Aggregation Queries**
   - Use indexed columns in WHERE clause
   - Limit date range to necessary period
   - Use EXPLAIN ANALYZE to verify query plans

2. **Pagination**
   - Use LIMIT/OFFSET for drill-down views
   - Default page size: 50 rows
   - Maximum page size: 500 rows

3. **Caching**
   - Cache power column list (invalidate on schema changes)
   - Cache meter element list per tenant
   - Consider caching aggregated values for 5-minute intervals

### Scalability

- Dashboard cards per tenant: Typically < 100
- Meter readings per element: Can be millions
- Aggregation queries should complete in < 1 second
- Drill-down pagination handles large datasets

## Security Considerations

1. **Tenant Isolation**
   - All queries filtered by tenant_id
   - Validate user's tenant_id matches card's tenant_id
   - Prevent cross-tenant data access

2. **Authorization**
   - Require 'dashboard:read' permission to view cards
   - Require 'dashboard:create' permission to create cards
   - Require 'dashboard:edit' permission to update cards
   - Require 'dashboard:delete' permission to delete cards

3. **Input Validation**
   - Validate all user inputs before database operations
   - Sanitize column names to prevent SQL injection
   - Validate date ranges
   - Validate JSON arrays

4. **CSV Export**
   - Validate user has permission to export
   - Include audit log entry for exports
   - Limit export frequency to prevent abuse

## Deployment Considerations

1. **Database Migration**
   - Create dashboard table
   - Create indexes
   - No data migration needed (new feature)

2. **API Deployment**
   - Add new routes to backend
   - Update API documentation
   - Add permission checks

3. **Frontend Deployment**
   - Add new pages and components
   - Update navigation
   - Add feature flag if needed for gradual rollout

## Future Enhancements

1. **Advanced Visualizations**
   - Heatmaps for time-series data
   - Gauge charts for current values
   - Comparison charts for multiple meters

2. **Scheduled Reports**
   - Email dashboard data on schedule
   - PDF export with charts
   - Automated alerts on thresholds

3. **Dashboard Sharing**
   - Share dashboard with other users
   - Public dashboard links
   - Dashboard templates

4. **Real-Time Updates**
   - WebSocket updates for live data
   - Auto-refresh intervals
   - Streaming aggregations

5. **Advanced Filtering**
   - Filter by meter element attributes
   - Filter by data quality
   - Filter by anomalies
