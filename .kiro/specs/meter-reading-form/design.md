# Meter Reading Form - Design

## Overview

The Meter Reading Form is a comprehensive display component that presents the most recent meter reading for a selected meter element. It integrates with existing dashboard card components for graph visualization and provides users with detailed meter information, consumption/generation data organized by phase, and historical trend analysis through interactive graphs.

The form serves as a detailed view complementing the meter reading list, allowing operators to drill down into specific meter elements and analyze their data with multiple visualization options.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ MeterReadingForm Component                                  │
│ - Manages form state and data fetching                      │
│ - Coordinates sub-components                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ MeterInfoPanel   │ │ ReadingDataTable  │ │ ConsumptionGraph │
│ - Driver name    │ │ - Sections       │ │ - Time filters   │
│ - Description    │ │ - Phases         │ │ - Graph types    │
│ - Serial number  │ │ - Frequency      │ │ - Dashboard card │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        ↓                   ↓                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Meter Reading Service (Existing)                            │
│ - Fetch last reading for meter element                      │
│ - Fetch historical readings for graph data                  │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend API                                                 │
│ - GET /api/meter-readings/last/:elementId                   │
│ - GET /api/meter-readings/history/:elementId                │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### MeterReadingForm Component

**Purpose**: Main container component that orchestrates data fetching and sub-component rendering.

**Props**:
```typescript
interface MeterReadingFormProps {
  meterElementId: string;
  onNavigateToList?: () => void;
}
```

**Responsibilities**:
- Fetch last meter reading for the meter element
- Manage loading and error states
- Coordinate graph data fetching based on time period and graph type selections
- Render sub-components with appropriate data

**State**:
```typescript
interface MeterReadingFormState {
  lastReading: MeterReading | null;
  graphData: GraphDataPoint[];
  selectedTimePeriod: 'today' | 'weekly' | 'monthly' | 'yearly';
  selectedGraphType: 'consumption' | 'demand' | 'ghg_emissions';
  isLoading: boolean;
  error: Error | null;
}
```

### MeterInfoPanel Component

**Purpose**: Displays meter metadata and information.

**Props**:
```typescript
interface MeterInfoPanelProps {
  meter: Meter;
  reading: MeterReading;
}
```

**Displays**:
- Driver name (from meter.driver)
- Meter description (from meter.description)
- Serial number (from meter.serialNumber)
- Reading timestamp (from reading.timestamp)

### ReadingDataTable Component

**Purpose**: Displays meter reading values organized by section and phase.

**Props**:
```typescript
interface ReadingDataTableProps {
  reading: MeterReading;
}
```

**Structure**:
- Sections: Total Consumption, Total Generation, etc.
- Columns: Overall, Phase 1, Phase 2, Phase 3
- Rows: Metrics (Voltage, Current, Power, etc.)
- Frequency display with Hz unit

**Data Organization**:
```typescript
interface ReadingSection {
  name: string;
  metrics: {
    [metricName: string]: {
      overall: number | null;
      phase1: number | null;
      phase2: number | null;
      phase3: number | null;
      unit: string;
    }
  }
}
```

### ConsumptionGraph Component

**Purpose**: Displays consumption trends with time period and graph type filters.

**Props**:
```typescript
interface ConsumptionGraphProps {
  meterElementId: string;
  timePeriod: 'today' | 'weekly' | 'monthly' | 'yearly';
  graphType: 'consumption' | 'demand' | 'ghg_emissions';
  onTimePeriodChange: (period: string) => void;
  onGraphTypeChange: (type: string) => void;
}
```

**Features**:
- Time period filter buttons (Today, Weekly, Monthly, Yearly)
- Graph type toggle (Consumption, Demand, GHG Emissions)
- Uses existing dashboard card component for visualization
- Displays empty state when no data available

## Data Models

### MeterReading

```typescript
interface MeterReading {
  id: string;
  meterElementId: string;
  timestamp: Date;
  frequency: number; // Hz
  sections: {
    [sectionName: string]: {
      [metricName: string]: {
        overall: number | null;
        phase1: number | null;
        phase2: number | null;
        phase3: number | null;
        unit: string;
      }
    }
  }
}
```

### Meter

```typescript
interface Meter {
  id: string;
  driver: string;
  description: string;
  serialNumber: string;
  elements: MeterElement[];
}
```

### MeterElement

```typescript
interface MeterElement {
  id: string;
  meterId: string;
  name: string;
  type: 'consumption' | 'generation';
}
```

### GraphDataPoint

```typescript
interface GraphDataPoint {
  timestamp: Date;
  value: number;
  unit: string;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Last Reading Display
*For any* meter element with readings, when the form is displayed, the last reading timestamp should be more recent than all other readings for that element.
**Validates: Requirements 1.1, 1.2**

### Property 2: Meter Information Completeness
*For any* meter element, when the form is displayed, all meter information fields (driver, description, serial number) should be present in the rendered output.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Reading Values Organization
*For any* meter reading, when displayed in the data table, all reading values should be organized into their correct sections (Total Consumption, Total Generation, etc.).
**Validates: Requirements 3.1, 3.2**

### Property 4: Numeric Values with Units
*For any* reading value displayed in the data table, the rendered output should include both the numeric value and its unit of measurement.
**Validates: Requirements 3.3**

### Property 5: Frequency Display
*For any* meter reading, when the form is displayed, the frequency value should be shown with the Hz unit.
**Validates: Requirements 4.1, 4.2**

### Property 6: Time Period Filter Options
*For any* consumption graph, the rendered output should include all four time period filter options (Today, Weekly, Monthly, Yearly).
**Validates: Requirements 5.1**

### Property 7: Graph Update on Time Period Change
*For any* time period selection, when the user selects a different time period, the graph data should update to reflect readings from that period.
**Validates: Requirements 5.2, 5.3**

### Property 8: Graph Type Toggle Options
*For any* consumption graph, the rendered output should include all three graph type toggle options (Consumption, Demand, GHG Emissions).
**Validates: Requirements 6.1**

### Property 9: Graph Update on Type Change
*For any* graph type selection, when the user selects a different graph type, the graph data should update to display the selected type.
**Validates: Requirements 6.2**

### Property 10: Graph Type Persistence
*For any* graph type selection, when the user changes the time period while a graph type is selected, the graph type selection should remain unchanged.
**Validates: Requirements 6.3**

### Property 11: Navigation Button Presence
*For any* meter reading form, the rendered output should include a button to navigate to the meter reading list.
**Validates: Requirements 7.1**

### Property 12: Navigation to Filtered List
*For any* meter element, when the user clicks the navigation button, the application should navigate to the meter reading list filtered for that meter element.
**Validates: Requirements 7.2**

### Property 13: Readings in Chronological Order
*For any* meter element, when the meter reading list is displayed, all readings should be ordered chronologically (most recent first or oldest first, consistently).
**Validates: Requirements 7.3**

### Property 14: No Partial Data on Error
*For any* error state, when data fails to load, the form should not display partial or stale data from previous loads.
**Validates: Requirements 9.4**

## Error Handling

### Loading State
- Display loading spinner while fetching meter reading data
- Disable interactive elements during loading
- Show loading state for graph data separately from meter info

### Error States
- Display error message with description of the issue
- Provide "Retry" button to attempt data fetch again
- Clear previous data when error occurs
- Log errors for debugging

### Empty States
- When no readings exist: "No meter readings available for this element"
- When no graph data exists for period: "No data available for this time period"
- When meter info is missing: Display placeholder text or "N/A"

## Testing Strategy

### Unit Tests
- Test MeterInfoPanel renders all meter information fields
- Test ReadingDataTable correctly organizes reading values by section and phase
- Test ConsumptionGraph displays all time period and graph type options
- Test navigation button click triggers correct navigation
- Test error message displays on API failure
- Test loading indicator displays during data fetch
- Test empty states display appropriate messages

### Property-Based Tests
- **Property 1**: For all meter elements with readings, verify last reading is most recent
- **Property 2**: For all meter readings, verify all information fields are present
- **Property 3**: For all reading values, verify they're organized into correct sections
- **Property 4**: For all displayed values, verify they include units
- **Property 5**: For all readings, verify frequency displays with Hz unit
- **Property 6**: For all graphs, verify all time period options are present
- **Property 7**: For all time period selections, verify graph updates with correct data
- **Property 8**: For all graphs, verify all graph type options are present
- **Property 9**: For all graph type selections, verify graph updates with correct data
- **Property 10**: For all graph type selections, verify type persists across time period changes
- **Property 11**: For all forms, verify navigation button is present
- **Property 12**: For all navigation actions, verify correct list filtering
- **Property 13**: For all reading lists, verify chronological ordering
- **Property 14**: For all error states, verify no partial data is displayed

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Tag format: **Feature: meter-reading-form, Property {number}: {property_text}**
- Each property test validates one specific correctness property

### Integration Tests
- Test complete flow: navigate to form → view reading → change graph filters → navigate to list
- Test data consistency between form and list views
- Test error recovery (error → retry → success)
- Test responsive layout on different screen sizes

