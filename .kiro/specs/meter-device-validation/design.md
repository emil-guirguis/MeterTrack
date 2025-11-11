# Design Document: Meter Device Validation

## Overview

This design document outlines the implementation approach for replacing the hardcoded brand dropdown and free-text model field in the MeterForm component with a dynamic device selection dropdown that validates against the existing device list. The solution integrates with the existing device store infrastructure and maintains backward compatibility with existing meter records.

## Architecture

### Component Architecture

```
MeterForm (Modified)
├── useDevice hook (existing)
├── Device Dropdown (new)
│   ├── Device options from store
│   ├── Loading state
│   └── Error handling
└── Form validation (enhanced)
```

### Data Flow

1. **Component Mount**: MeterForm loads → useDevice hook fetches devices → Device store returns cached or fresh data
2. **User Selection**: User selects device → Form updates device_id, brand, and model fields → Validation clears
3. **Form Submission**: User submits → Validation checks device selection → API receives meter data with device_id
4. **Edit Mode**: Form loads with meter data → Device dropdown pre-selects based on device_id → User can modify selection

## Components and Interfaces

### Modified MeterForm Component

**Location**: `responsive-web-app/src/components/meters/MeterForm.tsx`

**Changes**:
- Import `useDevice` hook from device store
- Replace brand dropdown and model input with device dropdown
- Add device_id to form state
- Update validation logic
- Handle device loading and error states
- Add link to device management page

**New Props**: None (existing props remain unchanged)

**New State**:
```typescript
const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
  meter?.device_id
);
```

### Device Dropdown Component Structure

The device dropdown will be implemented inline within MeterForm using a standard HTML select element with the following structure:

```typescript
<select
  id="device"
  value={selectedDeviceId || ''}
  onChange={handleDeviceChange}
  className={errors.device ? 'form-control form-control--error' : 'form-control'}
  disabled={devices.loading}
>
  <option value="">Select Device</option>
  {devices.items.map(device => (
    <option key={device.id} value={device.id}>
      {device.manufacturer} - {device.model_number}
    </option>
  ))}
</select>
```

**Note**: The device model uses `manufacturer` instead of `brand` to better reflect industry terminology.

### Integration with Device Store

**Hook Usage**:
```typescript
const devices = useDevice();

useEffect(() => {
  devices.fetchItems();
}, []);
```

**Store Methods Used**:
- `fetchItems()`: Load all devices on component mount
- `items`: Array of device records
- `loading`: Loading state for UI feedback
- `error`: Error state for error handling

## Data Models

### Updated CreateMeterRequest Interface

**Location**: `responsive-web-app/src/types/meter.ts`

**Current**:
```typescript
export interface CreateMeterRequest {
  meterId: string;
  device: string;  // Free text
  model: string;   // Free text
  ip: string;
  serialNumber: string;
  portNumber: number;
  slaveId?: number;
  location?: string;
  description?: string;
  type?: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  register_map?: RegisterMap | null;
}
```

**Updated**:
```typescript
export interface CreateMeterRequest {
  meterId: string;
  device: string;      // Populated from selected device
  model: string;       // Populated from selected device
  device_id: string;   // NEW: Reference to device record
  ip: string;
  serialNumber: string;
  portNumber: number;
  slaveId?: number;
  location?: string;
  description?: string;
  type?: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  register_map?: RegisterMap | null;
}
```

### Form State Structure

```typescript
interface MeterFormState extends CreateMeterRequest {
  selectedDeviceId?: string;  // Internal state for dropdown
}
```

## Error Handling

### Error Scenarios and Responses

1. **Device Load Failure**
   - **Trigger**: API call to fetch devices fails
   - **Response**: Display error message above form: "Unable to load devices. Please try again."
   - **Action**: Provide retry button, disable form submission

2. **No Devices Available**
   - **Trigger**: Device list is empty
   - **Response**: Display info message: "No devices available. Please create a device first."
   - **Action**: Show link to device management page, disable form submission

3. **Device Not Selected**
   - **Trigger**: User attempts to submit without selecting device
   - **Response**: Display validation error: "Device selection is required"
   - **Action**: Prevent form submission, highlight field

4. **Orphaned Device Reference**
   - **Trigger**: Editing meter with device_id that no longer exists
   - **Response**: Display warning: "The associated device is no longer available. Please select a new device."
   - **Action**: Clear device selection, require new selection

### Error Display Pattern

```typescript
{devices.error && (
  <div className="form-error-banner">
    <span className="error-icon">⚠️</span>
    <span>Unable to load devices. Please try again.</span>
    <button onClick={() => devices.fetchItems()}>Retry</button>
  </div>
)}

{!devices.loading && devices.items.length === 0 && (
  <div className="form-info-banner">
    <span className="info-icon">ℹ️</span>
    <span>No devices available. Please create a device first.</span>
    <a href="/devices" className="link">Go to Device Management</a>
  </div>
)}
```

## Testing Strategy

### Unit Tests

**Test File**: `responsive-web-app/src/components/meters/MeterForm.test.tsx`

**Test Cases**:
1. **Device Loading**
   - Verify devices are fetched on component mount
   - Verify loading indicator displays while fetching
   - Verify dropdown populates with device options after load

2. **Device Selection**
   - Verify selecting device updates form state
   - Verify brand and model fields populate correctly
   - Verify device_id is set in form data

3. **Validation**
   - Verify error displays when no device selected
   - Verify form submission blocked without device
   - Verify error clears when device selected

4. **Edit Mode**
   - Verify device pre-selected when editing meter
   - Verify warning displays for orphaned device reference
   - Verify user can change device selection

5. **Error Handling**
   - Verify error message displays on load failure
   - Verify empty state message when no devices
   - Verify retry functionality works

### Integration Tests

**Test Scenarios**:
1. Create new meter with device selection
2. Edit existing meter and change device
3. Handle device load failure gracefully
4. Navigate to device management from form

### Manual Testing Checklist

- [ ] Create new meter with device selection
- [ ] Edit meter and verify device pre-selected
- [ ] Change device on existing meter
- [ ] Submit form without device selection (should fail)
- [ ] Test with empty device list
- [ ] Test with device load error
- [ ] Verify device link navigates correctly
- [ ] Test backward compatibility with meters without device_id
- [ ] Verify form styling matches existing design
- [ ] Test on mobile viewport

## Implementation Notes

### Backward Compatibility

Existing meters may have `device` and `model` fields populated but no `device_id`. The form should:
1. Display these values as read-only or in a separate section
2. Require device selection for updates
3. Migrate data by matching brand/model to existing devices where possible

### Performance Considerations

- Device list is cached in store with 10-minute TTL
- Devices fetched once on mount, not on every render
- Dropdown uses native select for optimal performance
- Consider implementing search/filter for large device lists (future enhancement)

### Accessibility

- Device dropdown has proper label association
- Error messages linked to form field via aria-describedby
- Loading state announced to screen readers
- Keyboard navigation fully supported

### UI/UX Considerations

- Device dropdown positioned where brand/model fields currently exist
- Maintains consistent spacing and styling
- Loading spinner inline with dropdown
- Error messages follow existing form error pattern
- Link to device management uses existing link styling
- Required field indicator (*) displayed

## Migration Path

### Phase 1: Add device_id support (this implementation)
- Add device dropdown to form
- Make device_id optional in backend
- Support both old (brand/model) and new (device_id) approaches

### Phase 2: Data migration (future)
- Script to match existing meters to devices
- Populate device_id for existing records
- Handle unmatched records

### Phase 3: Deprecation (future)
- Make device_id required
- Remove brand/model text fields
- Update API validation

## Design Decisions and Rationales

### Decision 1: Single Dropdown vs Cascading Dropdowns
**Choice**: Single dropdown with "Brand - Model" format
**Rationale**: Simpler UX, fewer clicks, devices are unique combinations of brand and model

### Decision 2: Inline Implementation vs Separate Component
**Choice**: Inline implementation within MeterForm
**Rationale**: Single use case, avoids over-engineering, easier to maintain form state

### Decision 3: Required vs Optional device_id
**Choice**: Required for new meters, optional for backward compatibility
**Rationale**: Ensures data quality going forward while supporting existing records

### Decision 4: Device Store Integration
**Choice**: Use existing useDevice hook and device store
**Rationale**: Leverages existing infrastructure, consistent with app architecture, benefits from caching

### Decision 5: Error Handling Approach
**Choice**: Graceful degradation with clear user guidance
**Rationale**: Prevents user frustration, provides actionable next steps, maintains form usability
