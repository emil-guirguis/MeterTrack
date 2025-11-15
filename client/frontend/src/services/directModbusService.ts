// Fetch latest real meter data from backend API (PostgreSQL-backed)
// Uses the same data the MCP agent writes into the meterreadings table

interface DirectMeterReading {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
  timestamp: Date;
  // Optional metadata from the reading
  deviceIP?: string | null;
  ip?: string | null;
  port?: number | string | null;
  slaveId?: number | string | null;
  source?: string | null;
}

export class DirectModbusService {

  async connectAndReadMeter(): Promise<DirectMeterReading> {
    console.log(`🔌 Getting real meter data from backend API (PG)…`);

    // Get the latest meter reading from the database via API
    try {
      // Prefer alias without hyphen to match frontend service paths in this app
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      // Attach bearer token if available
      try {
        const { tokenStorage } = await import('../utils/tokenStorage');
        const token = tokenStorage.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}

      const response = await fetch('/api/meterreadings/latest', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'No meter data available');
      }

      // API returns an array of latest readings (one per meter); pick the first
      const first = Array.isArray(data.data) ? (data.data[0] || null) : data.data;
      if (!first) {
        throw new Error('No latest meter readings found');
      }

      const toNum = (v: any, fallback = 0): number => {
        if (v === null || v === undefined) return fallback;
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        return Number.isFinite(n) ? n : fallback;
      };

      const voltage = toNum(first.voltage ?? first.V, 0);
      const current = toNum(first.current ?? first.A, 0);
      // Prefer watts if present, else derive from kW
      const power = toNum(first.power, NaN);
      const powerKW = toNum(first.kW, NaN);
      const resolvedPower = Number.isFinite(power) ? power : (Number.isFinite(powerKW) ? powerKW * 1000 : 0);
      const energyKWh = toNum(first.kWh ?? first.energy, 0);
      const frequency = toNum(first.frequency ?? first.frequencyHz, 60);
      const powerFactor = toNum(first.powerFactor ?? first.dPF, 0);
      const tsRaw = first.timestamp ?? first.createdat ?? first.createdAt ?? Date.now();
      
      console.log('✅ Latest meter data from backend:', first);
      
      return {
        voltage,
        current,
        power: resolvedPower,
        energy: energyKWh,
        frequency,
        powerFactor,
        timestamp: new Date(tsRaw),
        deviceIP: first.deviceIP ?? null,
        ip: first.ip ?? null,
        port: first.port ?? null,
        slaveId: first.slaveId ?? null,
        source: first.source ?? null
      };

    } catch (error) {
      console.error('Failed to get meter data from backend:', error);
      throw error;
    }
  }
}

export const directModbusService = new DirectModbusService();