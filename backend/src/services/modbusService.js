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
        voltage: { address: 0, count: 1, scale: 10 },
        current: { address: 2, count: 1, scale: 100 },
        power: { address: 4, count: 1, scale: 1 },
        energy: { address: 6, count: 2, scale: 1 }, // 32-bit value
        frequency: { address: 8, count: 1, scale: 10 },
        powerFactor: { address: 10, count: 1, scale: 1000 }
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