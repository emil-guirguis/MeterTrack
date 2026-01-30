# Requirements: Register Display Names

## Overview

Currently, meter reading columns and dashboard displays use database field names (e.g., `active_energy`, `power_phase_a`) instead of human-readable register value names (e.g., "Active Energy", "Power Phase A"). This spec addresses the need to display register value names throughout the UI for better user experience.

## User Stories

### 1. Display Register Names in Meter Reading Columns
**As a** user viewing meter readings  
**I want** column headers to show register value names instead of field names  
**So that** I can easily understand what each column represents

**Acceptance Criteria:**
- 1.1 Meter reading list columns display register names as headers
- 1.2 Register names are fetched from the register table
- 1.3 Field names are mapped to register names via the register entity
- 1.4 If a register name is not found, fall back to a formatted field name
- 1.5 Column sorting and filtering work correctly with register names

### 2. Display Register Names in Dashboard Cards
**As a** user viewing dashboard cards  
**I want** dashboard metric labels to show register value names  
**So that** I can understand what metrics are being displayed

**Acceptance Criteria:**
- 2.1 Dashboard cards display register names for their metrics
- 2.2 Register names are fetched from the register table
- 2.3 Field names are mapped to register names via the register entity
- 2.4 If a register name is not found, fall back to a formatted field name
- 2.5 Dashboard cards render correctly with register names

### 3. Create Register Name Mapping Service
**As a** developer  
**I want** a centralized service to map field names to register names  
**So that** the logic is reusable across components

**Acceptance Criteria:**
- 3.1 Service fetches all registers from the database
- 3.2 Service caches register mappings for performance
- 3.3 Service provides a function to get register name by field name
- 3.4 Service handles missing registers gracefully
- 3.5 Service is used by both meter reading and dashboard components

### 4. Update Meter Reading Configuration
**As a** developer  
**I want** meter reading columns to use register names  
**So that** the UI displays meaningful column headers

**Acceptance Criteria:**
- 4.1 Meter reading columns are updated to use register names
- 4.2 Column labels are dynamically generated from register names
- 4.3 Export headers use register names
- 4.4 Stats labels use register names
- 4.5 Backward compatibility is maintained for missing registers

### 5. Update Dashboard Components
**As a** developer  
**I want** dashboard cards to use register names  
**So that** metrics are clearly labeled

**Acceptance Criteria:**
- 5.1 Dashboard card labels use register names
- 5.2 Dashboard metric displays use register names
- 5.3 Dashboard filters use register names
- 5.4 Dashboard exports use register names
- 5.5 Backward compatibility is maintained for missing registers

## Requirements Summary

| Req ID | Description | Priority |
|--------|-------------|----------|
| 1.1 | Meter reading columns display register names | High |
| 1.2 | Register names fetched from database | High |
| 1.3 | Field names mapped to register names | High |
| 1.4 | Fallback to formatted field name if register not found | Medium |
| 1.5 | Column sorting/filtering work with register names | High |
| 2.1 | Dashboard cards display register names | High |
| 2.2 | Register names fetched from database | High |
| 2.3 | Field names mapped to register names | High |
| 2.4 | Fallback to formatted field name if register not found | Medium |
| 2.5 | Dashboard cards render correctly | High |
| 3.1 | Service fetches registers from database | High |
| 3.2 | Service caches register mappings | Medium |
| 3.3 | Service provides mapping function | High |
| 3.4 | Service handles missing registers | Medium |
| 3.5 | Service used by components | High |
| 4.1 | Meter reading columns updated | High |
| 4.2 | Column labels dynamically generated | High |
| 4.3 | Export headers use register names | High |
| 4.4 | Stats labels use register names | High |
| 4.5 | Backward compatibility maintained | Medium |
| 5.1 | Dashboard card labels use register names | High |
| 5.2 | Dashboard metric displays use register names | High |
| 5.3 | Dashboard filters use register names | High |
| 5.4 | Dashboard exports use register names | High |
| 5.5 | Backward compatibility maintained | Medium |

## Technical Context

### Current State
- Meter reading columns use field names from the database (e.g., `active_energy`, `power_phase_a`)
- Dashboard cards use field names for metric labels
- Register table contains both `field_name` and `name` (register value name)
- No centralized mapping service exists

### Desired State
- Meter reading columns display register names (e.g., "Active Energy", "Power Phase A")
- Dashboard cards display register names for metrics
- Centralized register mapping service handles field-to-name conversion
- Graceful fallback for missing registers

### Data Model
```
Register Table:
- register_id: number
- name: string (register value name - what we want to display)
- register: number
- unit: string
- field_name: string (database column name - what we currently use)
```

## Implementation Approach

1. Create a register mapping service that fetches and caches register data
2. Update meter reading configuration to use register names
3. Update dashboard components to use register names
4. Implement fallback logic for missing registers
5. Add tests to verify register name display

## Out of Scope

- Changing the database schema
- Modifying the register table structure
- Changing how meter readings are stored
- Modifying the sync process
