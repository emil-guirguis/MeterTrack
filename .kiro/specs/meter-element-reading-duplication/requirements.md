# Meter Element Reading Duplication - Requirements

## Problem Statement

When collecting meter readings, all 6 meter elements were receiving **identical readings** instead of unique readings per element. Each element had ~9,600 readings with only ~410 unique values, and all elements shared the same values.

## Root Cause

The sync MCP's `getMeters()` function was querying only the `meter` table, which doesn't have `meter_element_id` column. The relationship between meters and their elements is in a separate `meter_element` table. This caused the collection cycle to not properly iterate through each meter element separately.

## Requirements

### 1. Correct Meter-Element Relationship
- The sync MCP must query both `meter` and `meter_element` tables
- Each meter element should be treated as a separate entity during collection
- The collection cycle should iterate through each meter-element combination independently

### 2. Independent Reading Collection
- Each meter element should have its own collection cycle
- All registers should be read for each element
- Readings should be stored with the correct `meter_element_id`

### 3. Data Integrity
- Each element should have unique readings (not duplicates)
- Readings should reflect the actual state of each element
- Offline/disconnected elements should still be read (returning zero or null values)

## Acceptance Criteria

1. **AC1**: The `getMeters()` function returns one row per meter-element combination
   - For meter_id=1 with 6 elements, should return 6 rows
   - Each row includes meter_id, meter_element_id, device_id, ip, port, etc.

2. **AC2**: Collection cycle processes each meter element independently
   - Each element gets its own reading collection attempt
   - Readings are stored with correct meter_element_id

3. **AC3**: Readings are unique per element
   - Element A readings differ from Element B readings
   - No duplicate readings across elements
   - Each element has different values (or zeros if offline)

4. **AC4**: All elements are read regardless of connection status
   - Connected elements return actual values
   - Disconnected elements return zero or null values
   - No elements are skipped

## Implementation Notes

- The fix involves updating the SQL query in `SyncDatabase.getMeters()` to join `meter` and `meter_element` tables
- The collection cycle already handles multiple meters correctly, so no changes needed there
- The meter cache will now load 6 separate meter objects (one per element) instead of 1
