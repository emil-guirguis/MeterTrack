# Requirements Document: Sync Batch Upload Transaction Abort Error

## Introduction

The sync batch upload endpoint is failing with PostgreSQL error code 25P02 "current transaction is aborted, commands ignored until end of transaction block". This occurs when inserting meter readings in a transaction. The first INSERT fails (likely due to a constraint violation or missing meter), and then subsequent queries fail because PostgreSQL has marked the transaction as aborted.

## Glossary

- **Transaction**: A database operation that groups multiple queries together
- **Aborted Transaction**: A transaction that has failed and cannot execute more queries
- **Savepoint**: A point within a transaction that can be rolled back to without rolling back the entire transaction
- **Constraint Violation**: When data violates a database constraint (e.g., foreign key, unique constraint)
- **Batch Upload**: Uploading multiple meter readings in a single request
- **Meter Reading**: A single data point collected from a meter at a specific timestamp

## Requirements

### Requirement 1: Handle Individual Insert Failures Without Aborting Transaction

**User Story:** As the sync system, I want to handle individual meter reading insert failures gracefully, so that one failed insert doesn't prevent other readings from being inserted.

#### Acceptance Criteria

1. WHEN a meter reading insert fails due to constraint violation, THE Sync_Service SHALL catch the error and continue with the next reading
2. WHEN a meter reading insert fails, THE Sync_Service SHALL NOT abort the entire transaction
3. WHEN a meter reading insert fails, THE Sync_Service SHALL log the error with details
4. WHEN a meter reading insert fails, THE Sync_Service SHALL include the error in the response
5. WHEN multiple readings are inserted, THE Sync_Service SHALL insert all valid readings even if some fail

_Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

### Requirement 2: Use Savepoints for Individual Queries

**User Story:** As the sync system, I want to use database savepoints, so that individual query failures don't abort the entire transaction.

#### Acceptance Criteria

1. WHEN inserting a meter reading, THE Sync_Service SHALL create a savepoint before the insert
2. WHEN an insert fails, THE Sync_Service SHALL rollback to the savepoint (not the entire transaction)
3. WHEN a savepoint rollback occurs, THE Sync_Service SHALL continue with the next reading
4. WHEN all readings are processed, THE Sync_Service SHALL commit the transaction
5. WHEN the transaction commits, THE Sync_Service SHALL return success with counts of inserted and skipped readings

_Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### Requirement 3: Validate Meter Exists Before Insert

**User Story:** As the sync system, I want to validate that the meter exists before attempting to insert a reading, so that I can avoid constraint violations.

#### Acceptance Criteria

1. WHEN a meter reading is received, THE Sync_Service SHALL check if the meter exists in the database
2. WHEN the meter does not exist, THE Sync_Service SHALL skip the reading and log a warning
3. WHEN the meter exists, THE Sync_Service SHALL proceed with the insert
4. WHEN a meter is missing, THE Sync_Service SHALL include it in the skipped readings list
5. WHEN a meter is missing, THE Sync_Service SHALL NOT attempt to insert the reading

_Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

### Requirement 4: Provide Detailed Error Information

**User Story:** As a developer, I want detailed error information for failed inserts, so that I can diagnose issues.

#### Acceptance Criteria

1. WHEN an insert fails, THE Sync_Service SHALL log the error code and message
2. WHEN an insert fails, THE Sync_Service SHALL log the meter_id and data_point
3. WHEN an insert fails, THE Sync_Service SHALL log the constraint that was violated (if applicable)
4. WHEN an insert fails, THE Sync_Service SHALL include the error in the response
5. WHEN the batch completes, THE Sync_Service SHALL return a summary of inserted, skipped, and error counts

_Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

### Requirement 5: Batch Upload Response Format

**User Story:** As the sync system, I want a consistent response format for batch uploads, so that the client can process the results correctly.

#### Acceptance Criteria

1. WHEN a batch upload succeeds, THE Sync_Service SHALL return success=true
2. WHEN a batch upload completes, THE Sync_Service SHALL return the count of inserted readings
3. WHEN a batch upload completes, THE Sync_Service SHALL return the count of skipped readings
4. WHEN a batch upload has errors, THE Sync_Service SHALL return an errors array with details
5. WHEN a batch upload completes, THE Sync_Service SHALL return a message summarizing the results

_Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

