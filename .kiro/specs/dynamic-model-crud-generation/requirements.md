# Requirements Document

## Introduction

This feature extends the backend API framework to automatically generate CRUD operations (INSERT, UPDATE, SELECT, DELETE SQL statements) for models based solely on their field definitions. Client models will only define their structure through a constructor, while the framework dynamically generates all database operations, eliminating repetitive boilerplate code.

## Glossary

- **Model**: A class representing a database table with field definitions in its constructor
- **CRUD Operations**: Create, Read, Update, Delete database operations
- **Framework**: The shared backend framework located in `framework/backend/`
- **Client Model**: A model class in `client/backend/src/models/` that extends framework functionality
- **BaseModel**: The framework class that provides dynamic CRUD generation
- **Field Definition**: The property assignments in a model's constructor that define the model's structure
- **SQL Statement**: Database query commands (INSERT, UPDATE, SELECT, DELETE)
- **Dynamic Generation**: Runtime creation of methods and queries based on model structure

## Requirements

### Requirement 1

**User Story:** As a backend developer, I want to define only the model structure in the constructor, so that I don't have to write repetitive CRUD methods for each model

#### Acceptance Criteria

1. WHEN a developer creates a new model class, THE BaseModel SHALL extract field definitions from the constructor
2. THE BaseModel SHALL generate a create() method that builds INSERT statements dynamically based on extracted fields
3. THE BaseModel SHALL generate a findById() method that builds SELECT statements with WHERE clauses
4. THE BaseModel SHALL generate a findAll() method that builds SELECT statements with optional filtering
5. THE BaseModel SHALL generate an update() method that builds UPDATE statements dynamically based on provided fields

### Requirement 2

**User Story:** As a backend developer, I want the framework to automatically handle field mapping between JavaScript and SQL, so that I can focus on business logic instead of query construction

#### Acceptance Criteria

1. WHEN a model instance is created, THE BaseModel SHALL map JavaScript property names to database column names
2. THE BaseModel SHALL handle data type conversions between JavaScript and PostgreSQL types
3. THE BaseModel SHALL automatically include timestamp fields (created_at, updated_at) in generated queries
4. THE BaseModel SHALL sanitize field values to prevent SQL injection
5. WHERE a field contains JSONB data, THE BaseModel SHALL properly serialize and deserialize the data

### Requirement 3

**User Story:** As a backend developer, I want to specify table names and primary keys declaratively, so that the framework knows which table and identifier to use for queries

#### Acceptance Criteria

1. THE BaseModel SHALL require a static tableName property on each model class
2. THE BaseModel SHALL require a static primaryKey property on each model class
3. WHEN generating queries, THE BaseModel SHALL use the specified tableName in FROM and UPDATE clauses
4. WHEN generating queries, THE BaseModel SHALL use the specified primaryKey in WHERE clauses for single-record operations
5. WHERE tableName or primaryKey is not defined, THE BaseModel SHALL throw a descriptive configuration error

### Requirement 4

**User Story:** As a backend developer, I want to optionally define custom methods on my models, so that I can add business-specific logic while still benefiting from generated CRUD operations

#### Acceptance Criteria

1. THE BaseModel SHALL allow model classes to define custom static methods
2. THE BaseModel SHALL allow model classes to define custom instance methods
3. WHEN a custom method is defined, THE BaseModel SHALL not override it with generated methods
4. THE BaseModel SHALL provide access to the database connection for custom queries
5. THE BaseModel SHALL provide helper methods for building complex WHERE clauses in custom methods

### Requirement 5

**User Story:** As a backend developer, I want the framework to handle common query patterns like filtering and pagination, so that I don't have to implement these repeatedly

#### Acceptance Criteria

1. WHEN findAll() is called with filter parameters, THE BaseModel SHALL build WHERE clauses dynamically
2. WHEN findAll() is called with pagination parameters, THE BaseModel SHALL add LIMIT and OFFSET clauses
3. WHEN findAll() is called with sort parameters, THE BaseModel SHALL add ORDER BY clauses
4. THE BaseModel SHALL support common filter operators (equals, like, greater than, less than, in)
5. THE BaseModel SHALL return paginated results with metadata (total count, page number, page size)

### Requirement 6

**User Story:** As a backend developer, I want the framework to handle relationships between models, so that I can easily query related data

#### Acceptance Criteria

1. WHERE a model has foreign key fields, THE BaseModel SHALL support JOIN operations in findAll() and findById()
2. THE BaseModel SHALL allow specification of related models through a static relationships property
3. WHEN querying with includes, THE BaseModel SHALL automatically generate LEFT JOIN clauses
4. THE BaseModel SHALL map joined data to nested objects in the result
5. THE BaseModel SHALL support multiple levels of relationship includes

### Requirement 7

**User Story:** As a backend developer, I want comprehensive error handling for database operations, so that I can provide meaningful feedback to API consumers

#### Acceptance Criteria

1. WHEN a unique constraint is violated, THE BaseModel SHALL throw a specific error with the constraint name
2. WHEN a foreign key constraint is violated, THE BaseModel SHALL throw a specific error with the related table
3. WHEN a required field is missing, THE BaseModel SHALL throw a validation error before executing the query
4. WHEN a database connection fails, THE BaseModel SHALL throw a connection error with retry information
5. THE BaseModel SHALL log all database errors with query context for debugging
