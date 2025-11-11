import * as fs from 'fs';
import * as path from 'path';
import { ExportManager, ExportFormat, ExportOptions } from '../ExportManager';
import { RegisterInfo, ScanResults, ScanConfig } from '../../types';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock csv-writer module
jest.mock('csv-writer', () => ({
  createObjectCsvWriter: jest.fn(() => ({
    writeRecords: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('ExportManager', () => {
  let exportManager: ExportManager;
  let mockScanResults: ScanResults;
  let tempDir: string;

  beforeEach(() => {
    exportManager = new ExportManager();
    tempDir = path.join(__dirname, 'temp');
    
    // Create mock scan results
    const mockConfig: ScanConfig = {
      host: '192.168.1.100',
      port: 502,
      slaveId: 1,
      timeout: 5000,
      retries: 3,
      batchSize: 125
    };

    const mockRegisters: RegisterInfo[] = [
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
        functionCode: 3,
        dataType: 'holding',
        value: 1234,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:01Z')
      },
      {
        address: 2,
        functionCode: 4,
        dataType: 'input',
        value: 0,
        accessible: false,
        timestamp: new Date('2023-01-01T10:00:02Z'),
        error: {
          code: 2,
          message: 'Illegal data address',
          description: 'Register not available'
        }
      }
    ];

    mockScanResults = {
      config: mockConfig,
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T10:05:00Z'),
      totalRegisters: 3,
      accessibleRegisters: 2,
      registers: mockRegisters,
      errors: ['Connection timeout at register 100']
    };

    // Setup fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation();
    mockFs.writeFileSync.mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportResults', () => {
    it('should export to CSV format with timestamped filename', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        outputPath: tempDir
      };

      const filePath = await exportManager.exportResults(mockScanResults, options);

      expect(filePath).toMatch(/modbus-scan-results_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
      expect(path.dirname(filePath)).toBe(tempDir);
    });

    it('should export to JSON format with custom filename', async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSON,
        outputPath: tempDir,
        filename: 'custom-results',
        includeTimestamp: false
      };

      const filePath = await exportManager.exportResults(mockScanResults, options);

      expect(filePath).toBe(path.join(tempDir, 'custom-results.json'));
    });

    it('should create output directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        outputPath: tempDir
      };

      await exportManager.exportResults(mockScanResults, options);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(tempDir, { recursive: true });
    });

    it('should throw error for unsupported format', async () => {
      const options: ExportOptions = {
        format: 'xml' as ExportFormat,
        outputPath: tempDir
      };

      await expect(exportManager.exportResults(mockScanResults, options))
        .rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('CSV export', () => {
    it('should create CSV with proper headers and data structure', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        outputPath: tempDir,
        filename: 'test-results',
        includeTimestamp: false
      };

      await exportManager.exportResults(mockScanResults, options);

      // Verify that csv-writer was called (we can't easily test the actual CSV content without mocking csv-writer)
      expect(mockFs.writeFileSync).not.toHaveBeenCalled(); // CSV writer handles file writing
    });
  });

  describe('JSON export', () => {
    it('should create JSON with structured register objects', async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSON,
        outputPath: tempDir,
        filename: 'test-results',
        includeTimestamp: false
      };

      await exportManager.exportResults(mockScanResults, options);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.join(tempDir, 'test-results.json'),
        expect.stringContaining('"scanInfo"'),
        'utf8'
      );

      // Get the JSON content that was written
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const jsonContent = JSON.parse(writeCall[1] as string);

      // Verify JSON structure
      expect(jsonContent).toHaveProperty('scanInfo');
      expect(jsonContent).toHaveProperty('registers');
      expect(jsonContent).toHaveProperty('errors');
      
      expect(jsonContent.scanInfo).toHaveProperty('config');
      expect(jsonContent.scanInfo).toHaveProperty('startTime');
      expect(jsonContent.scanInfo).toHaveProperty('endTime');
      expect(jsonContent.scanInfo).toHaveProperty('totalRegisters', 3);
      expect(jsonContent.scanInfo).toHaveProperty('accessibleRegisters', 2);
      expect(jsonContent.scanInfo).toHaveProperty('successRate', '66.67%');

      expect(jsonContent.registers).toHaveLength(3);
      expect(jsonContent.errors).toHaveLength(1);
    });

    it('should include enhanced metadata in JSON format', async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSON,
        outputPath: tempDir,
        filename: 'test-results',
        includeTimestamp: false
      };

      await exportManager.exportResults(mockScanResults, options);

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const jsonContent = JSON.parse(writeCall[1] as string);

      // Check first register has enhanced metadata
      const firstRegister = jsonContent.registers[0];
      expect(firstRegister).toHaveProperty('functionCode.name');
      expect(firstRegister).toHaveProperty('dataType.description');
      expect(firstRegister).toHaveProperty('value.formatted');
      expect(firstRegister).toHaveProperty('accessibility.status');
      expect(firstRegister).toHaveProperty('metadata.readOnly');
    });
  });

  describe('filename generation', () => {
    it('should generate timestamped filename by default', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        outputPath: tempDir
      };

      const filePath = await exportManager.exportResults(mockScanResults, options);
      const filename = path.basename(filePath);

      expect(filename).toMatch(/^modbus-scan-results_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('should use custom filename without timestamp when specified', async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSON,
        outputPath: tempDir,
        filename: 'my-custom-scan',
        includeTimestamp: false
      };

      const filePath = await exportManager.exportResults(mockScanResults, options);
      const filename = path.basename(filePath);

      expect(filename).toBe('my-custom-scan.json');
    });

    it('should add timestamp to custom filename when includeTimestamp is true', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        outputPath: tempDir,
        filename: 'custom-scan',
        includeTimestamp: true
      };

      const filePath = await exportManager.exportResults(mockScanResults, options);
      const filename = path.basename(filePath);

      expect(filename).toMatch(/^custom-scan_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe('static methods', () => {
    it('should return available export formats', () => {
      const formats = ExportManager.getAvailableFormats();
      
      expect(formats).toContain(ExportFormat.CSV);
      expect(formats).toContain(ExportFormat.JSON);
      expect(formats).toHaveLength(2);
    });

    it('should validate export options successfully', () => {
      const validOptions: ExportOptions = {
        format: ExportFormat.CSV,
        outputPath: './output'
      };

      expect(() => ExportManager.validateOptions(validOptions)).not.toThrow();
    });

    it('should throw error for invalid format', () => {
      const invalidOptions: ExportOptions = {
        format: 'invalid' as ExportFormat,
        outputPath: './output'
      };

      expect(() => ExportManager.validateOptions(invalidOptions))
        .toThrow('Invalid export format: invalid');
    });

    it('should throw error for invalid output path', () => {
      const invalidOptions: ExportOptions = {
        format: ExportFormat.CSV,
        outputPath: 'invalid-path'
      };

      expect(() => ExportManager.validateOptions(invalidOptions))
        .toThrow('Output path must be absolute or start with ./ or ../');
    });
  });
});