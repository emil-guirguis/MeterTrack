# Threading Infrastructure Unit Tests

This directory contains comprehensive unit tests for the MCP Server Threading infrastructure.

## Test Files

### Core Component Tests
- **`ThreadManager.test.js`** - Tests for the main thread manager that handles worker lifecycle
- **`MessageHandler.test.js`** - Tests for message serialization, validation, and queue management
- **`mcp-worker.test.js`** - Tests for the worker thread entry point and message handling
- **`ModbusMCPServerWorker.test.js`** - Tests for the MCP server wrapper in worker context

### Integration Tests
- **`integration.test.js`** - Integration tests that verify components work together correctly

### Test Configuration
- **`jest.config.js`** - Jest configuration for the test suite
- **`jest.setup.js`** - Global test setup and utilities
- **`run-tests.js`** - Test runner script with fallback options

## Running Tests

### Option 1: Using Jest (Recommended)
```bash
# Install Jest if not already installed
npm install --save-dev jest @jest/globals

# Run tests
cd backend/src/services/threading/__tests__
npx jest --config jest.config.js
```

### Option 2: Using the Test Runner Script
```bash
cd backend/src/services/threading/__tests__
node run-tests.js
```

### Option 3: Manual Test Execution
```bash
# Run individual test files
node ThreadManager.test.js
node MessageHandler.test.js
node mcp-worker.test.js
node ModbusMCPServerWorker.test.js
node integration.test.js
```

## Test Coverage

The test suite covers:

### ThreadManager
- ✅ Worker thread lifecycle (start/stop)
- ✅ Message communication
- ✅ Error handling and recovery
- ✅ Configuration management
- ✅ Health monitoring
- ✅ Resource cleanup

### MessageHandler
- ✅ Message creation and validation
- ✅ Serialization/deserialization
- ✅ Request/response correlation
- ✅ Message queue management
- ✅ Timeout handling
- ✅ Error scenarios

### MCP Worker Thread
- ✅ Worker initialization
- ✅ Message port setup
- ✅ Command handling (start/stop/status/config/data/ping)
- ✅ Error handling and reporting
- ✅ Health monitoring
- ✅ Graceful shutdown

### ModbusMCPServerWorker
- ✅ Server lifecycle management
- ✅ Configuration handling
- ✅ Tool execution (all MCP tools)
- ✅ Data collection operations
- ✅ Connection testing
- ✅ Error handling

### Integration Tests
- ✅ Component interaction
- ✅ End-to-end message flow
- ✅ Error propagation
- ✅ Resource management
- ✅ Configuration validation

## Test Utilities

The test suite includes several utilities in `jest.setup.js`:

- **`testUtils.createMockConfig()`** - Creates mock configuration objects
- **`testUtils.createMockLogger()`** - Creates mock logger instances
- **`testUtils.wait(ms)`** - Helper for async operations
- **`testUtils.createMockResponse()`** - Creates mock worker responses

## Mocking Strategy

The tests use comprehensive mocking for:

- **Worker Threads API** - Mocked to avoid actual thread creation during tests
- **Winston Logger** - Mocked to prevent log noise and test log calls
- **Environment Variables** - Controlled test environment
- **External Dependencies** - Isolated testing of core logic

## Coverage Goals

The test suite aims for:
- **80%+ Line Coverage** - Ensuring most code paths are tested
- **80%+ Branch Coverage** - Testing different execution branches
- **80%+ Function Coverage** - Testing all public methods
- **80%+ Statement Coverage** - Testing individual statements

## Test Categories

### Unit Tests
- Test individual components in isolation
- Mock all external dependencies
- Focus on specific functionality

### Integration Tests
- Test component interactions
- Verify end-to-end workflows
- Test error propagation between components

### Error Handling Tests
- Test various failure scenarios
- Verify graceful error handling
- Test recovery mechanisms

### Performance Tests
- Test timeout handling
- Test resource cleanup
- Test memory management

## Best Practices

1. **Isolation** - Each test is independent and can run in any order
2. **Cleanup** - All tests clean up resources after execution
3. **Mocking** - External dependencies are mocked for reliable testing
4. **Assertions** - Clear, specific assertions that verify expected behavior
5. **Error Testing** - Both success and failure scenarios are tested

## Troubleshooting

### Common Issues

1. **Module Import Errors**
   - Ensure all dependencies are installed
   - Check file paths and extensions

2. **Async Test Failures**
   - Use proper async/await or done callbacks
   - Set appropriate test timeouts

3. **Mock Issues**
   - Clear mocks between tests
   - Verify mock implementations match real APIs

4. **Environment Issues**
   - Check environment variables in jest.setup.js
   - Ensure test environment is properly configured

### Debug Mode

To run tests with debug output:
```bash
DEBUG=* node run-tests.js
```

Or with Jest:
```bash
npx jest --config jest.config.js --verbose --no-cache
```