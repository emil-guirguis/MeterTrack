import { useState } from 'react';

export interface ModbusConfig {
  deviceIP: string;
  port: number;
  slaveId: number;
  meterType: string;
}

export interface ModbusReading {
  voltage?: number;
  current?: number;
  power?: number;
  energy?: number;
  frequency?: number;
  powerFactor?: number;
}

export interface ModbusResult {
  success: boolean;
  data?: {
    reading?: any;
    rawData?: ModbusReading;
    connected?: boolean;
    deviceIP?: string;
    timestamp?: string;
  };
  error?: string;
  message?: string;
}

class ModbusService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<ModbusResult> {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      const response = await fetch(`${this.baseURL}/modbus${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async testConnection(config: ModbusConfig): Promise<ModbusResult> {
    return this.request('/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async readMeterData(config: ModbusConfig & { customRegisters?: any }): Promise<ModbusResult> {
    return this.request('/read-meter', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async readRegisters(config: {
    deviceIP: string;
    startAddress: number;
    count: number;
    registerType?: 'holding' | 'input';
    port?: number;
    slaveId?: number;
  }): Promise<ModbusResult> {
    return this.request('/read-registers', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getMeterTypes(): Promise<ModbusResult> {
    return this.request('/meter-types', {
      method: 'GET',
    });
  }
}

export const modbusService = new ModbusService();

// React hook for Modbus operations
export const useModbus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async (config: ModbusConfig) => {
    setLoading(true);
    setError(null);
    try {
      const result = await modbusService.testConnection(config);
      if (!result.success) {
        setError(result.error || result.message || 'Connection test failed');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const readMeterData = async (config: ModbusConfig & { customRegisters?: any }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await modbusService.readMeterData(config);
      if (!result.success) {
        setError(result.error || result.message || 'Failed to read meter data');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to read meter data';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const readRegisters = async (config: {
    deviceIP: string;
    startAddress: number;
    count: number;
    registerType?: 'holding' | 'input';
    port?: number;
    slaveId?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await modbusService.readRegisters(config);
      if (!result.success) {
        setError(result.error || result.message || 'Failed to read registers');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to read registers';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const getMeterTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await modbusService.getMeterTypes();
      if (!result.success) {
        setError(result.error || result.message || 'Failed to get meter types');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get meter types';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    testConnection,
    readMeterData,
    readRegisters,
    getMeterTypes,
  };
};

export default modbusService;