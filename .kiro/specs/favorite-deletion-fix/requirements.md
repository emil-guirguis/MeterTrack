# Requirements Document: Favorite Deletion Fix

## Introduction

This feature fixes a critical bug where users cannot unfavorite items because the frontend passes an invalid favorite_id (0) to the backend. The fix requires adding favorite_id to API responses and using it when deleting favorites.

## Glossary

- **favorite_id**: The unique identifier for a favorite record in the database
- **tenant_id**: The unique identifier for the user's tenant/organization

## Requirements

### Requirement 1: Add favorite_id to Favorites Query Response

**User Story:** As a frontend developer, I want the `/api/favorites/meters` endpoint to return the favorite_id, so I can use it when deleting.

#### Acceptance Criteria

1. WHEN the `/api/favorites/meters` endpoint is called, THE Backend SHALL include favorite_id in each item in the response
2. WHEN the response is serialized, THE favorite_id SHALL be a valid, non-zero integer

### Requirement 2: Add favorite_id to Meters Query Response

**User Story:** As a frontend developer, I want the `/api/meters` endpoint to return the favorite_id for favorited items, so I can use it when deleting.

#### Acceptance Criteria

1. WHEN the `/api/meters` endpoint returns a favorited meter, THE Backend SHALL include favorite_id in the response
2. WHEN a meter_element is returned with favorite status, THE Backend SHALL include favorite_id in the response
3. WHEN the response is serialized, THE favorite_id SHALL be a valid, non-zero integer

### Requirement 3: Frontend Stores and Uses favorite_id for Deletion

**User Story:** As a frontend developer, I want to store the favorite_id from the API and pass it when deleting, so the backend can identify the correct record to delete.

#### Acceptance Criteria

1. WHEN a favorited item is received from the API, THE Frontend SHALL store the favorite_id
2. WHEN a user clicks to unfavorite an item, THE Frontend SHALL pass the favorite_id to the DELETE endpoint
3. WHEN the DELETE request is sent, THE Frontend SHALL pass favoriteId and tenant_id as query parameters
