# Implementation Plan: site_id to tenant_id Migration

## Overview

This implementation plan converts all `site_id` references to `tenant_id` and `sites` table references to `tenant` table throughout the MCP client codebase. The changes are applied systematically across service files, tool files, tool definitions, and test files.

## Tasks

- [ ] 1. Update Report Executor Service queries
  - [ ] 1.1 Update meter readings report query
    - Replace `sites s` with `tenant t`
    - Replace `m.site_id = s.id` with `m.tenant_id = t.tenant_id`
    - Replace `s.id as site_id` with `t.tenant_id as tenant_id`
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 1.2 Update usage summary report query
    - Replace `FROM sites s` with `FROM tenant t`
    - Replace `s.id = m.site_id` with `t.tenant_id = m.tenant_id`
    - Replace `s.id as site_id` with `t.tenant_id as tenant_id`
    - Update GROUP BY clause
    - _Requirements: 1.4, 1.5, 1.6_

- [ ] 2. Update Query Readings Tool
  - [ ] 2.1 Update ReadingRow interface
    - Replace `site_id: number` with `tenant_id: number`
    - Replace `site_name: string` with `tenant_name: string`
    - _Requirements: 2.4_
  
  - [ ] 2.2 Update query readings SQL query
    - Replace `INNER JOIN sites s ON m.site_id = s.id` with `INNER JOIN tenant t ON m.tenant_id = t.tenant_id`
    - Replace `s.id as site_id` with `t.tenant_id as tenant_id`
    - Replace `s.name as site_name` with `t.name as tenant_name`
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 2.3 Update result mapping in query readings
    - Replace `site: { id: row.site_id, name: row.site_name }` with `tenant: { id: row.tenant_id, name: row.tenant_name }`
    - _Requirements: 2.5_

- [ ] 3. Update Query Meters Tool
  - [ ] 3.1 Update MeterRow interface
    - Replace `site_id: number` with `tenant_id: number`
    - Replace `site_name: string` with `tenant_name: string`
    - Replace `site_is_active: boolean` with `tenant_is_active: boolean`
    - _Requirements: 3.3_
  
  - [ ] 3.2 Update query meters SQL query
    - Replace `INNER JOIN sites s ON m.site_id = s.id` with `INNER JOIN tenant t ON m.tenant_id = t.tenant_id`
    - Replace `s.id as site_id` with `t.tenant_id as tenant_id`
    - Replace `s.name as site_name` with `t.name as tenant_name`
    - Replace `s.is_active as site_is_active` with `t.is_active as tenant_is_active`
    - _Requirements: 3.1, 3.2_
  
  - [ ] 3.3 Update result mapping in query meters
    - Replace `site: { id: row.site_id, ... }` with `tenant: { id: row.tenant_id, ... }`
    - _Requirements: 3.4_

- [ ] 4. Update Get Site Status Tool
  - [ ] 4.1 Update GetSiteStatusArgs interface
    - Replace `site_id?: number` with `tenant_id?: number`
    - _Requirements: 4.1_
  
  - [ ] 4.2 Update get site status SQL query
    - Replace filter condition `s.id = $` with `s.tenant_id = $`
    - Verify table is `tenant` (already correct)
    - _Requirements: 4.2_
  
  - [ ] 4.3 Update SiteRow interface
    - Replace `id: number` with `tenant_id: number`
    - _Requirements: 4.3_
  
  - [ ] 4.4 Update result mapping in get site status
    - Replace `id: row.id` with `tenant_id: row.tenant_id`
    - _Requirements: 4.4_

- [ ] 5. Update Generate Report Tool
  - [ ] 5.1 Update GenerateReportArgs interface
    - Replace `site_ids?: number[]` with `tenant_ids?: number[]`
    - _Requirements: 5.1_
  
  - [ ] 5.2 Update SummaryRow interface
    - Replace `site_id: number` with `tenant_id: number`
    - Replace `site_name: string` with `tenant_name: string`
    - _Requirements: 5.8_
  
  - [ ] 5.3 Update DetailedRow interface
    - Replace `site_id: number` with `tenant_id: number`
    - Replace `site_name: string` with `tenant_name: string`
    - _Requirements: 5.8_
  
  - [ ] 5.4 Update summary report query
    - Replace `FROM tenant s` with `FROM tenant t`
    - Replace `m.site_id = s.id` with `m.tenant_id = t.tenant_id`
    - Replace `s.id as site_id` with `t.tenant_id as tenant_id`
    - Replace `s.id = ANY($)` with `t.tenant_id = ANY($)`
    - _Requirements: 5.1, 5.2_
  
  - [ ] 5.5 Update detailed report query
    - Replace `FROM sites s` with `FROM tenant t`
    - Replace `s.id = m.site_id` with `t.tenant_id = m.tenant_id`
    - Replace `s.id as site_id` with `t.tenant_id as tenant_id`
    - Replace `s.id = ANY($)` with `t.tenant_id = ANY($)`
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [ ] 5.6 Update comparison report query
    - Replace `FROM tenant s` with `FROM tenant t`
    - Replace `m.site_id = s.id` with `m.tenant_id = t.tenant_id`
    - Replace `s.id as site_id` with `t.tenant_id as tenant_id`
    - Replace `s.id = ANY($)` with `t.tenant_id = ANY($)`
    - _Requirements: 5.6, 5.7_
  
  - [ ] 5.7 Update result mapping in generate report
    - Replace all `site_id: row.site_id` with `tenant_id: row.tenant_id`
    - Replace all `site_name: row.site_name` with `tenant_name: row.tenant_name`
    - _Requirements: 5.9_

- [ ] 6. Update MCP Tool Definitions
  - [ ] 6.1 Update query_meters tool definition
    - Replace `site_id` parameter with `tenant_id`
    - Update description to reference `tenant_id`
    - _Requirements: 6.1_
  
  - [ ] 6.2 Update query_readings tool definition
    - Replace `site_id` parameter with `tenant_id`
    - Update description to reference `tenant_id`
    - _Requirements: 6.2_
  
  - [ ] 6.3 Update get_site_status tool definition
    - Replace `site_id` parameter with `tenant_id`
    - Update description to reference `tenant_id`
    - _Requirements: 6.3_
  
  - [ ] 6.4 Update generate_report tool definition
    - Replace `site_ids` parameter with `tenant_ids`
    - Update description to reference `tenant_ids`
    - _Requirements: 6.4_

- [ ] 7. Update Test Data
  - [ ] 7.1 Update report executor test mock data
    - Replace `site_id: 1` with `tenant_id: 1`
    - Replace `site_name` with `tenant_name`
    - _Requirements: 7.1, 7.3_
  
  - [ ] 7.2 Update test assertions
    - Verify assertions reference correct field names
    - _Requirements: 7.2_

- [ ] 8. Checkpoint - Verify all changes
  - Ensure all files compile without errors
  - Verify no remaining references to `site_id` or `sites` table in updated files
  - Run existing tests to ensure functionality is preserved
  - Ask the user if questions arise

## Notes

- All changes are mechanical replacements of field and table names
- No functional changes to business logic
- Existing error handling and validation patterns are preserved
- All changes maintain backward compatibility at the query level (same data returned, different field names)
