# Requirements Document

## Introduction

This document outlines the requirements for implementing optimistic list updates in the framework's form submission flow. Currently, when a form is submitted (create or update), the system reloads the entire list from the API to reflect changes. This approach is inefficient and causes unnecessary network traffic. The framework should support optimistic updates where the saved entity is directly pushed or merged into the list state, eliminating the need for a full list reload while maintaining data consistency.

## Glossary

- **Optimistic Update**: A UI pattern where the client immediately updates the local state with the expected result of an operation before receiving server confirmation, improving perceived performance
- **Entity Store**: A state management hook (e.g., useContactsEnhanced, useLocationsEnhanced) that manages a collection of entities with CRUD operations
- **Form Store Integration**: The useEntityFormWithStore hook that connects entity forms to their corresponding stores for automatic CRUD operations
- **List Synchronization**: The process of keeping the displayed list in sync with the actual data state after form operations
- **Store Items Array**: The array of entities maintained in the store's state (e.g., contacts.items, locations.items)
- **Saved Entity**: The complete entity object returned by the API after a successful create or update operation

## Requirements

### Requirement 1: Optimistic Create Operations

**User Story:** As a user, I want newly created items to appear in the list immediately after form submission, so that I can see my changes without waiting for a full list reload.

#### Acceptance Criteria

1. WHEN a create operation succeeds, THE Entity Store SHALL add the saved entity to the items array without fetching from the API
2. WHEN the saved entity is added to the items array, THE Entity Store SHALL append it to the end of the array
3. WHEN the saved entity contains an ID from the server, THE Entity Store SHALL use that ID for the new item
4. WHEN the list has sorting applied, THE Entity Store SHALL insert the new item in the correct sorted position
5. WHEN the optimistic create completes, THE list component SHALL immediately re-render to display the new item with all its data visible in the list

### Requirement 2: Optimistic Update Operations

**User Story:** As a user, I want edited items to update in the list immediately after form submission, so that I can see my changes reflected without a full page reload.

#### Acceptance Criteria

1. WHEN an update operation succeeds, THE Entity Store SHALL replace the existing item in the items array with the saved entity
2. WHEN searching for the item to update, THE Entity Store SHALL match by the entity's ID property
3. WHEN the item is found, THE Entity Store SHALL preserve the item's position in the array
4. WHEN the item is not found in the array, THE Entity Store SHALL add it to the array as a fallback
5. WHEN the optimistic update completes, THE list component SHALL re-render to display the updated item

### Requirement 3: Store Method Integration

**User Story:** As a developer, I want the entity stores to provide methods for optimistic updates, so that forms can easily integrate this functionality.

#### Acceptance Criteria

1. THE Entity Store SHALL provide an addItemToList method that accepts an entity and adds it to the items array
2. THE Entity Store SHALL provide an updateItemInList method that accepts an entity and updates the matching item in the items array
3. WHEN addItemToList is called, THE method SHALL return the updated items array
4. WHEN updateItemInList is called, THE method SHALL return the updated items array
5. THE Entity Store SHALL expose these methods alongside existing CRUD methods (createItem, updateItem, fetchItems)

### Requirement 4: Form Hook Configuration

**User Story:** As a developer using useEntityFormWithStore, I want to configure whether to use optimistic updates or full reloads, so that I can choose the appropriate strategy for each form.

#### Acceptance Criteria

1. THE useEntityFormWithStore hook SHALL accept an updateStrategy parameter with values 'optimistic' or 'reload'
2. WHEN updateStrategy is 'optimistic', THE hook SHALL call store methods to update the list directly after save
3. WHEN updateStrategy is 'reload', THE hook SHALL call store.fetchItems to reload the entire list after save
4. WHEN updateStrategy is not specified, THE hook SHALL default to 'optimistic' for better performance
5. WHEN an optimistic update fails, THE hook SHALL fall back to calling fetchItems to ensure data consistency

### Requirement 5: Backward Compatibility

**User Story:** As a developer with existing forms, I want the new optimistic update feature to work with my current code, so that I don't need to refactor all my forms immediately.

#### Acceptance Criteria

1. WHEN an Entity Store does not implement addItemToList or updateItemInList methods, THE form hook SHALL fall back to calling fetchItems
2. WHEN the refreshAfterSave parameter is set to false, THE form hook SHALL not perform any list updates
3. WHEN using the legacy EntityManagementPage component, THE component SHALL continue to call fetchItems after save
4. THE framework SHALL maintain the existing refreshAfterSave parameter for backward compatibility
5. THE framework SHALL log a deprecation warning when refreshAfterSave is explicitly set to true with optimistic updates available

### Requirement 6: Error Handling and Consistency

**User Story:** As a user, I want the list to remain consistent even if optimistic updates fail, so that I always see accurate data.

#### Acceptance Criteria

1. WHEN an optimistic update method throws an error, THE form hook SHALL catch the error and call fetchItems as a fallback
2. WHEN the saved entity from the API is null or undefined, THE form hook SHALL call fetchItems instead of attempting an optimistic update
3. WHEN the saved entity is missing required properties, THE form hook SHALL log a warning and fall back to fetchItems
4. WHEN a network error occurs during save, THE form hook SHALL not perform any list updates
5. THE form hook SHALL ensure that list state remains consistent regardless of which update strategy is used

### Requirement 7: Performance Optimization

**User Story:** As a developer, I want optimistic updates to be more performant than full reloads, so that my application feels faster to users.

#### Acceptance Criteria

1. WHEN using optimistic updates, THE framework SHALL not make additional API calls to refresh the list
2. WHEN updating a single item, THE framework SHALL only update that specific item in the array without re-rendering other items
3. WHEN adding a new item, THE framework SHALL append to the array without recreating the entire array
4. THE optimistic update operations SHALL complete in less than 10ms for lists with up to 1000 items
5. THE framework SHALL use immutable update patterns to ensure proper React re-rendering

### Requirement 8: Store Implementation Pattern

**User Story:** As a developer creating new entity stores, I want a clear pattern for implementing optimistic update methods, so that all stores work consistently.

#### Acceptance Criteria

1. THE framework SHALL provide a base store implementation or utility functions for optimistic updates
2. WHEN implementing addItemToList, THE store SHALL use immutable array operations (e.g., spread operator, concat)
3. WHEN implementing updateItemInList, THE store SHALL use array.map or similar immutable operations
4. THE store implementation SHALL handle edge cases like duplicate IDs and missing items
5. THE framework documentation SHALL include examples of implementing optimistic update methods in custom stores
