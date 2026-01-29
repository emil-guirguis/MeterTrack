# Meter Reading Duplication Analysis

## Problem Summary

All 6 meter elements are receiving **identical readings** instead of unique readings per element. Each element has ~9,600 readings with only ~410 unique values, and all elements share the same values.

## Root Cause

The issue is in the **BACnet collection architecture**:

1. **Single Device, Multiple Elements**: You have 1 physical meter (meter_id=1) with 6 logical elements (meter_element_id: 2, 3, 4, 7, 8, 9)

2. **Shared Register Configuration**: The `device_register` table only links registers to devices, not to meter elements. This means all 6 elements read from the **same BACnet registers** on the same device.

3. **Identical Values Stored**: When the sync MCP collects readings:
   - It reads from device 1's configured registers (e.g., register 1100 = 15.6338 kWh)
   - It stores this value for ALL 6 meter elements
   - Result: All elements get identical readings

## Current Data Structure

```
Device 1 (IP: xxx.xxx.xxx.xxx)
├── Register 1100 (kWh) → 15.6338
├── Register 1101 (kVAh) → 15.6338
└── ... (other registers)

Meter 1
├── Element 2 (ac) → reads all Device 1 registers
├── Element 3 (floor1) → reads all Device 1 registers
├── Element 4 (main) → reads all Device 1 registers
├── Element 7 (gggggg) → reads all Device 1 registers
├── Element 8 (office) → reads all Device 1 registers
└── Element 9 (element b) → reads all Device 1 registers
```

## Expected Behavior

Based on your spreadsheet showing only Element A connected:

```
Device 1 (IP: xxx.xxx.xxx.xxx)
├── Register 1100 (Element A) → 11.11 kWh
├── Register 1101 (Element B) → 0.00 kWh (not connected)
├── Register 1102 (Element C) → 0.00 kWh (not connected)
└── ... (different registers per element)

OR

Device 1 (IP: xxx.xxx.xxx.xxx)
├── Register 1100 (kWh) → 11.11 (Element A only)
├── Register 2100 (kWh) → 0.00 (Element B - not connected)
├── Register 3100 (kWh) → 0.00 (Element C - not connected)
└── ... (different registers per element)
```

## Solution Options

### Option 1: Per-Element Register Configuration (Recommended)
Extend the `device_register` table to include `meter_element_id`:

```sql
ALTER TABLE device_register ADD COLUMN meter_element_id BIGINT;
ALTER TABLE device_register ADD FOREIGN KEY (meter_element_id) REFERENCES meter_element(meter_element_id);
```

Then configure different registers for each element:
- Element 2 (ac): reads registers 1100, 1101, ...
- Element 3 (floor1): reads registers 2100, 2101, ...
- Element 4 (main): reads registers 3100, 3101, ...
- etc.

### Option 2: Single Element Per Meter
If each meter should only have one element, consolidate to 1 meter per element instead of 6 elements per meter.

### Option 3: Disable Unused Elements
Mark elements 3-9 as inactive so they don't get readings collected.

## Current Data Statistics

- **Total Readings**: 57,746
- **Unique Values**: 413
- **Readings per Element**: ~9,600 each
- **Unique Values per Element**: ~410 each
- **Min Value**: 0.0000 (Element 4 only)
- **Max Value**: 15.6338 (all elements)
- **Average Value**: 14.21 (all elements)

## Verification

All elements have identical timestamps and values:
```
Element 2: apparent_energy=15.6338, active_energy=11.1035, created_at=2026-01-28 07:45:00
Element 3: apparent_energy=15.6338, active_energy=11.1035, created_at=2026-01-28 07:45:00
Element 4: apparent_energy=15.6338, active_energy=11.1035, created_at=2026-01-28 07:45:00
Element 7: apparent_energy=15.6338, active_energy=11.1035, created_at=2026-01-28 07:45:00
Element 8: apparent_energy=15.6338, active_energy=11.1035, created_at=2026-01-28 07:45:00
Element 9: apparent_energy=15.6338, active_energy=11.1035, created_at=2026-01-28 07:45:00
```

## Next Steps

1. Clarify the intended architecture: Should each element read from different BACnet registers?
2. If yes, implement Option 1 (per-element register configuration)
3. If no, consolidate to a single element per meter
4. Clear existing duplicate readings and reconfigure collection
