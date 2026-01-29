# Meter Element Reading Duplication - Tasks

## Implementation Tasks

- [x] 1. Fix `getMeters()` query to join meter and meter_element tables
  - [x] 1.1 Update SQL query in `SyncDatabase.getMeters()`
  - [x] 1.2 Verify TypeScript compilation
  - [x] 1.3 Test query returns correct rows

- [ ] 2. Verify collection cycle processes each element independently
  - [ ] 2.1 Run collection cycle with fixed query
  - [ ] 2.2 Verify meter cache loads 6 entries
  - [ ] 2.3 Verify collection processes 6 separate meters

- [ ] 3. Verify readings are unique per element
  - [ ] 3.1 Check meter_reading table for unique values
  - [ ] 3.2 Verify no duplicate readings across elements
  - [ ] 3.3 Verify each element has different meter_element_id

- [ ] 4. Clear duplicate data and recollect
  - [ ] 4.1 Backup existing meter_reading data
  - [ ] 4.2 Delete duplicate readings from database
  - [ ] 4.3 Trigger new collection cycle
  - [ ] 4.4 Verify new readings are unique per element

- [ ] 5. Update documentation
  - [ ] 5.1 Document the fix in IMPLEMENTATION_SUMMARY.md
  - [ ] 5.2 Update any relevant API documentation
  - [ ] 5.3 Add notes about meter-element relationship

## Verification Checklist

- [ ] `getMeters()` returns 6 rows (one per element)
- [ ] Each row has unique meter_element_id (2, 3, 4, 7, 8, 9)
- [ ] All rows have same meter_id (1) and device_id (2)
- [ ] All rows have same ip (10.10.10.22) and port (47808)
- [ ] Collection cycle processes all 6 elements
- [ ] Meter readings have unique values per element
- [ ] No duplicate readings across elements
- [ ] All elements have readings (even if offline)
