const ModbusRTU = require("modbus-serial");

class ModbusService {
  constructor() {
    this.clients = new Map(); // Store multiple client connections
  }

  /**
   * Connect to a Modbus TCP device
   * @param {string} deviceIP - IP address of the device
   * @param {number} port - Modbus TCP port (default 502)
   * @param {number} slaveId - Slave ID of the device
   * @returns {Promise<ModbusRTU>} - Modbus client instance
   */
  async connectDevice(deviceIP, port = 502, slaveId = 1) {
    const clientKey = `${deviceIP}:${port}:${slaveId}`;
    
    if (this.clients.has(clientKey)) {
      return this.clients.get(clientKey);
    }

    const client = new ModbusRTU();
    try {
      await client.connectTCP(deviceIP, { port });
      client.setID(slaveId);
      client.setTimeout(5000); // 5 second timeout
      
      this.clients.set(clientKey, client);
      return client;
    } catch (error) {
      throw new Error(`Failed to connect to Modbus device at ${deviceIP}:${port} - ${error.message}`);
    }
  }

  /**
   * Read energy meter data from a Modbus device
   * @param {string} deviceIP - IP address of the meter
   * @param {object} config - Configuration object
   * @returns {Promise<object>} - Meter reading data
   */
  async readMeterData(deviceIP, config = {}) {
    const {
      port = 502,
      slaveId = 1,
      registers = {
        // REAL METER MAPPING - Based on actual device at 10.10.10.11:502
        voltage: { address: 5, count: 1, scale: 200 },    // Register 5, scale by 200
        current: { address: 6, count: 1, scale: 100 },    // Register 6, scale by 100  
        power: { address: 7, count: 1, scale: 1 },        // Register 7, direct watts
        energy: { address: 8, count: 1, scale: 1 },       // Register 8 estimate
        frequency: { address: 0, count: 1, scale: 10 },   // Register 0, scale by 10
        powerFactor: { address: 9, count: 1, scale: 1000 }, // Register 9 estimate
        
        // Phase voltages
        phaseAVoltage: { address: 12, count: 1, scale: 10 },
        phaseBVoltage: { address: 14, count: 1, scale: 10 },
        phaseCVoltage: { address: 16, count: 1, scale: 10 },
        
        // Phase currents
        phaseACurrent: { address: 18, count: 1, scale: 100 },
        phaseBCurrent: { address: 20, count: 1, scale: 100 },
        phaseCCurrent: { address: 22, count: 1, scale: 100 },
        
        // Phase powers
        phaseAPower: { address: 24, count: 1, scale: 1 },
        phaseBPower: { address: 26, count: 1, scale: 1 },
        phaseCPower: { address: 28, count: 1, scale: 1 },
        
        // Line-to-line voltages
        lineToLineVoltageAB: { address: 30, count: 1, scale: 10 },
        lineToLineVoltageBC: { address: 32, count: 1, scale: 10 },
        lineToLineVoltageCA: { address: 34, count: 1, scale: 10 },
        
        // Power measurements
        totalReactivePower: { address: 36, count: 1, scale: 1 },
        totalApparentPower: { address: 38, count: 1, scale: 1 },
        
        // Energy measurements
        totalActiveEnergyWh: { address: 40, count: 2, scale: 1 },
        totalReactiveEnergyVARh: { address: 42, count: 2, scale: 1 },
        totalApparentEnergyVAh: { address: 44, count: 2, scale: 1 },
        
        // Additional measurements
        temperatureC: { address: 46, count: 1, scale: 10 },
        neutralCurrent: { address: 48, count: 1, scale: 100 },
        
        // Power factor per phase
        phaseAPowerFactor: { address: 50, count: 1, scale: 1000 },
        phaseBPowerFactor: { address: 52, count: 1, scale: 1000 },
        phaseCPowerFactor: { address: 54, count: 1, scale: 1000 },
        
        // Harmonic distortion
        voltageThd: { address: 56, count: 1, scale: 100 },
        currentThd: { address: 58, count: 1, scale: 100 },
        
        // Demand measurements
        maxDemandKW: { address: 60, count: 1, scale: 1 },
        maxDemandKVAR: { address: 62, count: 1, scale: 1 },
        maxDemandKVA: { address: 64, count: 1, scale: 1 }
      }
    } = config;

    let client;
    try {
      client = await this.connectDevice(deviceIP, port, slaveId);
      
      const readings = {};
      
      // Read each register type
      for (const [key, regConfig] of Object.entries(registers)) {
        try {
          const result = await client.readHoldingRegisters(regConfig.address, regConfig.count);
          
          if (regConfig.count === 1) {
            // Single register
            readings[key] = result.data[0] / regConfig.scale;
          } else if (regConfig.count === 2) {
            // 32-bit value (high word first)
            readings[key] = ((result.data[0] << 16) + result.data[1]) / regConfig.scale;
          } else {
            // Multiple registers
            readings[key] = result.data.map(val => val / regConfig.scale);
          }
        } catch (regError) {
          console.warn(`Failed to read ${key} from ${deviceIP}: ${regError.message}`);
          readings[key] = null;
        }
      }

      return {
        deviceIP,
        timestamp: new Date(),
        success: true,
        data: readings
      };

    } catch (error) {
      return {
        deviceIP,
        timestamp: new Date(),
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Read input registers (for some meter types)
   * @param {string} deviceIP - IP address of the device
   * @param {number} startAddress - Starting register address
   * @param {number} count - Number of registers to read
   * @param {object} options - Connection options
   * @returns {Promise<object>} - Register data
   */
  async readInputRegisters(deviceIP, startAddress, count, options = {}) {
    const { port = 502, slaveId = 1 } = options;
    
    let client;
    try {
      client = await this.connectDevice(deviceIP, port, slaveId);
      const result = await client.readInputRegisters(startAddress, count);
      
      return {
        deviceIP,
        timestamp: new Date(),
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        deviceIP,
        timestamp: new Date(),
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Test connection to a Modbus device
   * @param {string} deviceIP - IP address of the device
   * @param {number} port - Modbus TCP port
   * @param {number} slaveId - Slave ID
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection(deviceIP, port = 502, slaveId = 1) {
    let client;
    try {
      client = await this.connectDevice(deviceIP, port, slaveId);
      // Try to read a single register to test connection
      await client.readHoldingRegisters(0, 1);
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${deviceIP}:${port} - ${error.message}`);
      return false;
    }
  }

  /**
   * Close all Modbus connections
   */
  closeAllConnections() {
    for (const [key, client] of this.clients) {
      try {
        client.close();
      } catch (error) {
        console.warn(`Error closing connection ${key}: ${error.message}`);
      }
    }
    this.clients.clear();
  }

  /**
   * Close specific connection
   * @param {string} deviceIP - IP address
   * @param {number} port - Port number
   * @param {number} slaveId - Slave ID
   */
  closeConnection(deviceIP, port = 502, slaveId = 1) {
    const clientKey = `${deviceIP}:${port}:${slaveId}`;
    if (this.clients.has(clientKey)) {
      try {
        this.clients.get(clientKey).close();
        this.clients.delete(clientKey);
      } catch (error) {
        console.warn(`Error closing connection ${clientKey}: ${error.message}`);
      }
    }
  }
}

// Singleton instance
const modbusService = new ModbusService();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing Modbus connections...');
  modbusService.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing Modbus connections...');
  modbusService.closeAllConnections();
  process.exit(0);
});

module.exports = modbusService;