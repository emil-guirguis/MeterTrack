import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BACnetClient, BACnetDataPoint, MeterReading } from './bacnet-client';
import winston from 'winston';

describe('BACnetClient - Register Number Handling', () => {
  let client: BACnetClient;
  let mockLogger: winston.Logger;

  beforeEach(() => {
    // Create mock logger
    mockLogger = winston.createLogger({
      transports: [new winston.transports.Console({ silent: true })],
    });

    // Create BACnetClient with mock config
    const config = {
      interface: '0.0.0.0',
      port: 47808,
      broadcastAddress: '255.255.255.255',
      timeout: 6000,
    };

    client = new BACnetClient(config, mockLogger);
  });

  describe('readMultipleProperties with calculated register numbers', () => {
    it('should use calculated register number when provided', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy.mockResolvedValue(42);

      // Create data points with calculated register numbers
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_reading',
          registerNumber: 11100, // Calculated register number for element B
          fieldName: 'energy_reading',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: readProperty was called with calculated register number
      expect(readPropertySpy).toHaveBeenCalledWith(
        123,
        '192.168.1.100',
        0,
        11100, // Should use registerNumber, not instance
        85
      );

      // Verify: Reading includes register number and field name
      expect(readings).toHaveLength(1);
      expect(readings[0].registerNumber).toBe(11100);
      expect(readings[0].fieldName).toBe('energy_reading');
    });

    it('should fall back to instance when register number not provided', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy.mockResolvedValue(42);

      // Create data points without calculated register numbers
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_reading',
          // No registerNumber provided
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: readProperty was called with instance
      expect(readPropertySpy).toHaveBeenCalledWith(
        123,
        '192.168.1.100',
        0,
        1100, // Should use instance
        85
      );

      // Verify: Reading does not have register number
      expect(readings).toHaveLength(1);
      expect(readings[0].registerNumber).toBeUndefined();
    });

    it('should include field name in returned readings', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy.mockResolvedValue(42);

      // Create data points with field names
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_reading',
          registerNumber: 11100,
          fieldName: 'energy_reading',
        },
        {
          objectType: 0,
          instance: 1101,
          property: 85,
          name: 'power_reading',
          registerNumber: 11101,
          fieldName: 'power_reading',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: All readings include field names
      expect(readings).toHaveLength(2);
      expect(readings[0].fieldName).toBe('energy_reading');
      expect(readings[1].fieldName).toBe('power_reading');
    });

    it('should handle multiple data points with different register numbers', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy.mockResolvedValue(42);

      // Create data points with different calculated register numbers
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_A',
          registerNumber: 1100, // Element A
          fieldName: 'energy_A',
        },
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_B',
          registerNumber: 11100, // Element B
          fieldName: 'energy_B',
        },
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_C',
          registerNumber: 21100, // Element C
          fieldName: 'energy_C',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: All readings have correct register numbers
      expect(readings).toHaveLength(3);
      expect(readings[0].registerNumber).toBe(1100);
      expect(readings[1].registerNumber).toBe(11100);
      expect(readings[2].registerNumber).toBe(21100);

      // Verify: readProperty was called with correct register numbers
      expect(readPropertySpy).toHaveBeenNthCalledWith(1, 123, '192.168.1.100', 0, 1100, 85);
      expect(readPropertySpy).toHaveBeenNthCalledWith(2, 123, '192.168.1.100', 0, 11100, 85);
      expect(readPropertySpy).toHaveBeenNthCalledWith(3, 123, '192.168.1.100', 0, 21100, 85);
    });

    it('should continue reading other data points if one fails', async () => {
      // Setup: Mock the readProperty method to fail on second call
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy
        .mockResolvedValueOnce(42) // First call succeeds
        .mockRejectedValueOnce(new Error('Read failed')) // Second call fails
        .mockResolvedValueOnce(99); // Third call succeeds

      // Create data points
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_A',
          registerNumber: 1100,
          fieldName: 'energy_A',
        },
        {
          objectType: 0,
          instance: 1101,
          property: 85,
          name: 'energy_B',
          registerNumber: 11100,
          fieldName: 'energy_B',
        },
        {
          objectType: 0,
          instance: 1102,
          property: 85,
          name: 'energy_C',
          registerNumber: 21100,
          fieldName: 'energy_C',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: Only successful readings are returned
      expect(readings).toHaveLength(2);
      expect(readings[0].value).toBe(42);
      expect(readings[0].registerNumber).toBe(1100);
      expect(readings[1].value).toBe(99);
      expect(readings[1].registerNumber).toBe(21100);
    });

    it('should preserve data point name in reading', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy.mockResolvedValue(42);

      // Create data points with specific names
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_reading',
          registerNumber: 11100,
          fieldName: 'energy_reading',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: Reading preserves data point name
      expect(readings).toHaveLength(1);
      expect(readings[0].dataPoint).toBe('energy_reading');
    });

    it('should set quality to good for successful reads', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy.mockResolvedValue(42);

      // Create data points
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_reading',
          registerNumber: 11100,
          fieldName: 'energy_reading',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: Quality is set to good
      expect(readings).toHaveLength(1);
      expect(readings[0].quality).toBe('good');
    });

    it('should set source to bacnet for all readings', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy.mockResolvedValue(42);

      // Create data points
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_reading',
          registerNumber: 11100,
          fieldName: 'energy_reading',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: Source is set to bacnet
      expect(readings).toHaveLength(1);
      expect(readings[0].source).toBe('bacnet');
    });

    it('should include timestamp in all readings', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy.mockResolvedValue(42);

      // Create data points
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_reading',
          registerNumber: 11100,
          fieldName: 'energy_reading',
        },
      ];

      // Execute: Call readMultipleProperties
      const beforeTime = new Date();
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);
      const afterTime = new Date();

      // Verify: Timestamp is within expected range
      expect(readings).toHaveLength(1);
      expect(readings[0].timestamp).toBeInstanceOf(Date);
      expect(readings[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(readings[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should handle null and undefined values gracefully', async () => {
      // Setup: Mock the readProperty method to return null/undefined
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce(undefined) // Second call returns undefined
        .mockResolvedValueOnce(42); // Third call returns valid value

      // Create data points
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_A',
          registerNumber: 1100,
          fieldName: 'energy_A',
        },
        {
          objectType: 0,
          instance: 1101,
          property: 85,
          name: 'energy_B',
          registerNumber: 11100,
          fieldName: 'energy_B',
        },
        {
          objectType: 0,
          instance: 1102,
          property: 85,
          name: 'energy_C',
          registerNumber: 21100,
          fieldName: 'energy_C',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: Only valid readings are returned
      expect(readings).toHaveLength(1);
      expect(readings[0].value).toBe(42);
      expect(readings[0].registerNumber).toBe(21100);
    });

    it('should convert numeric values to numbers', async () => {
      // Setup: Mock the readProperty method to return string values
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy
        .mockResolvedValueOnce('42') // String value
        .mockResolvedValueOnce(42); // Numeric value

      // Create data points
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy_A',
          registerNumber: 1100,
          fieldName: 'energy_A',
        },
        {
          objectType: 0,
          instance: 1101,
          property: 85,
          name: 'energy_B',
          registerNumber: 11100,
          fieldName: 'energy_B',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: All values are converted to numbers
      expect(readings).toHaveLength(2);
      expect(readings[0].value).toBe(42);
      expect(typeof readings[0].value).toBe('number');
      expect(readings[1].value).toBe(42);
      expect(typeof readings[1].value).toBe('number');
    });
  });

  describe('Integration tests', () => {
    it('should handle complete flow with element-specific registers', async () => {
      // Setup: Mock the readProperty method
      const readPropertySpy = vi.spyOn(client, 'readProperty' as any);
      readPropertySpy
        .mockResolvedValueOnce(100) // Energy for element A
        .mockResolvedValueOnce(200) // Power for element A
        .mockResolvedValueOnce(110) // Energy for element B
        .mockResolvedValueOnce(210); // Power for element B

      // Create data points simulating element A and B readings
      const dataPoints: BACnetDataPoint[] = [
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy',
          registerNumber: 1100, // Element A
          fieldName: 'energy_reading',
        },
        {
          objectType: 0,
          instance: 1101,
          property: 85,
          name: 'power',
          registerNumber: 1101, // Element A
          fieldName: 'power_reading',
        },
        {
          objectType: 0,
          instance: 1100,
          property: 85,
          name: 'energy',
          registerNumber: 11100, // Element B
          fieldName: 'energy_reading',
        },
        {
          objectType: 0,
          instance: 1101,
          property: 85,
          name: 'power',
          registerNumber: 11101, // Element B
          fieldName: 'power_reading',
        },
      ];

      // Execute: Call readMultipleProperties
      const readings = await client.readMultipleProperties(123, '192.168.1.100', dataPoints);

      // Verify: All readings are returned with correct values and register numbers
      expect(readings).toHaveLength(4);
      expect(readings[0].value).toBe(100);
      expect(readings[0].registerNumber).toBe(1100);
      expect(readings[1].value).toBe(200);
      expect(readings[1].registerNumber).toBe(1101);
      expect(readings[2].value).toBe(110);
      expect(readings[2].registerNumber).toBe(11100);
      expect(readings[3].value).toBe(210);
      expect(readings[3].registerNumber).toBe(11101);
    });
  });
});
