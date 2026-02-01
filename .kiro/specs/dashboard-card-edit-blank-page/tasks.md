# Dashboard Card Edit Blank Page - Implementation Tasks

## Task List

### 1. Fix Frontend Type Definition
- [ ] 1.1 Update `getMeterElementsByMeter()` return type in dashboardService.ts
- [ ] 1.2 Change `id` to `meter_element_id` in type definition
- [ ] 1.3 Verify type matches backend response structure

### 2. Fix Modal Component - Meter Element Rendering
- [ ] 2.1 Update line 361 in DashboardCardModal.tsx to use `meter_element_id`
- [ ] 2.2 Update MenuItem key to use `element.meter_element_id`
- [ ] 2.3 Update MenuItem value to use `element.meter_element_id.toString()`
- [ ] 2.4 Verify form data initialization uses correct field

### 3. Write Unit Tests
- [ ] 3.1 Test meter element rendering with correct ID mapping
- [ ] 3.2 Test form submission with meter element data
- [ ] 3.3 Test error handling for missing meter_element_id

### 4. Write Property-Based Tests
- [ ] 4.1 Property: Modal opens without TypeError for any card
- [ ] 4.2 Property: Meter elements display correctly for any meter
- [ ] 4.3 Property: Form works for any sequence of card edits

### 5. Integration Testing
- [ ] 5.1 Test full edit flow end-to-end
- [ ] 5.2 Test editing multiple cards in sequence
- [ ] 5.3 Test error scenarios
- [ ] 5.4 Verify no regressions in other dashboard functionality

### 6. Code Review and Cleanup
- [ ] 6.1 Review all changes for code quality
- [ ] 6.2 Remove any debugging code
- [ ] 6.3 Update comments and documentation
- [ ] 6.4 Verify performance impact

## Task Dependencies
- Task 1 must be completed before Task 2
- Tasks 1-2 must be completed before Task 3
- Tasks 3-4 can be done in parallel
- Task 5 depends on Tasks 1-4
- Task 6 is final review

## Estimated Effort
- Task 1: 0.5 hours
- Task 2: 0.5 hours
- Task 3: 1 hour
- Task 4: 1.5 hours
- Task 5: 1 hour
- Task 6: 0.5 hours

**Total: ~5 hours**
