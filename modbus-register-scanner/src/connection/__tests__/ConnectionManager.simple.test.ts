import { ConnectionManager, ConnectionState, ConnectionError } from '../ConnectionManager';
import { ScanConfig } from '../../types';

// Simple mock for basic functionality testing
const mockModbusRTU = {
  setTimeout: jest.fn(),
  connectTCP: jest.fn(),
  setID: jest.fn(),
  readCoils: jest.fn(),
  readHoldingRegisters: jest.fn(),
  close: jest.fn(),
  isOpen: false
};

jest.mock('modbus-serial', () => {
  return jest.fn().mockImplementation(() => mockModbusRTU);
});

describe('ConnectionManager - Core Functionality', () => {
  let connectionManager: ConnectionManager;
  let mockConfig: ScanConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      host: '192.168.1.100',
      port: 502,
      slaveId: 1,
      timeout: 1000,
      retries: 2,
      batchSize: 125
    };

    connectionManager = new ConnectionManager(mockConfig);
    mockModbusRTU.isOpen = false;
  });

  describe('basic connection management', () => {
    it('should initialize with correct state', () => {
      expect(connectionManager.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(connectionManager.isConnected()).toBe(false);
      expect(mockModbusRTU.setTimeout).toHaveBeenCalledWith(1000);
    });

    it('should connect successfully', async () => {
      mockModbusRTU.connectTCP.mockResolvedValue(undefined);
      mockModbusRTU.readCoils.mockResolvedValue([true]);
      mockModbusRTU.isOpen = true;

      await connectionManager.connect();

      expect(connectionManager.getState()).toBe(ConnectionState.CONNECTED);
      expect(connectionManager.isConnected()).toBe(true);
      expect(mockModbusRTU.connectTCP).toHaveBeenCalledWith('192.168.1.100', { port: 502 });
      expect(mockModbusRTU.setID).toHaveBeenCalledWith(1);
    });

    it('should handle connection failure', async () => {
      mockModbusRTU.connectTCP.mockRejectedValue(new Error('Network error'));

      await expect(connectionManager.connect()).rejects.toThrow(ConnectionError);
      expect(connectionManager.getState()).toBe(ConnectionState.ERROR);
    });

    it('should disconnect properly', async () => {
      mockModbusRTU.isOpen = true;
      mockModbusRTU.close.mockImplementation((callback) => callback());

      await connectionManager.disconnect();

      expect(connectionManager.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(mockModbusRTU.close).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should validate connection with coils', async () => {
      mockModbusRTU.connectTCP.mockResolvedValue(undefined);
      mockModbusRTU.readCoils.mockResolvedValue([true]);
      mockModbusRTU.isOpen = true;

      await connectionManager.connect();

      expect(mockModbusRTU.readCoils).toHaveBeenCalledWith(0, 1);
      expect(connectionManager.getState()).toBe(ConnectionState.CONNECTED);
    });

    it('should fallback to holding registers if coils fail', async () => {
      mockModbusRTU.connectTCP.mockResolvedValue(undefined);
      mockModbusRTU.readCoils.mockRejectedValue(new Error('Coils not supported'));
      mockModbusRTU.readHoldingRegisters.mockResolvedValue([42]);
      mockModbusRTU.isOpen = true;

      await connectionManager.connect();

      expect(mockModbusRTU.readCoils).toHaveBeenCalledWith(0, 1);
      expect(mockModbusRTU.readHoldingRegisters).toHaveBeenCalledWith(0, 1);
      expect(connectionManager.getState()).toBe(ConnectionState.CONNECTED);
    });
  });

  describe('client access', () => {
    it('should provide client when connected', async () => {
      mockModbusRTU.connectTCP.mockResolvedValue(undefined);
      mockModbusRTU.readCoils.mockResolvedValue([true]);
      mockModbusRTU.isOpen = true;

      await connectionManager.connect();
      const client = connectionManager.getClient();

      expect(client).toBe(mockModbusRTU);
    });

    it('should throw error when getting client while disconnected', () => {
      expect(() => connectionManager.getClient()).toThrow(ConnectionError);
      expect(() => connectionManager.getClient()).toThrow('Not connected to Modbus device');
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      const config = connectionManager.getConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should update configuration', async () => {
      const newConfig = { ...mockConfig, timeout: 2000, retries: 5 };
      
      await connectionManager.updateConfig(newConfig);

      expect(connectionManager.getConfig().timeout).toBe(2000);
      expect(connectionManager.getConfig().retries).toBe(5);
      expect(mockModbusRTU.setTimeout).toHaveBeenCalledWith(2000);
    });
  });
});