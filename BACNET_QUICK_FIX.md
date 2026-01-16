# BACnet Timeout - Quick Fix Guide

## The Problem
Meter at `10.10.10.22:47808` is not responding to BACnet requests and timing out.

## Quick Diagnostics

### 1. Check if Meter is Reachable
```bash
# Test network connectivity
ping 10.10.10.22

# Test BACnet port
telnet 10.10.10.22 47808
```

**Expected**: Ping succeeds, telnet connects or times out (not refused)
**Problem**: Ping fails or connection refused = meter is offline/unreachable

### 2. Check Sync Server BACnet Port
```bash
# Verify BACnet is listening
netstat -an | grep 47808
# or
ss -an | grep 47808
```

**Expected**: Should see `0.0.0.0:47808` listening
**Problem**: Nothing shown = BACnet not initialized

### 3. Check Logs for Connectivity Check
Look for:
```
Checking connectivity for meter 1 at 10.10.10.22:47808
```

If you see:
```
Meter 1 is offline or unreachable, skipping meter
```

Then the meter failed the connectivity check.

## Quick Fixes

### Fix 1: Increase Timeouts (If Meter is Slow)
Edit `.env` and add:
```
BACNET_READ_TIMEOUT_MS=10000
BACNET_BATCH_READ_TIMEOUT_MS=15000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=10000
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=5000
```

Then restart:
```bash
npm run dev
```

### Fix 2: Disable Connectivity Check (If Check is Failing)
Edit `.env` and add:
```
BACNET_ENABLE_CONNECTIVITY_CHECK=false
```

This will skip the connectivity check and attempt to read anyway.

### Fix 3: Disable Sequential Fallback (If Fallback is Slow)
Edit `.env` and add:
```
BACNET_ENABLE_SEQUENTIAL_FALLBACK=false
```

This will skip the sequential fallback and fail faster.

### Fix 4: Disable Adaptive Batch Sizing (If Batch Reduction is Slow)
Edit `.env` and add:
```
BACNET_ADAPTIVE_BATCH_SIZING=false
```

This will not reduce batch size on timeout.

## Recommended Approach

1. **First**: Verify meter is online
   ```bash
   ping 10.10.10.22
   ```

2. **If ping fails**: Meter is offline
   - Check meter power
   - Check network cable
   - Check IP address
   - Check firewall rules

3. **If ping succeeds**: Try increasing timeouts
   ```
   BACNET_READ_TIMEOUT_MS=10000
   BACNET_BATCH_READ_TIMEOUT_MS=15000
   ```

4. **If still times out**: Disable connectivity check
   ```
   BACNET_ENABLE_CONNECTIVITY_CHECK=false
   ```

5. **If still times out**: Meter may not support BACnet
   - Verify meter has BACnet enabled
   - Check meter's BACnet configuration
   - Verify device ID and object instances

## Expected Behavior After Fix

### If Meter is Online and Responsive
```
✅ Meter 1 is online, proceeding with batch read
📋 Device 1 Registers:
  [1] Register ID: 1, Register #: 0, Field: Temperature, Unit: °C
✅ Successfully read register 0 (Temperature) from meter 1: value=22.5
📊 [BATCH INSERT] Starting batch insertion process
✓ INSERT completed in 45ms
✅ Successfully inserted batch 1/1 (1 readings)
```

### If Meter is Offline
```
Meter 1 is offline or unreachable, skipping meter
```

### If Meter is Slow but Responsive
```
⏱️  Batch 1 timed out for meter 1, reducing batch size
📉 Batch size reduced from 10 to 5, retrying batch 1
✅ Batch 1 completed successfully for meter 1
```

## Configuration Summary

| Scenario | Setting | Value |
|----------|---------|-------|
| Meter is slow | `BACNET_READ_TIMEOUT_MS` | 10000 |
| Meter is slow | `BACNET_BATCH_READ_TIMEOUT_MS` | 15000 |
| Connectivity check failing | `BACNET_ENABLE_CONNECTIVITY_CHECK` | false |
| Sequential fallback too slow | `BACNET_ENABLE_SEQUENTIAL_FALLBACK` | false |
| Batch sizing too slow | `BACNET_ADAPTIVE_BATCH_SIZING` | false |

## Need Help?

1. Check `BACNET_TIMEOUT_DIAGNOSIS.md` for detailed diagnosis
2. Check logs with `LOG_LEVEL=debug` for more details
3. Verify meter is online with `ping 10.10.10.22`
4. Check meter's BACnet configuration
5. Verify network connectivity and firewall rules
