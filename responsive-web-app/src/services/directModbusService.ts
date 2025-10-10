// Direct access to meter data via MongoDB (same as MCP agent)
// This avoids connection conflicts by reading from the database

interface DirectMeterReading {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
  timestamp: Date;
}

export class DirectModbusService {

  async connectAndReadMeter(): Promise<DirectMeterReading> {
    console.log(`🔌 Getting real meter data from database (same as MCP agent)...`);

    // Get the latest meter reading from the database via API
    try {
      const response = await fetch('/api/meter-readings/latest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'No meter data available');
      }

      const meterData = data.data;
      
      console.log('✅ Latest meter data from database:', meterData);
      
      return {
        voltage: meterData.voltage || 0,
        current: meterData.current || 0, 
        power: meterData.power || 0,
        energy: meterData.energy || 0,
        frequency: meterData.frequency || 60,
        powerFactor: meterData.powerFactor || 0,
        timestamp: new Date(meterData.timestamp || Date.now())
      };

    } catch (error) {
      console.error('Failed to get meter data from database:', error);
      throw error;
    }
  }
}

export const directModbusService = new DirectModbusService();