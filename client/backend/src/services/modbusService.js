// CommonJS wrapper for the TypeScript ModbusService
// This allows JavaScript files to require the TypeScript service

const path = require('path');

// Cache for the imported service
let modbusService = null;

async function getModbusService() {
  if (!modbusService) {
    try {
      // Dynamic import for ES6 module from the compiled dist folder
      const distPath = path.resolve(__dirname, '../../dist/services/modbusService.js');
      const module = await import(distPath);
      modbusService = module.default;
    } catch (error) {
      console.error('Failed to import ModbusService:', error);
      throw new Error('ModbusService not available. Make sure TypeScript is compiled.');
    }
  }
  return modbusService;
}

// Export CommonJS-compatible interface
module.exports = {
  async readMeterData(deviceIP, config = {}) {
    const service = await getModbusService();
    return service.readMeterData(deviceIP, config);
  },

  async readInputRegisters(deviceIP, startAddress, count, options = {}) {
    const service = await getModbusService();
    return service.readInputRegisters(deviceIP, startAddress, count, options);
  },

  async testConnection(deviceIP, port = 502, slaveId = 1) {
    const service = await getModbusService();
    return service.testConnection(deviceIP, port, slaveId);
  },

  async connectDevice(deviceIP, port = 502, slaveId = 1) {
    const service = await getModbusService();
    return service.connectDevice(deviceIP, port, slaveId);
  },

  closeAllConnections() {
    if (modbusService) {
      modbusService.closeAllConnections();
    }
  },

  closeConnection(deviceIP, port = 502, slaveId = 1) {
    if (modbusService) {
      modbusService.closeConnection(deviceIP, port, slaveId);
    }
  },

  getPoolStats() {
    if (modbusService) {
      return modbusService.getPoolStats();
    }
    return { totalConnections: 0, activeConnections: 0, idleConnections: 0 };
  }
};