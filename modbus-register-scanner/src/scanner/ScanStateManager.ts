import * as fs from 'fs/promises';
import * as path from 'path';
import { RegisterInfo, ScanConfig } from '../types';
import { ScanState, ScanOptions } from './ScannerEngine';

/**
 * Persistent scan state for resumption
 */
export interface PersistentScanState {
  config: ScanConfig;
  options: Required<ScanOptions>;
  state: ScanState;
  discoveredRegisters: RegisterInfo[];
  lastSavedTime: Date;
  version: string; // For compatibility checking
}

/**
 * ScanStateManager handles persistence and restoration of scan state
 * to enable scan interruption and resumption capabilities
 */
export class ScanStateManager {
  private readonly stateFilePath: string;
  private readonly version = '1.0.0';
  private autoSaveInterval?: NodeJS.Timeout;
  private autoSaveEnabled = false;

  constructor(stateDirectory: string = './scan-state') {
    this.stateFilePath = path.join(stateDirectory, 'scan-state.json');
  }

  /**
   * Save current scan state to persistent storage
   */
  public async saveScanState(
    config: ScanConfig,
    options: Required<ScanOptions>,
    state: ScanState,
    discoveredRegisters: RegisterInfo[]
  ): Promise<void> {
    try {
      // Ensure directory exists
      const directory = path.dirname(this.stateFilePath);
      await fs.mkdir(directory, { recursive: true });

      // Create persistent state object
      const persistentState: PersistentScanState = {
        config,
        options: {
          ...options,
          // Remove callback functions as they can't be serialized
          progressCallback: undefined as any,
          registerDiscoveredCallback: undefined as any,
          errorCallback: undefined as any
        },
        state: {
          ...state,
          // Ensure dates are properly serialized
          startTime: state.startTime,
          lastUpdateTime: state.lastUpdateTime
        },
        discoveredRegisters,
        lastSavedTime: new Date(),
        version: this.version
      };

      // Write to file with atomic operation (write to temp file then rename)
      const tempFilePath = `${this.stateFilePath}.tmp`;
      await fs.writeFile(tempFilePath, JSON.stringify(persistentState, null, 2), 'utf8');
      await fs.rename(tempFilePath, this.stateFilePath);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to save scan state: ${message}`);
    }
  }

  /**
   * Load scan state from persistent storage
   */
  public async loadScanState(): Promise<PersistentScanState | null> {
    try {
      // Check if state file exists
      try {
        await fs.access(this.stateFilePath);
      } catch {
        return null; // File doesn't exist
      }

      // Read and parse state file
      const stateData = await fs.readFile(this.stateFilePath, 'utf8');
      const persistentState = JSON.parse(stateData) as PersistentScanState;

      // Validate version compatibility
      if (!this.isVersionCompatible(persistentState.version)) {
        throw new Error(`Incompatible scan state version: ${persistentState.version}. Current version: ${this.version}`);
      }

      // Convert date strings back to Date objects
      persistentState.state.startTime = new Date(persistentState.state.startTime);
      persistentState.state.lastUpdateTime = new Date(persistentState.state.lastUpdateTime);
      persistentState.lastSavedTime = new Date(persistentState.lastSavedTime);

      // Convert register timestamps
      persistentState.discoveredRegisters.forEach(register => {
        register.timestamp = new Date(register.timestamp);
      });

      return persistentState;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load scan state: ${message}`);
    }
  }

  /**
   * Check if a saved state exists
   */
  public async hasSavedState(): Promise<boolean> {
    try {
      await fs.access(this.stateFilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete saved scan state
   */
  public async clearSavedState(): Promise<void> {
    try {
      await fs.unlink(this.stateFilePath);
    } catch (error) {
      // Ignore error if file doesn't exist
      if ((error as any)?.code !== 'ENOENT') {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to clear scan state: ${message}`);
      }
    }
  }

  /**
   * Get information about saved state without loading it
   */
  public async getSavedStateInfo(): Promise<{
    exists: boolean;
    lastSaved?: Date;
    version?: string;
    totalRegisters?: number;
    discoveredRegisters?: number;
    progress?: number;
  }> {
    try {
      if (!(await this.hasSavedState())) {
        return { exists: false };
      }

      const stateData = await fs.readFile(this.stateFilePath, 'utf8');
      const persistentState = JSON.parse(stateData) as PersistentScanState;

      const totalOperations = persistentState.state.totalAddresses * persistentState.state.totalFunctionCodes;
      const progress = totalOperations > 0 ? (persistentState.state.scannedAddresses / totalOperations) * 100 : 0;

      return {
        exists: true,
        lastSaved: new Date(persistentState.lastSavedTime),
        version: persistentState.version,
        totalRegisters: persistentState.discoveredRegisters.length,
        discoveredRegisters: persistentState.state.discoveredRegisters,
        progress: Math.round(progress * 100) / 100
      };

    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Enable automatic saving of scan state at regular intervals
   */
  public enableAutoSave(
    intervalMs: number = 30000, // 30 seconds default
    saveCallback: () => Promise<void>
  ): void {
    this.disableAutoSave(); // Clear any existing interval

    this.autoSaveInterval = setInterval(async () => {
      try {
        await saveCallback();
      } catch (error) {
        console.error('Auto-save failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }, intervalMs);

    this.autoSaveEnabled = true;
  }

  /**
   * Disable automatic saving
   */
  public disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = undefined;
    }
    this.autoSaveEnabled = false;
  }

  /**
   * Check if auto-save is enabled
   */
  public isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(savedVersion: string): boolean {
    // For now, only exact version match is supported
    // In the future, this could be more sophisticated
    return savedVersion === this.version;
  }

  /**
   * Create a backup of the current state file
   */
  public async backupState(): Promise<string> {
    try {
      if (!(await this.hasSavedState())) {
        throw new Error('No saved state to backup');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${this.stateFilePath}.backup.${timestamp}`;
      
      await fs.copyFile(this.stateFilePath, backupPath);
      return backupPath;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to backup scan state: ${message}`);
    }
  }

  /**
   * Restore state from a backup file
   */
  public async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      // Verify backup file exists
      await fs.access(backupPath);
      
      // Copy backup to main state file
      await fs.copyFile(backupPath, this.stateFilePath);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to restore from backup: ${message}`);
    }
  }

  /**
   * List available backup files
   */
  public async listBackups(): Promise<string[]> {
    try {
      const directory = path.dirname(this.stateFilePath);
      const files = await fs.readdir(directory);
      const stateFileName = path.basename(this.stateFilePath);
      
      return files
        .filter(file => file.startsWith(`${stateFileName}.backup.`))
        .map(file => path.join(directory, file))
        .sort()
        .reverse(); // Most recent first

    } catch (error) {
      return []; // Return empty array if directory doesn't exist or other error
    }
  }

  /**
   * Clean up old backup files (keep only the most recent N backups)
   */
  public async cleanupBackups(keepCount: number = 5): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= keepCount) {
        return; // Nothing to clean up
      }

      // Delete old backups (keep the most recent ones)
      const toDelete = backups.slice(keepCount);
      
      for (const backupPath of toDelete) {
        try {
          await fs.unlink(backupPath);
        } catch (error) {
          // Continue with other files if one fails
          console.warn(`Failed to delete backup ${backupPath}:`, error);
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to cleanup backups: ${message}`);
    }
  }

  /**
   * Get the state file path
   */
  public getStateFilePath(): string {
    return this.stateFilePath;
  }

  /**
   * Validate a saved state for integrity
   */
  public async validateSavedState(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const persistentState = await this.loadScanState();
      
      if (!persistentState) {
        errors.push('No saved state found');
        return { isValid: false, errors, warnings };
      }

      // Check required fields
      if (!persistentState.config) {
        errors.push('Missing config in saved state');
      }
      
      if (!persistentState.state) {
        errors.push('Missing state in saved state');
      }
      
      if (!Array.isArray(persistentState.discoveredRegisters)) {
        errors.push('Invalid discovered registers in saved state');
      }

      // Check version compatibility
      if (!this.isVersionCompatible(persistentState.version)) {
        errors.push(`Incompatible version: ${persistentState.version}`);
      }

      // Check state consistency
      if (persistentState.state && persistentState.discoveredRegisters) {
        const actualDiscovered = persistentState.discoveredRegisters.filter(reg => reg.accessible).length;
        if (actualDiscovered !== persistentState.state.discoveredRegisters) {
          warnings.push('Discovered register count mismatch in state');
        }
      }

      // Check if state is too old (more than 24 hours)
      if (persistentState.lastSavedTime) {
        const ageHours = (Date.now() - new Date(persistentState.lastSavedTime).getTime()) / (1000 * 60 * 60);
        if (ageHours > 24) {
          warnings.push(`Saved state is ${Math.round(ageHours)} hours old`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      errors.push(`Failed to validate state: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }
}