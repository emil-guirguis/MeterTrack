# Design Document: Meter Reading Export Buttons

## Overview

This design implements two new action buttons in the MeterReadingList component: an Export Excel button and an Email button. Both buttons generate CSV files from the currently displayed meter readings, respecting all active filters (tenant ID, meter ID, meter element ID). The Export button triggers a file download dialog, while the Email button opens the default email client with the CSV file automatically attached. The implementation uses a utility-based approach with a CSV generator, filename formatter, and export handler to keep concerns separated and testable.

## Architecture

The feature consists of three main layers:

1. **UI Layer**: Two new buttons in the MeterReadingList component header with loading states and tooltips
2. **Export Service Layer**: Utilities for CSV generation, filename formatting, and export operations
3. **Integration Layer**: Handlers that coordinate between the UI and export services, managing file dialogs and email client interactions

The architecture respects the existing MeterReadingList filtering logic by reusing the same `filteredData` that's already computed and displayed. This ensures export operations always match what the user sees.

## Components and Interfaces

### 1. Export Buttons Component

**Location**: `MeterReadingList.tsx` (header section)

**Responsibilities**:
- Render Export Excel and Email buttons
- Manage button loading and disabled states
- Display tooltips on hover
- Handle click events and pass to export handlers

**Props**:
- `filteredData`: Array of meter readings to export
- `selectedMeterName`: Name of selected meter for display
- `selectedElementName`: Name of selected element for filename
- `loading`: Boolean indicating if data is loading
- `onExportClick`: Callback for export button click
- `onEmailClick`: Callback for email button click

### 2. CSV Generator Utility

**Location**: `utils/csvGenerator.ts`

**Responsibilities**:
- Convert meter reading objects to CSV format
- Include all relevant columns from meter reading data
- Properly escape special characters (commas, quotes, newlines)
- Add header row with column names
- Sort data by created_at descending
- Use UTF-8 encoding

**Interface**:
```typescript
interface MeterReading {
  meter_id: number;
  meter_element_id: number;
  reading_value: number;
  reading_date: string;
  created_at: string;
  [key: string]: any;
}

function generateCSV(readings: MeterReading[]): string
```

**Returns**: CSV string with proper formatting and escaping

### 3. Filename Formatter Utility

**Location**: `utils/filenameFormatter.ts`

**Responsibilities**:
- Generate user-friendly filenames
- Format: `[YYYY-MM-DD]_Meter_Readings_[elementName].csv`
- Handle special characters in element names
- Ensure filename is filesystem-safe

**Interface**:
```typescript
function formatExportFilename(elementName: string, currentDate?: Date): string
```

**Returns**: Formatted filename string

### 4. Export Handler

**Location**: `utils/exportHandler.ts`

**Responsibilities**:
- Validate that data exists before export
- Trigger file download dialog
- Handle user cancellation
- Display success/error notifications
- Manage loading state

**Interface**:
```typescript
interface ExportOptions {
  data: MeterReading[];
  filename: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
}

function handleExport(options: ExportOptions): Promise<void>
```

### 5. Email Handler

**Location**: `utils/emailHandler.ts`

**Responsibilities**:
- Validate that data exists before email
- Generate CSV file
- Create mailto URL with attachment
- Open default email client
- Clean up temporary files
- Handle errors and cleanup

**Interface**:
```typescript
interface EmailOptions {
  data: MeterReading[];
  filename: string;
  meterInfo: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
}

function handleEmail(options: EmailOptions): Promise<void>
```

## Data Models

### Meter Reading Data Structure

```typescript
interface MeterReading {
  id: number;
  tenant_id: number;
  meter_id: number;
  meter_element_id: number;
  reading_value: number;
  reading_date: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any; // Additional fields from database
}
```

### Export State

```typescript
interface ExportState {
  isLoading: boolean;
  error: string | null;
  lastExportTime?: Date;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: CSV Contains Filtered Data

*For any* set of meter readings and any filter criteria (meter_id, meter_element_id), the generated CSV SHALL contain exactly the readings that match those filters and no others.

**Validates: Requirements 1.1, 2.1, 3.1, 3.2, 3.3, 3.4**

### Property 2: CSV Includes All Columns

*For any* meter reading object, the generated CSV SHALL include all columns present in the meter reading data (meter_id, meter_element_id, reading_value, reading_date, created_at, and any additional fields).

**Validates: Requirements 1.2**

### Property 3: Filename Format Correctness

*For any* element name and current date, the generated filename SHALL match the pattern `[YYYY-MM-DD]_Meter_Readings_[elementName].csv` where the date is today's date and element name is properly formatted.

**Validates: Requirements 1.3**

### Property 4: CSV Special Character Escaping

*For any* meter reading containing special characters (commas, quotes, newlines), the generated CSV SHALL properly escape these characters so the CSV remains valid and parseable.

**Validates: Requirements 4.2**

### Property 5: CSV Header Row Present

*For any* non-empty set of meter readings, the generated CSV SHALL include a header row as the first line containing all column names.

**Validates: Requirements 4.1**

### Property 6: CSV UTF-8 Encoding

*For any* meter reading data including non-ASCII characters, the generated CSV file SHALL be encoded in UTF-8 format.

**Validates: Requirements 4.3**

### Property 7: CSV Sort Order

*For any* set of meter readings with different created_at timestamps, the generated CSV SHALL be sorted by created_at in descending order (newest readings first).

**Validates: Requirements 4.4**

### Property 8: Email Subject Line Includes Meter Info

*For any* email operation with meter information, the generated mailto URL SHALL include a subject line containing the meter and element information.

**Validates: Requirements 2.4**

### Property 9: Buttons Disabled During Loading

*For any* state where meter readings are loading, both Export and Email buttons SHALL be in a disabled state.

**Validates: Requirements 6.5**

### Property 10: CSV Round Trip

*For any* set of meter readings, parsing the generated CSV back into objects SHALL produce data equivalent to the original readings (same columns, same values, same order).

**Validates: Requirements 1.2, 4.1, 4.2, 4.3, 4.4**

## Error Handling

### Empty Data Handling

When no meter readings match the filter criteria:
- Display an informative message: "No meter readings available to export. Please adjust your filters."
- Disable export/email operations
- Do not generate or download files

### CSV Generation Errors

If CSV generation fails:
- Log the error with context
- Display: "Failed to generate export file. Please try again."
- Ensure no partial files are created

### File Dialog Cancellation

If the user cancels the file save dialog:
- Abort the export operation silently
- Do not display error message (user initiated cancellation)
- Clean up any temporary resources

### Email Client Errors

If the email client fails to open:
- Display: "Failed to open email client. Please check your email configuration."
- Delete temporary CSV file
- Log error for debugging

### Network/API Errors

If fetching meter readings fails:
- Display existing error handling from MeterReadingList
- Disable export/email buttons
- Retry mechanism already in place

## Testing Strategy

### Unit Testing

Unit tests verify specific examples and edge cases:

1. **CSV Generation Tests**
   - Test CSV generation with various data types
   - Test special character escaping (commas, quotes, newlines, unicode)
   - Test empty data handling
   - Test column ordering and header row

2. **Filename Formatting Tests**
   - Test filename generation with various element names
   - Test special character handling in filenames
   - Test date formatting

3. **Export Handler Tests**
   - Test successful export flow
   - Test cancellation handling
   - Test error scenarios
   - Test loading state management

4. **Email Handler Tests**
   - Test email URL generation
   - Test subject line formatting
   - Test temporary file creation and cleanup
   - Test error scenarios

5. **Component Integration Tests**
   - Test button rendering
   - Test button disabled state during loading
   - Test button click handlers
   - Test tooltip display

### Property-Based Testing

Property-based tests verify universal properties across many generated inputs:

1. **Property 1: CSV Contains Filtered Data**
   - Generate random meter readings with various meter_id and meter_element_id values
   - Apply random filter combinations
   - Verify CSV contains exactly the filtered readings
   - Minimum 100 iterations

2. **Property 2: CSV Includes All Columns**
   - Generate random meter reading objects with various field combinations
   - Verify all fields appear in CSV header
   - Minimum 100 iterations

3. **Property 3: Filename Format Correctness**
   - Generate random element names
   - Verify filename matches expected pattern
   - Minimum 100 iterations

4. **Property 4: CSV Special Character Escaping**
   - Generate meter readings with special characters in all string fields
   - Verify CSV is valid and parseable
   - Minimum 100 iterations

5. **Property 5: CSV Header Row Present**
   - Generate random non-empty meter reading sets
   - Verify first line contains column headers
   - Minimum 100 iterations

6. **Property 6: CSV UTF-8 Encoding**
   - Generate meter readings with unicode characters
   - Verify file encoding is UTF-8
   - Minimum 100 iterations

7. **Property 7: CSV Sort Order**
   - Generate meter readings with random timestamps
   - Verify CSV is sorted by created_at descending
   - Minimum 100 iterations

8. **Property 8: Email Subject Line Includes Meter Info**
   - Generate random meter information
   - Verify subject line contains expected information
   - Minimum 100 iterations

9. **Property 9: Buttons Disabled During Loading**
   - Generate various loading states
   - Verify button disabled state matches loading state
   - Minimum 100 iterations

10. **Property 10: CSV Round Trip**
    - Generate random meter readings
    - Export to CSV and parse back
    - Verify parsed data matches original
    - Minimum 100 iterations

### Testing Library Selection

- **Unit Tests**: Jest with React Testing Library for component tests
- **Property-Based Tests**: fast-check for JavaScript/TypeScript property testing
- **CSV Validation**: papaparse for CSV parsing in tests

### Test Configuration

Each property-based test SHALL:
- Run minimum 100 iterations
- Include a comment tag: `// Feature: meter-reading-export, Property N: [Property Title]`
- Reference the design document property number
- Use descriptive assertion messages
