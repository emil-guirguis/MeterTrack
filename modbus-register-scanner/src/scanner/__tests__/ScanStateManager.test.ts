import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ScanStateManager, PersistentScanState } from '../ScanStateManager';
import { ScanConfig, RegisterInfo } from '../../types';
import { ScanState, ScanOptions } from '../ScannerEngine';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('ScanStateManager', () => {
  let stateManager: ScanStateManager;
  let testStateDir: string;
  let mockConfig: ScanConfig;
  let mockOptions: Required<ScanOptions>;
  let mockState: ScanState;
  let mockRegisters: RegisterInfo[];

  beforeEach(async () => {
    // Create test directory
    testStateDir = path.join(__dirname, 'test-state-manager');
    stateManager = new ScanStateManager(testStateDir);

    // Clean up test directory
    try {
      await fs.rm(testStateDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    // Create mock data
    mockConfig = {
      host: '192.168.1.100',
      port: 502,
      slaveId: 1,
      timeout: 5000,
      retries: 3,
      batchSize: 125
    };

    mockOptions = {
      startAddress: 0,
      endAddress: 100,
      functionCodes: [1, 3],
      enableBatching: true,
      progressCallback: () => {},
      registerDiscoveredCallback: () => {},
      errorCallback: () => {}
    };

    mockState = {
      currentAddress: 50,
      currentFunctionCode: 1,
      totalAddresses: 101,
      totalFunctionCodes: 2,
      scannedAddresses: 75,
      discoveredRegisters: 25,
      startTime: new Date('2023-01-01T10:00:00Z'),
      lastUpdateTime: new Date('2023-01-01T10:05:00Z'),
      isRunning: true,
      isPaused: false,
      errors: ['Test error 1', 'Test error 2']
    };

    mockRegisters = [
      {
        address: 0,
        functionCode: 1,
        dataType: 'coil',
        value: true,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:00Z')
      },
      {
        address: 1,
        functionCode: 1,
        dataType: 'coil',
        value: false,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:01Z')
      },
      {
        address: 0,
        functionCode: 3,
        dataType: 'holding',
        value: 1234,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:02Z')
      }
    ];
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testStateDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  describe('State Persistence', () => {
    it('should save and load scan state correctly', async () => {
      // Save state
      await stateManager.saveScanState(mockConfig, mockOptions, mockState, mockRegisters);

      // Verify state file exists
      expect(await stateManager.hasSavedState()).toBe(true);

      // Load state
      const loadedState = await stateManager.loadScanState();
      expect(loadedState).toBeDefined();

      // Verify loaded state matches saved state
      expect(loadedState!.config).toEqual(mockConfig);
      expect(loadedState!.state.currentAddress).toBe(mockState.currentAddress);
      expect(loadedState!.state.currentFunctionCode).toBe(mockState.currentFunctionCode);
      expect(loadedState!.state.scannedAddresses).toBe(mockState.scannedAddresses);
      expect(loadedState!.state.discoveredRegisters).toBe(mockState.discoveredRegisters);
      expect(loadedState!.state.errors).toEqual(mockState.errors);

      // Verify dates are properly restored
      expect(loadedState!.state.startTime).toBeInstanceOf(Date);
      expect(loadedState!.state.lastUpdateTime).toBeInstanceOf(Date);

      // Verify registers are properly restored
      expect(loadedState!.discoveredRegisters).toHaveLength(3);
      expect(loadedState!.discoveredRegisters[0].address).toBe(0);
      expect(loadedState!.discoveredRegisters[0].value).toBe(true);
      expect(loadedState!.discoveredRegisters[2].value).toBe(1234);

      // Verify register timestamps are restored as Date objects
      loadedState!.discoveredRegisters.forEach(register => {
        expect(register.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should return null when no saved state exists', async () => {
      const loadedState = await stateManager.loadScanState();
      expect(loadedState).toBeNull();
      expect(await stateManager.hasSavedState()).toBe(false);
    });

    it('should clear saved state correctly', async () => {
      // Save state first
      await stateManager.saveScanState(mockConfig, mockOptions, mockState, mockRegisters);
      expect(await stateManager.hasSavedState()).toBe(true);

      // Clear state
      await stateManager.clearSavedState();
      expect(await stateManager.hasSavedState()).toBe(false);

      // Verify loading returns null
      const loadedState = await stateManager.loadScanState();
      expect(loadedState).toBeNull();
    });

    it('should handle clearing non-existent state gracefully', async () => {
      // Should not throw when clearing non-existent state
      await expect(stateManager.clearSavedState()).resolves.not.toThrow();
    });
  });

  describe('State Information', () => {
    it('should provide correct saved state information', async () => {
      // Save state
      await stateManager.saveScanState(mockConfig, mockOptions, mockState, mockRegisters);

      // Get state info
      const stateInfo = await stateManager.getSavedStateInfo();

      expect(stateInfo.exists).toBe(true);
      expect(stateInfo.version).toBe('1.0.0');
      expect(stateInfo.totalRegisters).toBe(3);
      expect(stateInfo.discoveredRegisters).toBe(25);
      expect(stateInfo.lastSaved).toBeInstanceOf(Date);
      expect(stateInfo.progress).toBeCloseTo(37.13, 1); // 75/202 * 100
    });

    it('should return correct info when no state exists', async () => {
      const stateInfo = await stateManager.getSavedStateInfo();
      expect(stateInfo.exists).toBe(false);
      expect(stateInfo.lastSaved).toBeUndefined();
      expect(stateInfo.version).toBeUndefined();
    });
  });

  describe('State Validation', () => {
    it('should validate correct state as valid', async () => {
      await stateManager.saveScanState(mockConfig, mockOptions, mockState, mockRegisters);

      const validation = await stateManager.validateSavedState();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid state structure', async () => {
      // Create invalid state file
      const invalidState = {
        version: '1.0.0',
        config: null, // Missing config
        state: null, // Missing state
        discoveredRegisters: 'invalid', // Wrong type
        lastSavedTime: new Date()
      };

      await fs.mkdir(testStateDir, { recursive: true });
      await fs.writeFile(
        stateManager.getStateFilePath(),
        JSON.stringify(invalidState),
        'utf8'
      );

      const validation = await stateManager.validateSavedState();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('Missing config'))).toBe(true);
      expect(validation.errors.some(e => e.includes('Missing state'))).toBe(true);
      expect(validation.errors.some(e => e.includes('Invalid discovered registers'))).toBe(true);
    });

    it('should detect version incompatibility', async () => {
      const incompatibleState = {
        version: '0.5.0', // Incompatible version
        config: mockConfig,
        state: mockState,
        discoveredRegisters: mockRegisters,
        lastSavedTime: new Date()
      };

      await fs.mkdir(testStateDir, { recursive: true });
      await fs.writeFile(
        stateManager.getStateFilePath(),
        JSON.stringify(incompatibleState),
        'utf8'
      );

      const validation = await stateManager.validateSavedState();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Incompatible version'))).toBe(true);
    });

    it('should warn about old state files', async () => {
      // Create state with old timestamp
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const oldState = {
        version: '1.0.0',
        config: mockConfig,
        state: mockState,
        discoveredRegisters: mockRegisters,
        lastSavedTime: oldDate
      };

      await fs.mkdir(testStateDir, { recursive: true });
      await fs.writeFile(
        stateManager.getStateFilePath(),
        JSON.stringify(oldState),
        'utf8'
      );

      const validation = await stateManager.validateSavedState();
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('hours old'))).toBe(true);
    });
  });

  describe('Backup and Restore', () => {
    it('should create and restore backups correctly', async () => {
      // Save initial state
      await stateManager.saveScanState(mockConfig, mockOptions, mockState, mockRegisters);

      // Create backup
      const backupPath = await stateManager.backupState();
      expect(backupPath).toContain('.backup.');

      // Modify state
      const modifiedState = { ...mockState, currentAddress: 99 };
      await stateManager.saveScanState(mockConfig, mockOptions, modifiedState, mockRegisters);

      // Verify state was modified
      const modifiedLoadedState = await stateManager.loadScanState();
      expect(modifiedLoadedState!.state.currentAddress).toBe(99);

      // Restore from backup
      await stateManager.restoreFromBackup(backupPath);

      // Verify original state was restored
      const restoredState = await stateManager.loadScanState();
      expect(restoredState!.state.currentAddress).toBe(50);
    });

    it('should list and cleanup backups correctly', async () => {
      // Save state and create multiple backups
      await stateManager.saveScanState(mockConfig, mockOptions, mockState, mockRegisters);

      const backup1 = await stateManager.backupState();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for different timestamps
      const backup2 = await stateManager.backupState();
      await new Promise(resolve => setTimeout(resolve, 10));
      const backup3 = await stateManager.backupState();

      // List backups
      const backups = await stateManager.listBackups();
      expect(backups).toHaveLength(3);
      expect(backups).toContain(backup1);
      expect(backups).toContain(backup2);
      expect(backups).toContain(backup3);

      // Cleanup old backups (keep only 2)
      await stateManager.cleanupBackups(2);

      // Verify only 2 backups remain
      const remainingBackups = await stateManager.listBackups();
      expect(remainingBackups).toHaveLength(2);
    });

    it('should handle backup operations when no state exists', async () => {
      // Should throw when trying to backup non-existent state
      await expect(stateManager.backupState()).rejects.toThrow('No saved state to backup');

      // Should return empty list when no backups exist
      const backups = await stateManager.listBackups();
      expect(backups).toHaveLength(0);
    });
  });

  describe('Auto-save Functionality', () => {
    it('should enable and disable auto-save correctly', async () => {
      let saveCallCount = 0;
      const mockSaveCallback = async () => {
        saveCallCount++;
        await stateManager.saveScanState(mockConfig, mockOptions, mockState, mockRegisters);
      };

      // Enable auto-save with short interval
      stateManager.enableAutoSave(50, mockSaveCallback); // 50ms interval
      expect(stateManager.isAutoSaveEnabled()).toBe(true);

      // Wait for a few auto-save cycles
      await new Promise(resolve => setTimeout(resolve, 150));

      // Disable auto-save
      stateManager.disableAutoSave();
      expect(stateManager.isAutoSaveEnabled()).toBe(false);

      const callCountAfterDisable = saveCallCount;

      // Wait a bit more and verify no more saves occur
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(saveCallCount).toBe(callCountAfterDisable);

      // Verify at least some auto-saves occurred
      expect(saveCallCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Try to save to an invalid path
      const invalidStateManager = new ScanStateManager('/invalid/path/that/does/not/exist');

      await expect(
        invalidStateManager.saveScanState(mockConfig, mockOptions, mockState, mockRegisters)
      ).rejects.toThrow();
    });

    it('should handle corrupted state files', async () => {
      // Create corrupted state file
      await fs.mkdir(testStateDir, { recursive: true });
      await fs.writeFile(
        stateManager.getStateFilePath(),
        'invalid json content',
        'utf8'
      );

      // Should throw when trying to load corrupted state
      await expect(stateManager.loadScanState()).rejects.toThrow();

      // Validation should also fail
      const validation = await stateManager.validateSavedState();
      expect(validation.isValid).toBe(false);
    });
  });
});