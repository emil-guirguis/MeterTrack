# MCP Modbus Agent - Library Migration Setup

This document describes the setup for migrating from `modbus-serial` to `jsmodbus` library in the MCP Modbus Agent.

## Setup Complete ✅

### 1. Dependencies Installed
- ✅ `jsmodbus@4.0.10` installed alongside existing `modbus-serial`
- ✅ TypeScript interfaces created in `src/types/modbus.ts`
- ✅ Comparison testing tools created

### 2. TypeScript Interfaces
New comprehensive TypeScript interfaces are available in `src/types/modbus.ts`:
- `ModbusClientConfig` - Enhanced client configuration
- `ModbusClientInterface` - Client interface for both libraries
- `MeterReading` - Enhanced meter reading structure with backward compatibility
- `ConnectionPool` - Connection pooling for concurrent connections
- `FieldMapping` - Dynamic register mapping configuration
- `CollectionConfig` - Data collection configuration
- Performance monitoring and error handling types

### 3. Testing Tools
- **Comparison Script**: `src/test/library-comparison.ts`
- **NPM Scripts**: 
  - `npm run modbus:compare` - Run library comparison
  - `npm run modbus:test` - Same as above

### 4. Configuration
- **Test Config**: `.env.modbus-test` (copy to `.env.local` and adjust)
- **Default Test Device**: `10.10.10.11:502` (Unit ID: 1)

## Usage

### Running Library Comparison
```bash
# Set test environment variables
cp .env.modbus-test .env.local
# Edit .env.local with your test device settings

# Run comparison test
npm run modbus:compare
```

### Environment Variables
```bash
TEST_MODBUS_HOST=10.10.10.11      # Test device IP
TEST_MODBUS_PORT=502              # Modbus TCP port
TEST_MODBUS_UNIT_ID=1             # Device unit ID
TEST_MODBUS_TIMEOUT=5000          # Connection timeout (ms)

# Migration settings
USE_NEW_LIBRARY=false             # Switch to new library
ENABLE_FALLBACK=true              # Enable fallback to old library
COMPARISON_MODE=true              # Run both libraries for comparison
LOG_DIFFERENCES=true              # Log data differences

# Connection pool settings
MAX_CONNECTIONS=10                # Maximum concurrent connections
IDLE_TIMEOUT=30000               # Idle connection timeout (ms)
ACQUIRE_TIMEOUT=10000            # Connection acquire timeout (ms)
```

## Key Features

### Enhanced Type Safety
- Full TypeScript support for all Modbus operations
- Comprehensive error handling with typed exceptions
- Standardized interfaces for connection management

### Connection Pooling Support
- Designed for 50+ concurrent meter connections
- Automatic connection lifecycle management
- Health monitoring and reconnection logic

### Backward Compatibility
- Maintains existing `MeterReading` structure
- Supports legacy field names (kWh, kW, V, A, etc.)
- Compatible with existing data collection patterns

### Performance Monitoring
- Built-in performance metrics collection
- Connection time, read time, and success rate tracking
- Comparison tools for migration validation

## Next Steps

This completes **Task 1: Setup and preparation**. The development environment is now ready for:

1. ✅ Both libraries installed and available
2. ✅ TypeScript interfaces defined for enhanced client
3. ✅ Comparison testing tools ready
4. ✅ Development environment configured for 50+ connections

**Ready for Task 2**: Create enhanced Modbus client for MCP agent

## Testing the Setup

To verify everything is working:

```bash
# Test TypeScript compilation
npx tsc src/types/modbus.ts --noEmit

# Test library comparison (requires test device)
npm run modbus:compare

# Check installed dependencies
npm list jsmodbus
npm list modbus-serial

# Build the project
npm run build
```

## Files Created

- `src/types/modbus.ts` - Enhanced TypeScript interfaces
- `src/test/library-comparison.ts` - Comprehensive comparison testing tool
- `.env.modbus-test` - Test configuration template
- `MODBUS_MIGRATION_SETUP.md` - This documentation

## Migration Strategy

The setup supports a phased migration approach:

1. **Phase 1**: Side-by-side testing with comparison mode
2. **Phase 2**: Gradual rollout with fallback capability
3. **Phase 3**: Full migration with performance monitoring
4. **Phase 4**: Cleanup of legacy code

This ensures zero-downtime migration with full validation at each step.