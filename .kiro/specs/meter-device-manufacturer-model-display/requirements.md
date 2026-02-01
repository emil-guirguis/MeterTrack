# Meter Device Manufacturer and Model Display - Requirements

## Overview
Device manufacturer and model information are not displaying in the meter list, even though these fields are defined in the schema and exist in the database. The issue is that the backend API doesn't include device information when fetching meters.

## User Stories

### 1. Display Device Manufacturer in Meter List
**As a** user viewing the meter list  
**I want to** see the device manufacturer for each meter  
**So that** I can quickly identify which manufacturer each meter is from

**Acceptance Criteria:**
- The meter list displays a "Manufacturer" column
- The manufacturer value comes from the related device record
- The column is sortable and filterable
- The data is correctly populated for all meters with associated devices

### 2. Display Device Model in Meter List
**As a** user viewing the meter list  
**I want to** see the device model number for each meter  
**So that** I can quickly identify the specific model of each meter

**Acceptance Criteria:**
- The meter list displays a "Model Number" column
- The model number value comes from the related device record
- The column is sortable and filterable
- The data is correctly populated for all meters with associated devices

## Technical Requirements

### Backend API Enhancement
- The `GET /api/meters` endpoint must JOIN the device table
- The response must include `manufacturer` and `model_number` from the device table
- The fields should be included for all meters that have an associated device
- Null values should be handled gracefully for meters without devices

### Frontend Display
- The meter list component should display the manufacturer and model columns
- These columns are already defined in the meter schema with `showOn: ['list']`
- Once the backend provides the data, the columns will automatically render

### Data Model
- The Meter type interface should include `manufacturer` and `model_number` fields
- These fields should be populated from the device relationship

## Current State
- Meter schema defines `device` and `model` fields with `showOn: ['list']`
- Backend API does not include device information in the response
- Frontend displays empty columns because no data is provided

## Expected Outcome
Users can see the device manufacturer and model for each meter in the list view, making it easier to identify and manage meters by their device specifications.
