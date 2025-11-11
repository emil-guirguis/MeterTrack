# Modbus Register Scanner Design Document

## Overview

Fix the modbus-register-scanner to use proper Modbus TCP/IP protocol for accurate register reading and display register number, name, and value.

## Current Problem

The scanner uses `ModbusRTU` class but connects via TCP, causing protocol mismatch and inaccurate values.

## Solution

1. **Fix Protocol**: Ensure all operations use TCP/IP framing, not RTU
2. **Correct Data Reading**: Use proper TCP byte ordering and data interpretation  
3. **Display Output**: Show register number, name, and value correctly

## Key Changes Needed

- Verify `modbus-serial` library is configured for TCP/IP protocol
- Check register reading methods use TCP framing
- Ensure proper byte ordering for TCP/IP
- Display register information clearly