const express = require('express');
const router = express.Router();
// const modbusService = require('../services/modbusService'); // Temporarily disabled
const { requirePermission } = require('../middleware/auth');

/**
 * Test Modbus connection to a device
 * POST /api/modbus/test
 */
router.post('/test', requirePermission('meter:read'), async (req, res) => {
  try {
    const { deviceIP, port = 502, slaveId = 1 } = req.body;

    if (!deviceIP) {
      return res.status(400).json({
        success: false,
        message: 'Device IP address is required'
      });
    }

    // Validate IP address format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(deviceIP)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format'
      });
    }

    // const isConnected = await modbusService.testConnection(deviceIP, port, slaveId);
    const isConnected = false; // Temporarily disabled

    res.json({
      success: true,
      data: {
        deviceIP,
        port,
        slaveId,
        connected: isConnected,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Modbus connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Modbus connection',
      error: error.message
    });
  }
});

/**
 * Read meter data from Modbus device
 * POST /api/modbus/read-meter
 */
router.post('/read-meter', requirePermission('meter:read'), async (req, res) => {
  try {
    const { 
      deviceIP, 
      port = 502, 
      slaveId = 1,
      meterType = 'generic',
      customRegisters
    } = req.body;

    if (!deviceIP) {
      return res.status(400).json({
        success: false,
        message: 'Device IP address is required'
      });
    }

    // Define register configurations for different meter types
    const meterConfigs = {
      generic: {
        // REAL METER MAPPING - Based on actual device at 10.10.10.22:502
        voltage: { address: 5, count: 1, scale: 200 },    // Register 5, scale by 200
        current: { address: 6, count: 1, scale: 100 },    // Register 6, scale by 100
        power: { address: 7, count: 1, scale: 1 },        // Register 7, direct watts
        energy: { address: 8, count: 1, scale: 1 },       // Register 8 estimate
        frequency: { address: 0, count: 1, scale: 10 },   // Register 0, scale by 10
        powerFactor: { address: 9, count: 1, scale: 1000 } // Register 9 estimate
      },
      schneider: {
        voltage: { address: 3027, count: 1, scale: 1 },
        current: { address: 3001, count: 1, scale: 1000 },
        power: { address: 3053, count: 1, scale: 1 },
        energy: { address: 3203, count: 2, scale: 1 },
        frequency: { address: 3109, count: 1, scale: 100 }
      },
      abb: {
        voltage: { address: 0x5002, count: 1, scale: 10 },
        current: { address: 0x500C, count: 1, scale: 1000 },
        power: { address: 0x5016, count: 1, scale: 10 },
        energy: { address: 0x5000, count: 2, scale: 1 }
      }
    };

    const config = {
      port,
      slaveId,
      registers: customRegisters || meterConfigs[meterType] || meterConfigs.generic
    };

    // const result = await modbusService.readMeterData(deviceIP, config);
    const result = { success: false, error: 'Modbus service temporarily disabled' };

    if (result.success) {
      // Transform data for database storage
      const meterReading = {
        meterId: `${deviceIP}_${slaveId}`,
        timestamp: result.timestamp,
        voltage: result.data.voltage || 0,
        current: result.data.current || 0,
        power: result.data.power || 0,
        energy: result.data.energy || 0,
        frequency: result.data.frequency || 0,
        powerFactor: result.data.powerFactor || 0,
        quality: 'good',
        source: 'modbus',
        deviceIP,
        port,
        slaveId
      };

      res.json({
        success: true,
        data: {
          reading: meterReading,
          rawData: result.data
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to read meter data',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Modbus read meter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to read meter data',
      error: error.message
    });
  }
});

/**
 * Read raw registers from Modbus device
 * POST /api/modbus/read-registers
 */
router.post('/read-registers', requirePermission('meter:read'), async (req, res) => {
  try {
    const { 
      deviceIP, 
      startAddress, 
      count,
      registerType = 'holding', // holding or input
      port = 502, 
      slaveId = 1 
    } = req.body;

    if (!deviceIP || startAddress === undefined || !count) {
      return res.status(400).json({
        success: false,
        message: 'Device IP, start address, and count are required'
      });
    }

    let result;
    if (registerType === 'input') {
      // result = await modbusService.readInputRegisters(deviceIP, startAddress, count, { port, slaveId });
      result = { success: false, error: 'Modbus service temporarily disabled' };
    } else {
      // Default to holding registers
      // result = await modbusService.readHoldingRegisters(deviceIP, startAddress, count, { port, slaveId });
      result = { success: false, error: 'Modbus service temporarily disabled' };
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Modbus read registers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to read registers',
      error: error.message
    });
  }
});

/**
 * Get supported meter types and their register configurations
 * GET /api/modbus/meter-types
 */
router.get('/meter-types', requirePermission('meter:read'), async (req, res) => {
  try {
    const meterTypes = {
      generic: {
        name: 'Generic Energy Meter',
        description: 'Standard Modbus register layout',
        registers: {
          voltage: { address: 0, description: 'Line voltage (V)' },
          current: { address: 2, description: 'Line current (A)' },
          power: { address: 4, description: 'Active power (W)' },
          energy: { address: 6, description: 'Total energy (Wh)', size: '32-bit' },
          frequency: { address: 8, description: 'Line frequency (Hz)' },
          powerFactor: { address: 10, description: 'Power factor' }
        }
      },
      schneider: {
        name: 'Schneider Electric PowerLogic',
        description: 'Schneider PowerLogic series meters',
        registers: {
          voltage: { address: 3027, description: 'Phase voltage (V)' },
          current: { address: 3001, description: 'Phase current (A)' },
          power: { address: 3053, description: 'Total active power (kW)' },
          energy: { address: 3203, description: 'Total energy (kWh)', size: '32-bit' },
          frequency: { address: 3109, description: 'Frequency (Hz)' }
        }
      },
      abb: {
        name: 'ABB Energy Meter',
        description: 'ABB M2M series energy meters',
        registers: {
          voltage: { address: 0x5002, description: 'Phase voltage (V)' },
          current: { address: 0x500C, description: 'Phase current (A)' },
          power: { address: 0x5016, description: 'Total power (W)' },
          energy: { address: 0x5000, description: 'Total energy (Wh)', size: '32-bit' }
        }
      }
    };

    res.json({
      success: true,
      data: meterTypes
    });

  } catch (error) {
    console.error('Get meter types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meter types',
      error: error.message
    });
  }
});

module.exports = router;