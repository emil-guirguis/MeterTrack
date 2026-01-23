# Design Document: AI-Powered Meter Reading and Device Management

## Overview

This design implements AI capabilities for the meter reading and device management system through three integrated components: Natural Language Search, AI-Powered Dashboard Insights, and Natural Language Report Generation. The system uses semantic embeddings for intelligent search, statistical anomaly detection for insights, and LLM-based query parsing for natural language interfaces. All components are designed with multi-tenant isolation, performance optimization, and graceful degradation when AI services are unavailable.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/TypeScript)              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Search Interface │  │ Dashboard        │  │ Report Gen   │  │
│  │ (Header Bar)     │  │ (Insights Panel) │  │ (Form)       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
└───────────┼──────────────────────┼──────────────────┼───────────┘
            │                      │                  │
┌───────────┼──────────────────────┼──────────────────┼───────────┐
│           ▼                      ▼                  ▼           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         API Gateway / Express Routes                    │   │
│  │  /api/search  /api/insights  /api/reports              │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                         │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │         AI Service Layer                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Query Parser │  │ Embeddings   │  │ Anomaly      │  │   │
│  │  │ (LLM-based)  │  │ Service      │  │ Detector     │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                         │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │         Data Access Layer                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Device DAO   │  │ Meter DAO    │  │ Reading DAO  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                         │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │         Cache Layer (Redis)                            │   │
│  │  - Search results (5 min TTL)                          │   │
│  │  - Embeddings cache                                    │   │
│  │  - Insight cache (30 min TTL)                          │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                         │
│  ┌────────────────────▼────────────────────────────────────┐   │
│  │         Database (PostgreSQL)                          │   │
│  │  - Devices, Meters, Readings                           │   │
│  │  - Generated Reports (30 day retention)                │   │
│  │  - Embeddings Index                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         External Services                              │   │
│  │  - OpenAI API (query parsing, report generation)       │   │
│  │  - Embedding Service (semantic search)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend Components**:
- Search interface in header bar with autocomplete
- Dashboard insights panel with anomalies and trends
- Report generation form with natural language input
- Result display with device details and recommendations

**API Routes**:
- `POST /api/ai/search` - Natural language device/meter search
- `GET /api/ai/insights` - Dashboard insights generation
- `POST /api/ai/reports` - Report generation request
- `GET /api/ai/reports/:id` - Report retrieval
- `GET /api/ai/reports/:id/download` - Report download

**AI Service Layer**:
- Query Parser: Converts natural language to structured parameters
- Embeddings Service: Generates and searches semantic embeddings
- Anomaly Detector: Identifies unusual patterns in meter readings
- Report Generator: Creates formatted reports from data

**Data Access Layer**:
- Device DAO: Device metadata and hierarchy
- Meter DAO: Meter information and associations
- Reading DAO: Meter readings with temporal queries

**Cache Layer**:
- Search results cached for 5 minutes
- Embeddings cached for performance
- Insights cached for 30 minutes
- Report metadata cached

## Components and Interfaces

### 1. Natural Language Search Component

**Purpose**: Enable users to find devices/meters using natural language queries

**API Endpoint**: `POST /api/ai/search`

**Request**:
```typescript
interface SearchRequest {
  query: string;           // Natural language query
  tenantId: string;        // Multi-tenant isolation
  limit?: number;          // Result limit (default: 20)
  offset?: number;         // Pagination offset
}
```

**Response**:
```typescript
interface SearchResult {
  id: string;
  name: string;
  type: 'device' | 'meter';
  location: string;
  currentConsumption: number;
  unit: string;
  status: 'active' | 'inactive' | 'error';
  relevanceScore: number;
  lastReading: {
    value: number;
    timestamp: string;
  };
}

interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    total: number;
    clarifications?: string[];  // Suggestions for ambiguous queries
    executionTime: number;      // ms
  };
}
```

**Query Parsing Logic**:
- Extract location references (building, floor, room)
- Extract consumption criteria (high, low, over X, under X)
- Extract temporal references (today, this week, last month)
- Extract device type filters (meter, sensor, pump, etc.)
- Use embeddings for semantic matching on device names/descriptions

**Performance Requirements**:
- Search execution: < 2 seconds
- Cache hit: < 100ms
- Embedding generation: < 500ms

### 2. Dashboard Insights Component

**Purpose**: Automatically generate summaries, trends, and anomalies for dashboard display

**API Endpoint**: `GET /api/ai/insights`

**Request**:
```typescript
interface InsightsRequest {
  tenantId: string;
  period?: 'today' | 'week' | 'month' | 'year';  // default: 'month'
  forceRefresh?: boolean;
}
```

**Response**:
```typescript
interface Anomaly {
  deviceId: string;
  deviceName: string;
  type: 'spike' | 'drop' | 'pattern_change' | 'threshold_exceeded';
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  recommendation: string;
  detectedAt: string;
}

interface Trend {
  deviceId: string;
  deviceName: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  period: string;
}

interface InsightsResponse {
  success: boolean;
  data: {
    topConsumers: Array<{
      deviceId: string;
      deviceName: string;
      consumption: number;
      unit: string;
      percentOfTotal: number;
    }>;
    anomalies: Anomaly[];
    trends: Trend[];
    recommendations: string[];
    lastUpdated: string;
    dataPeriod: {
      start: string;
      end: string;
    };
    dataQuality: 'sufficient' | 'insufficient';
  };
}
```

**Insight Generation Logic**:
- Top 5 consumers: Aggregate consumption by device for period
- Anomaly detection: Compare readings to baseline (mean ± 2σ)
- Trend analysis: Linear regression on consumption over time
- Recommendations: Rule-based suggestions based on anomalies
- Refresh: Every 30 minutes or when new readings arrive

**Baseline Calculation**:
- Use 90 days of historical data (or available data if < 90 days)
- Calculate mean and standard deviation per device
- Update baseline weekly
- Handle seasonal variations with moving averages

### 3. Report Generation Component

**Purpose**: Generate natural language-driven reports in PDF/Excel format

**API Endpoint**: `POST /api/ai/reports`

**Request**:
```typescript
interface ReportRequest {
  query: string;           // Natural language report request
  tenantId: string;
  format: 'pdf' | 'excel';
  includeCharts?: boolean;
  includeRecommendations?: boolean;
}
```

**Response**:
```typescript
interface ReportResponse {
  success: boolean;
  data: {
    reportId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    estimatedCompletionTime?: number;  // seconds
  };
}
```

**Report Retrieval**: `GET /api/ai/reports/:id`

```typescript
interface ReportMetadata {
  id: string;
  tenantId: string;
  query: string;
  format: 'pdf' | 'excel';
  status: 'completed' | 'failed';
  createdAt: string;
  completedAt: string;
  fileSize: number;
  expiresAt: string;  // 30 days from creation
}
```

**Report Generation Logic**:
- Parse natural language to identify: scope, metrics, time period, grouping
- Validate user permissions for requested data
- Query database for relevant data
- Calculate requested metrics
- Generate visualizations (charts, tables)
- Format as PDF or Excel
- Store encrypted report
- Send notification when complete

**Report Sections**:
- Header: Timestamp, tenant ID, data period, generated by
- Executive Summary: Key findings and recommendations
- Top Consumers: Table and chart of highest consumption
- Trends: Trend analysis with visualizations
- Anomalies: Detected anomalies with explanations
- Detailed Data: Full dataset in tabular format
- Appendix: Methodology and data quality notes

**Performance Requirements**:
- Report generation: < 30 seconds
- Report storage: 30 days retention
- Concurrent reports: Queue and process fairly

### 4. Query Parser (LLM-based)

**Purpose**: Convert natural language to structured parameters

**Implementation**:
- Use OpenAI GPT-4 with few-shot prompting
- Structured output format (JSON)
- Fallback to keyword matching if LLM fails

**Parsed Parameters**:
```typescript
interface ParsedQuery {
  type: 'search' | 'report';
  scope: 'device' | 'meter' | 'location' | 'all';
  filters: {
    locations?: string[];
    deviceTypes?: string[];
    consumptionRange?: { min: number; max: number };
    status?: string[];
    timeRange?: { start: string; end: string };
  };
  metrics?: string[];  // For reports
  groupBy?: string;    // For reports
  confidence: number;  // 0-1
  suggestions?: string[];  // For ambiguous queries
}
```

### 5. Embeddings Service

**Purpose**: Enable semantic search on device metadata

**Implementation**:
- Use OpenAI embeddings API or local embedding model
- Store embeddings in PostgreSQL with pgvector extension
- Cache embeddings for 24 hours
- Update embeddings when device metadata changes

**Embedding Dimensions**: 1536 (OpenAI)

**Search Process**:
1. Generate embedding for search query
2. Find similar embeddings using cosine similarity
3. Rank results by similarity score
4. Apply filters (location, consumption, status)
5. Return top N results

### 6. Anomaly Detection

**Purpose**: Identify unusual patterns in meter readings

**Detection Methods**:
- Statistical: Values outside mean ± 2σ
- Pattern: Sudden changes in consumption pattern
- Threshold: Values exceeding configured thresholds
- Trend: Unexpected trend changes

**Baseline Calculation**:
- Use 90 days of historical data
- Calculate per-device baseline
- Update weekly
- Handle missing data with interpolation

**Anomaly Scoring**:
- Severity: low (1-2σ), medium (2-3σ), high (>3σ)
- Confidence: Based on data quality and historical consistency

## Data Models

### Device Model
```typescript
interface Device {
  id: string;
  tenantId: string;
  name: string;
  type: string;  // meter, sensor, pump, etc.
  location: string;
  locationHierarchy: string[];  // [building, floor, room]
  status: 'active' | 'inactive' | 'error';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### Meter Model
```typescript
interface Meter {
  id: string;
  tenantId: string;
  deviceId: string;
  name: string;
  unit: string;  // kWh, m³, etc.
  type: string;  // electricity, water, gas, etc.
  createdAt: string;
  updatedAt: string;
}
```

### Reading Model
```typescript
interface Reading {
  id: string;
  tenantId: string;
  meterId: string;
  value: number;
  timestamp: string;
  quality: 'good' | 'estimated' | 'invalid';
  createdAt: string;
}
```

### Report Model
```typescript
interface Report {
  id: string;
  tenantId: string;
  userId: string;
  query: string;
  format: 'pdf' | 'excel';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;  // 30 days from creation
}
```

### Embedding Model
```typescript
interface DeviceEmbedding {
  id: string;
  deviceId: string;
  tenantId: string;
  embedding: number[];  // 1536 dimensions
  metadata: string;  // Concatenated device name, type, location
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### Search Endpoints

**POST /api/ai/search**
- Natural language search for devices/meters
- Request: SearchRequest
- Response: SearchResponse
- Auth: Required
- Rate limit: 100 req/min per tenant

**GET /api/ai/search/cache/:queryHash**
- Retrieve cached search results
- Response: SearchResponse
- Auth: Required
- Cache TTL: 5 minutes

### Insights Endpoints

**GET /api/ai/insights**
- Get dashboard insights
- Query params: period, forceRefresh
- Response: InsightsResponse
- Auth: Required
- Rate limit: 10 req/min per tenant
- Cache TTL: 30 minutes

### Report Endpoints

**POST /api/ai/reports**
- Submit report generation request
- Request: ReportRequest
- Response: ReportResponse
- Auth: Required
- Rate limit: 5 req/min per tenant
- Async processing with job queue

**GET /api/ai/reports/:id**
- Get report metadata and status
- Response: ReportMetadata
- Auth: Required

**GET /api/ai/reports/:id/download**
- Download generated report
- Response: File stream
- Auth: Required
- Permissions: User must have access to tenant data

**GET /api/ai/reports**
- List user's reports
- Query params: limit, offset, status
- Response: Paginated list of ReportMetadata
- Auth: Required

## Error Handling

**Error Response Format**:
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

**Error Codes**:
- `INVALID_QUERY`: Query format invalid or unparseable
- `INSUFFICIENT_DATA`: Not enough historical data for insights
- `PERMISSION_DENIED`: User lacks access to requested data
- `AI_SERVICE_UNAVAILABLE`: External AI service down
- `TIMEOUT`: Operation exceeded time limit
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Unexpected server error

**Fallback Behavior**:
- Search unavailable: Show basic device list
- Insights unavailable: Show "Insights unavailable" message
- Report generation failed: Offer retry or simpler format
- Invalid data: Skip data point and continue processing
- External API failure: Retry up to 3 times with exponential backoff

## Security Considerations

**Multi-Tenant Isolation**:
- All queries filtered by tenantId
- Database queries include tenant filter
- Cache keys include tenantId
- Report access verified by tenantId

**Data Privacy**:
- Raw meter data not sent to external LLM services
- Anonymize data before external API calls
- Encrypt reports at rest and in transit
- Comply with data retention policies
- Delete cached data after retention period

**Authentication & Authorization**:
- JWT token required for all endpoints
- Verify user permissions for report data access
- Rate limiting per tenant
- Audit logging for sensitive operations

**External Service Security**:
- Use secure authentication (API keys in environment)
- Validate SSL certificates
- Timeout on external calls (30 seconds)
- Retry logic with exponential backoff
- Circuit breaker pattern for failing services

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Search Query Parsing Accuracy
*For any* natural language search query, the parsed parameters should correctly identify all search criteria (location, consumption range, device type, temporal references) present in the query.
**Validates: Requirements 1.1, 1.2, 1.3, 1.7**

### Property 2: Location Hierarchy Matching
*For any* search query containing location references and any tenant location hierarchy, all returned results should have locations that match the query references within the hierarchy.
**Validates: Requirements 1.2**

### Property 3: Consumption Range Filtering
*For any* search query with consumption criteria and any device dataset, all returned results should have consumption values within the specified range.
**Validates: Requirements 1.3**

### Property 4: Search Result Completeness
*For any* search result, all required fields (name, location, current consumption, status) should be present in the response.
**Validates: Requirements 1.5**

### Property 5: Search Result Caching
*For any* identical search query performed twice within 5 minutes, the second query should return cached results with execution time < 100ms.
**Validates: Requirements 1.6**

### Property 6: Top Consumers Accuracy
*For any* device dataset and consumption period, the returned top 5 consuming devices should be the actual top 5 by total consumption.
**Validates: Requirements 2.1**

### Property 7: Anomaly Detection Sensitivity
*For any* meter reading dataset with known anomalies (values outside mean ± 2σ), the anomaly detector should identify all anomalies with severity >= low.
**Validates: Requirements 2.2**

### Property 8: Trend Calculation Correctness
*For any* consumption time series, the calculated trend direction should match the actual trend (increasing, decreasing, or stable) based on linear regression.
**Validates: Requirements 2.3**

### Property 9: Anomaly Explanation Presence
*For any* detected anomaly, the response should include a brief explanation describing why it is considered anomalous.
**Validates: Requirements 2.4**

### Property 10: Recommendation Inclusion
*For any* generated insight, the response should include at least one actionable recommendation based on the detected anomalies or trends.
**Validates: Requirements 2.5**

### Property 11: Insight Metadata Completeness
*For any* generated insight, the response should include timestamp of last update and the data period covered.
**Validates: Requirements 2.7**

### Property 12: Report Parameter Parsing
*For any* natural language report request, the parsed parameters should correctly identify scope, metrics, time period, and grouping.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 13: Report Format Validity
*For any* generated report, the output should be a valid PDF or Excel file with clear sections (header, summary, data, appendix).
**Validates: Requirements 3.4**

### Property 14: Report Header Metadata
*For any* generated report, the header should include timestamp, tenant identifier, and data period.
**Validates: Requirements 3.5**

### Property 15: Report Permission Validation
*For any* report generation request, the system should verify user permissions before including data in the report.
**Validates: Requirements 3.6**

### Property 16: Multi-Tenant Data Isolation
*For any* query from tenant A, the results should only include data belonging to tenant A, never data from other tenants.
**Validates: Requirements 4.1**

### Property 17: Search Performance SLA
*For any* search query, execution time should be < 2 seconds (excluding cache hits).
**Validates: Requirements 4.2**

### Property 18: Report Generation Performance SLA
*For any* report generation request, processing should complete within 30 seconds.
**Validates: Requirements 4.2**

### Property 19: Query Validation
*For any* malformed query, the system should reject it with a descriptive error message.
**Validates: Requirements 4.3**

### Property 20: Semantic Search with Embeddings
*For any* search query, the system should use embeddings to find semantically similar device names and descriptions.
**Validates: Requirements 4.4**

### Property 21: Baseline Pattern Establishment
*For any* device with sufficient historical data (>= 30 days), the system should establish a baseline consumption pattern.
**Validates: Requirements 4.5**

### Property 22: Data Consistency
*For any* meter reading processed by the system, the reading should not be lost or duplicated in the database.
**Validates: Requirements 4.6**

### Property 23: Error Logging and User Messages
*For any* error encountered by the AI engine, the error should be logged with sufficient context and a user-friendly message returned.
**Validates: Requirements 4.7**

### Property 24: Concurrent Request Fairness
*For any* set of concurrent requests from multiple tenants, all requests should be processed without starvation.
**Validates: Requirements 4.8**

### Property 25: Raw Data Privacy
*For any* query processed by the AI engine, raw meter data should not be logged or stored in external AI services.
**Validates: Requirements 5.1**

### Property 26: Data Anonymization
*For any* external LLM API call, sensitive data should be anonymized before transmission.
**Validates: Requirements 5.2**

### Property 27: Report Data Access Control
*For any* report generation request, the system should verify user permissions before including data.
**Validates: Requirements 5.3**

### Property 28: Data Retention Compliance
*For any* cached data, it should be deleted after the configured retention period expires.
**Validates: Requirements 5.4**

### Property 29: Report Encryption
*For any* generated report, it should be encrypted at rest and in transit.
**Validates: Requirements 5.5**

### Property 30: Secure External Communication
*For any* external API call, the system should use secure authentication and validate SSL certificates.
**Validates: Requirements 5.6**

### Property 31: Query Parsing Error Recovery
*For any* unparseable natural language query, the system should suggest corrections or ask the user to rephrase.
**Validates: Requirements 6.2**

### Property 32: Invalid Data Handling
*For any* invalid data point detected during processing, the system should skip it and continue processing.
**Validates: Requirements 6.4**

### Property 33: External API Retry Logic
*For any* failed external API call, the system should retry up to 3 times with exponential backoff before returning an error.
**Validates: Requirements 6.5**

## Testing Strategy

### Unit Testing

Unit tests validate specific examples, edge cases, and error conditions:

- Query parser: Test parsing of various natural language patterns
- Embeddings: Test embedding generation and similarity search
- Anomaly detection: Test detection with known anomalies
- Report generation: Test report formatting and metadata
- Permission validation: Test access control for different user roles
- Error handling: Test error messages and fallback behavior
- Data validation: Test input validation and sanitization

### Property-Based Testing

Property-based tests validate universal properties across all inputs using randomization:

- Search accuracy: Generate random queries and verify parsed parameters
- Filtering correctness: Generate random device data and verify filter results
- Anomaly detection: Generate random time series with known anomalies
- Data isolation: Generate queries from multiple tenants
- Performance: Measure execution time across various input sizes
- Encryption: Verify reports are encrypted at rest and in transit
- Retry logic: Simulate API failures and verify retry behavior

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: ai-meter-insights, Property N: [property_text]`

### Integration Testing

Integration tests validate end-to-end flows:

- Search to device details display
- Dashboard insights generation and display
- Report generation and download
- Multi-tenant data isolation
- Cache invalidation and refresh
- External API integration
- Error handling and fallback behavior

### Performance Testing

Performance tests validate SLA compliance:

- Search execution time < 2 seconds
- Report generation < 30 seconds
- Cache hit time < 100ms
- Concurrent request handling
- Database query optimization
- Embedding generation performance

## Implementation Notes

**Technology Stack**:
- Frontend: React, TypeScript, Axios
- Backend: Node.js, Express, Sequelize
- Database: PostgreSQL with pgvector extension
- Cache: Redis
- External APIs: OpenAI (GPT-4, Embeddings)
- Report Generation: PDFKit or ExcelJS
- Job Queue: Bull or RabbitMQ

**Dependencies**:
- `openai`: OpenAI API client
- `redis`: Redis client
- `pdfkit`: PDF generation
- `exceljs`: Excel generation
- `bull`: Job queue
- `joi`: Input validation
- `winston`: Logging

**Configuration**:
- OpenAI API key in environment
- Redis connection string
- Database connection string
- Cache TTL values (5 min search, 30 min insights)
- Report retention (30 days)
- Performance timeouts (2s search, 30s report)
- Retry configuration (3 attempts, exponential backoff)

**Deployment Considerations**:
- Horizontal scaling: Stateless API servers
- Cache layer: Shared Redis instance
- Database: Connection pooling
- Job queue: Distributed processing
- External APIs: Rate limiting and circuit breaker
- Monitoring: Request metrics, error rates, performance
