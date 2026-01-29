# Dashboard Meter Element Loading/Saving - Requirements

## Overview
The meter element field in the dashboard card edit form is not loading or saving correctly. Users cannot select or persist meter elements when creating or editing dashboard cards.

## User Stories

### 1.1 Load Meter Elements When Editing Card
**As a** dashboard user  
**I want to** see the currently selected meter element populated in the form when editing a card  
**So that** I can verify what meter element is being tracked

**Acceptance Criteria:**
- When opening edit form for existing card, the meter element dropdown shows the currently selected element
- The selected element is highlighted/selected in the dropdown
- The element name and identifier are clearly visible

### 1.2 Select Meter Element When Creating Card
**As a** dashboard user  
**I want to** select a meter element from a dropdown after choosing a meter  
**So that** I can specify which meter element to track on the dashboard

**Acceptance Criteria:**
- After selecting a meter, the meter element dropdown becomes enabled
- Dropdown populates with all available elements for that meter
- I can select an element and it persists in the form
- Selected element displays correctly in the dropdown

### 1.3 Save Meter Element with Card
**As a** dashboard user  
**I want to** save the selected meter element when creating or updating a dashboard card  
**So that** the dashboard card displays data for the correct meter element

**Acceptance Criteria:**
- When submitting the form, the selected meter_element_id is sent to the backend
- The backend correctly saves the meter_element_id to the dashboard_cards table
- No validation errors occur due to meter element selection
- Saved card persists the meter element selection

## Technical Requirements

### 2.1 API Response Format Consistency
- The `GET /api/dashboard/meters/:meterId/elements` endpoint must return a consistent response format
- Response must include: `id` (or `meter_element_id`), `element`, `name`, `meter_id`
- Frontend expects field name `id` for the meter element identifier
- No duplicate endpoint definitions

### 2.2 Form Data Type Consistency
- `meter_element_id` must be consistently typed as a number throughout the form lifecycle
- Form initialization must not convert numeric IDs to strings
- Select component value binding must use consistent types
- Validation logic must handle the correct data types

### 2.3 Backend Validation
- Dashboard card validation must correctly validate meter_element_id against available elements
- Validation must check that selected element belongs to the selected meter
- Validation must check that element belongs to user's tenant

## Acceptance Criteria Summary

- [ ] Duplicate API endpoint removed
- [ ] API response format standardized with `id` field
- [ ] Form initialization preserves numeric type for meter_element_id
- [ ] Meter element dropdown correctly displays selected value when editing
- [ ] Meter element can be selected and saved when creating new card
- [ ] Saved meter element persists and loads correctly on subsequent edits
- [ ] No console errors or type warnings related to meter element field
