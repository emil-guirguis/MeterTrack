/**
 * Relationship Loading Tests
 * 
 * Tests for BaseModel relationship loading functionality
 * Validates BELONGS_TO, HAS_MANY, and circular dependency prevention
 */

const Meter = require('../models/MeterWithSchema');
const Device = require('../models/DeviceWithSchema');
const Location = require('../models/LocationWithSchema');
// Jest globals (describe, test, expect, beforeEach) are available automatically

// Mock database
const mockDb = {
  query: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: true
};

// Mock the database module
jest.mock('../config/database', () => mockDb);

describe('Relationship Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BELONGS_TO Relationships', () => {
    test('should load Meter → Device relationship', async () => {
      // Mock meter data
      const meterData = {
        id: 1,
        name: 'Test Meter',
        device_id: 10,
        location_id: 20,
        serial_number: 'SN-001',
        ip: '192.168.1.100',
        port: 502,
        type: 'electric',
        status: 'active'
      };

      // Mock device data
      const deviceData = {
        id: 10,
        manufacturer: 'Test Manufacturer',
        model_number: 'TEST-001',
        type: 'electric',
        active: true
      };

      // Mock findById to return meter
      mockDb.query.mockResolvedValueOnce({ rows: [meterData] });

      const meter = await Meter.findById(1);
      expect(meter).toBeTruthy();
      expect(meter.device_id).toBe(10);

      // Mock device query for loadRelationship
      mockDb.query.mockResolvedValueOnce({ rows: [deviceData] });

      // Load the device relationship
      const device = await meter.loadRelationship('device');

      expect(device).toBeTruthy();
      expect(device.id).toBe(10);
      expect(device.manufacturer).toBe('Test Manufacturer');

      // Verify it's stored on the instance
      expect(meter.device).toBeTruthy();
      expect(meter.device.id).toBe(10);
    });

    test('should load Meter → Location relationship', async () => {
      // Mock meter data
      const meterData = {
        id: 1,
        name: 'Test Meter',
        device_id: 10,
        location_id: 20,
        serial_number: 'SN-001',
        ip: '192.168.1.100',
        port: 502,
        type: 'electric',
        status: 'active'
      };

      // Mock location data
      const locationData = {
        id: 20,
        name: 'Test Location',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'Test Country',
        type: 'building',
        active: true
      };

      // Mock findById to return meter
      mockDb.query.mockResolvedValueOnce({ rows: [meterData] });

      const meter = await Meter.findById(1);
      expect(meter).toBeTruthy();
      expect(meter.location_id).toBe(20);

      // Mock location query for loadRelationship
      mockDb.query.mockResolvedValueOnce({ rows: [locationData] });

      // Load the location relationship
      const location = await meter.loadRelationship('location');

      expect(location).toBeTruthy();
      expect(location.id).toBe(20);
      expect(location.name).toBe('Test Location');

      // Verify it's stored on the instance
      expect(meter.location).toBeTruthy();
      expect(meter.location.id).toBe(20);
    });

    test('should support select fields in BELONGS_TO', async () => {
      // Mock meter data
      const meterData = {
        id: 1,
        name: 'Test Meter',
        device_id: 10,
        location_id: 20,
        serial_number: 'SN-001',
        ip: '192.168.1.100',
        port: 502,
        type: 'electric',
        status: 'active'
      };

      // Mock device data with only selected fields
      const deviceData = {
        id: 10,
        manufacturer: 'Test Manufacturer'
      };

      // Mock findById to return meter
      mockDb.query.mockResolvedValueOnce({ rows: [meterData] });

      const meter = await Meter.findById(1);

      // Mock device query for loadRelationship with select
      mockDb.query.mockResolvedValueOnce({ rows: [deviceData] });

      // Load device with only specific fields
      const device = await meter.loadRelationship('device', {
        select: ['id', 'manufacturer'],
      });

      expect(device).toBeTruthy();
      expect(device.id).toBe(10);
      expect(device.manufacturer).toBe('Test Manufacturer');
    });

    test('should return null for BELONGS_TO when foreign key is null', async () => {
      // Mock meter data without device_id
      const meterData = {
        id: 1,
        name: 'Meter Without Device',
        device_id: null,
        location_id: null,
        serial_number: 'SN-NO-DEVICE',
        ip: '192.168.1.101',
        port: 502,
        type: 'electric',
        status: 'active'
      };

      // Mock findById to return meter
      mockDb.query.mockResolvedValueOnce({ rows: [meterData] });

      const meterWithoutDevice = await Meter.findById(1);
      const device = await meterWithoutDevice.loadRelationship('device');
      
      expect(device).toBeNull();
    });

    test('should throw error for undefined relationship', async () => {
      // Mock meter data
      const meterData = {
        id: 1,
        name: 'Test Meter',
        device_id: 10,
        location_id: 20,
        serial_number: 'SN-001',
        ip: '192.168.1.100',
        port: 502,
        type: 'electric',
        status: 'active'
      };

      // Mock findById to return meter
      mockDb.query.mockResolvedValueOnce({ rows: [meterData] });

      const meter = await Meter.findById(1);

      await expect(
        meter.loadRelationship('nonexistent')
      ).rejects.toThrow(/Relationship 'nonexistent' is not defined/);
    });
  });

  describe('HAS_MANY Relationships', () => {
    test('should load Device → Meters relationship', async () => {
      // Mock device data
      const deviceData = {
        id: 10,
        manufacturer: 'Test Manufacturer',
        model_number: 'TEST-001',
        type: 'electric',
        active: true
      };

      // Mock meters data
      const metersData = [
        {
          id: 1,
          name: 'Meter 1',
          device_id: 10,
          serial_number: 'SN-001',
          ip: '192.168.1.100',
          port: 502,
          type: 'electric',
          status: 'active'
        },
        {
          id: 2,
          name: 'Meter 2',
          device_id: 10,
          serial_number: 'SN-002',
          ip: '192.168.1.101',
          port: 502,
          type: 'electric',
          status: 'active'
        }
      ];

      // Mock findById to return device
      mockDb.query.mockResolvedValueOnce({ rows: [deviceData] });

      const device = await Device.findById(10);
      expect(device).toBeTruthy();

      // Mock meters query for loadRelationship
      mockDb.query.mockResolvedValueOnce({ rows: metersData });

      // Load the meters relationship
      const meters = await device.loadRelationship('meters');

      expect(meters).toBeTruthy();
      expect(Array.isArray(meters)).toBe(true);
      expect(meters.length).toBe(2);
      expect(meters[0].id).toBe(1);
      expect(meters[1].id).toBe(2);

      // Verify it's stored on the instance
      expect(device.meters).toBeTruthy();
      expect(device.meters.length).toBe(2);
    });

    test('should load Location → Meters relationship', async () => {
      // Mock location data
      const locationData = {
        id: 20,
        name: 'Test Location',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'Test Country',
        type: 'building',
        active: true
      };

      // Mock meters data
      const metersData = [
        {
          id: 3,
          name: 'Meter 3',
          location_id: 20,
          serial_number: 'SN-003',
          ip: '192.168.1.102',
          port: 502,
          type: 'electric',
          status: 'active'
        }
      ];

      // Mock findById to return location
      mockDb.query.mockResolvedValueOnce({ rows: [locationData] });

      const location = await Location.findById(20);
      expect(location).toBeTruthy();

      // Mock meters query for loadRelationship
      mockDb.query.mockResolvedValueOnce({ rows: metersData });

      // Load the meters relationship
      const meters = await location.loadRelationship('meters');

      expect(meters).toBeTruthy();
      expect(Array.isArray(meters)).toBe(true);
      expect(meters.length).toBe(1);
      expect(meters[0].id).toBe(3);

      // Verify it's stored on the instance
      expect(location.meters).toBeTruthy();
      expect(location.meters.length).toBe(1);
    });

    test('should support options in HAS_MANY (limit, order)', async () => {
      // Mock device data
      const deviceData = {
        id: 10,
        manufacturer: 'Test Manufacturer',
        model_number: 'TEST-001',
        type: 'electric',
        active: true
      };

      // Mock limited meters data
      const metersData = [
        {
          id: 1,
          name: 'Meter 1',
          device_id: 10,
          serial_number: 'SN-001',
          ip: '192.168.1.100',
          port: 502,
          type: 'electric',
          status: 'active'
        }
      ];

      // Mock findById to return device
      mockDb.query.mockResolvedValueOnce({ rows: [deviceData] });

      const device = await Device.findById(10);

      // Mock meters query with limit
      mockDb.query.mockResolvedValueOnce({ rows: metersData });

      // Load meters with limit
      const meters = await device.loadRelationship('meters', {
        limit: 1,
        order: [['name', 'ASC']]
      });

      expect(meters).toBeTruthy();
      expect(meters.length).toBe(1);
    });
  });

  describe('Circular Dependency Prevention', () => {
    test('should detect and prevent circular dependencies', async () => {
      // Mock meter data
      const meterData = {
        id: 1,
        name: 'Test Meter',
        device_id: 10,
        location_id: 20,
        serial_number: 'SN-001',
        ip: '192.168.1.100',
        port: 502,
        type: 'electric',
        status: 'active'
      };

      // Mock findById to return meter
      mockDb.query.mockResolvedValueOnce({ rows: [meterData] });

      const meter = await Meter.findById(1);

      // Try to load the same relationship twice in the path
      // This simulates a circular dependency scenario
      const loadedPath = new Set(['Meter.device']);
      
      // The second call with the same path should return null and log a warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await meter.loadRelationship('device', { _loadedPath: loadedPath });
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Circular dependency detected'));
      
      consoleSpy.mockRestore();
    });

    test('should allow loading different relationships without false positives', async () => {
      // Mock meter data
      const meterData = {
        id: 1,
        name: 'Test Meter',
        device_id: 10,
        location_id: 20,
        serial_number: 'SN-001',
        ip: '192.168.1.100',
        port: 502,
        type: 'electric',
        status: 'active'
      };

      // Mock device data
      const deviceData = {
        id: 10,
        manufacturer: 'Test Manufacturer',
        model_number: 'TEST-001',
        type: 'electric',
        active: true
      };

      // Mock location data
      const locationData = {
        id: 20,
        name: 'Test Location',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'Test Country',
        type: 'building',
        active: true
      };

      // Mock findById to return meter
      mockDb.query.mockResolvedValueOnce({ rows: [meterData] });

      const meter = await Meter.findById(1);

      // Load device (should work)
      mockDb.query.mockResolvedValueOnce({ rows: [deviceData] });
      const device = await meter.loadRelationship('device');
      expect(device).toBeTruthy();

      // Load location (should also work - different relationship)
      mockDb.query.mockResolvedValueOnce({ rows: [locationData] });
      const location = await meter.loadRelationship('location');
      expect(location).toBeTruthy();
    });
  });

  describe('Load Multiple Relationships', () => {
    test('should load multiple relationships at once', async () => {
      // Mock meter data
      const meterData = {
        id: 1,
        name: 'Test Meter',
        device_id: 10,
        location_id: 20,
        serial_number: 'SN-001',
        ip: '192.168.1.100',
        port: 502,
        type: 'electric',
        status: 'active'
      };

      // Mock device data
      const deviceData = {
        id: 10,
        manufacturer: 'Test Manufacturer',
        model_number: 'TEST-001',
        type: 'electric',
        active: true
      };

      // Mock location data
      const locationData = {
        id: 20,
        name: 'Test Location',
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'Test Country',
        type: 'building',
        active: true
      };

      // Mock findById to return meter
      mockDb.query.mockResolvedValueOnce({ rows: [meterData] });

      const meter = await Meter.findById(1);

      // Mock device query
      mockDb.query.mockResolvedValueOnce({ rows: [deviceData] });
      // Mock location query
      mockDb.query.mockResolvedValueOnce({ rows: [locationData] });

      const relationships = await meter.loadRelationships(['device', 'location']);

      expect(relationships.device).toBeTruthy();
      expect(relationships.device.id).toBe(10);
      expect(relationships.location).toBeTruthy();
      expect(relationships.location.id).toBe(20);

      // Verify they're stored on the instance
      expect(meter.device).toBeTruthy();
      expect(meter.location).toBeTruthy();
    });
  });
});
