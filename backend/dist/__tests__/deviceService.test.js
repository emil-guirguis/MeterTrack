"use strict";
const DeviceService = require('../services/deviceService');
const db = require('../config/database');
// Mock the database module
jest.mock('../config/database');
describe('DeviceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('validateDeviceInput', () => {
        it('should validate valid device data', () => {
            const validData = { name: 'Test Device', description: 'Test Description' };
            const errors = DeviceService.validateDeviceInput(validData);
            expect(errors).toEqual([]);
        });
        it('should require name for new devices', () => {
            const invalidData = { description: 'Test Description' };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Device name is required');
        });
        it('should allow missing name for updates', () => {
            const updateData = { description: 'Updated Description' };
            const errors = DeviceService.validateDeviceInput(updateData, true);
            expect(errors).toEqual([]);
        });
        it('should reject empty name', () => {
            const invalidData = { name: '' };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Device name is required');
        });
        it('should reject name with only whitespace', () => {
            const invalidData = { name: '   ' };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Device name cannot be empty');
        });
        it('should reject name with leading/trailing whitespace', () => {
            const invalidData = { name: ' Test Device ' };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Device name cannot have leading or trailing whitespace');
        });
        it('should reject name exceeding 100 characters', () => {
            const longName = 'a'.repeat(101);
            const invalidData = { name: longName };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Device name cannot exceed 100 characters');
        });
        it('should reject non-string name', () => {
            const invalidData = { name: 123 };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Device name must be a string');
        });
        it('should reject non-string description', () => {
            const invalidData = { name: 'Test Device', description: 123 };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Device description must be a string');
        });
        it('should reject description exceeding 255 characters', () => {
            const longDescription = 'a'.repeat(256);
            const invalidData = { name: 'Test Device', description: longDescription };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Device description cannot exceed 255 characters');
        });
        it('should allow null description', () => {
            const validData = { name: 'Test Device', description: null };
            const errors = DeviceService.validateDeviceInput(validData);
            expect(errors).toEqual([]);
        });
        it('should reject unexpected fields', () => {
            const invalidData = { name: 'Test Device', invalidField: 'value' };
            const errors = DeviceService.validateDeviceInput(invalidData);
            expect(errors).toContain('Unexpected fields: invalidField');
        });
    });
    describe('getAllDevices', () => {
        it('should return formatted devices', async () => {
            const mockRows = [
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Device 1',
                    description: 'Description 1',
                    createdat: '2023-01-01T00:00:00Z',
                    updatedat: '2023-01-01T00:00:00Z'
                },
                {
                    id: '123e4567-e89b-12d3-a456-426614174001',
                    name: 'Device 2',
                    description: null,
                    createdat: '2023-01-02T00:00:00Z',
                    updatedat: '2023-01-02T00:00:00Z'
                }
            ];
            db.query.mockResolvedValue({ rows: mockRows });
            const result = await DeviceService.getAllDevices();
            expect(db.query).toHaveBeenCalledWith('SELECT * FROM devices ORDER BY name ASC');
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Device 1',
                description: 'Description 1',
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z'
            });
            expect(result[1]).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Device 2',
                description: null,
                createdAt: '2023-01-02T00:00:00Z',
                updatedAt: '2023-01-02T00:00:00Z'
            });
        });
        it('should handle database errors', async () => {
            const dbError = new Error('Database connection failed');
            db.query.mockRejectedValue(dbError);
            await expect(DeviceService.getAllDevices()).rejects.toThrow('Database connection failed');
        });
    });
    describe('getDeviceById', () => {
        it('should return formatted device when found', async () => {
            const mockRow = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Device',
                description: 'Test Description',
                createdat: '2023-01-01T00:00:00Z',
                updatedat: '2023-01-01T00:00:00Z'
            };
            db.query.mockResolvedValue({ rows: [mockRow] });
            const result = await DeviceService.getDeviceById('123e4567-e89b-12d3-a456-426614174000');
            expect(db.query).toHaveBeenCalledWith('SELECT * FROM devices WHERE id = $1', ['123e4567-e89b-12d3-a456-426614174000']);
            expect(result).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Device',
                description: 'Test Description',
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z'
            });
        });
        it('should return null when device not found', async () => {
            db.query.mockResolvedValue({ rows: [] });
            const result = await DeviceService.getDeviceById('nonexistent-id');
            expect(result).toBeNull();
        });
        it('should throw validation error for missing ID', async () => {
            await expect(DeviceService.getDeviceById()).rejects.toThrow('Validation failed: Device ID is required');
        });
        it('should handle database errors', async () => {
            const dbError = new Error('Database error');
            db.query.mockRejectedValue(dbError);
            await expect(DeviceService.getDeviceById('test-id')).rejects.toThrow('Database error during device retrieval');
        });
    });
    describe('createDevice', () => {
        it('should create device with valid data', async () => {
            const deviceData = { name: 'New Device', description: 'New Description' };
            const mockRow = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Device',
                description: 'New Description',
                createdat: '2023-01-01T00:00:00Z',
                updatedat: '2023-01-01T00:00:00Z'
            };
            db.query.mockResolvedValue({ rows: [mockRow] });
            const result = await DeviceService.createDevice(deviceData);
            expect(db.query).toHaveBeenCalledWith('INSERT INTO devices (name, description) VALUES ($1, $2) RETURNING *', ['New Device', 'New Description']);
            expect(result).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Device',
                description: 'New Description',
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z'
            });
        });
        it('should create device with null description', async () => {
            const deviceData = { name: 'New Device' };
            const mockRow = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Device',
                description: null,
                createdat: '2023-01-01T00:00:00Z',
                updatedat: '2023-01-01T00:00:00Z'
            };
            db.query.mockResolvedValue({ rows: [mockRow] });
            const result = await DeviceService.createDevice(deviceData);
            expect(db.query).toHaveBeenCalledWith('INSERT INTO devices (name, description) VALUES ($1, $2) RETURNING *', ['New Device', null]);
        });
        it('should reject name with leading/trailing whitespace', async () => {
            const deviceData = { name: '  New Device  ', description: 'Description' };
            await expect(DeviceService.createDevice(deviceData)).rejects.toThrow('Device name cannot have leading or trailing whitespace');
        });
        it('should throw validation error for invalid data', async () => {
            const invalidData = { name: '' };
            await expect(DeviceService.createDevice(invalidData)).rejects.toThrow('Validation failed: Device name is required');
        });
        it('should handle duplicate name error', async () => {
            const deviceData = { name: 'Existing Device' };
            const dbError = new Error('Duplicate key');
            dbError.code = '23505';
            db.query.mockRejectedValue(dbError);
            await expect(DeviceService.createDevice(deviceData)).rejects.toThrow('Device name already exists');
        });
        it('should handle generic database errors', async () => {
            const deviceData = { name: 'New Device' };
            const dbError = new Error('Database error');
            db.query.mockRejectedValue(dbError);
            await expect(DeviceService.createDevice(deviceData)).rejects.toThrow('Database error during device creation');
        });
    });
    describe('updateDevice', () => {
        it('should update device with valid data', async () => {
            const updateData = { name: 'Updated Device', description: 'Updated Description' };
            const mockRow = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Device',
                description: 'Updated Description',
                createdat: '2023-01-01T00:00:00Z',
                updatedat: '2023-01-02T00:00:00Z'
            };
            db.query.mockResolvedValue({ rows: [mockRow] });
            const result = await DeviceService.updateDevice('123e4567-e89b-12d3-a456-426614174000', updateData);
            expect(db.query).toHaveBeenCalledWith('UPDATE devices SET name = $1, description = $2, updatedat = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *', ['Updated Device', 'Updated Description', '123e4567-e89b-12d3-a456-426614174000']);
            expect(result).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Device',
                description: 'Updated Description',
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-02T00:00:00Z'
            });
        });
        it('should update only name when description not provided', async () => {
            const updateData = { name: 'Updated Device' };
            const mockRow = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Device',
                description: 'Original Description',
                createdat: '2023-01-01T00:00:00Z',
                updatedat: '2023-01-02T00:00:00Z'
            };
            db.query.mockResolvedValue({ rows: [mockRow] });
            await DeviceService.updateDevice('123e4567-e89b-12d3-a456-426614174000', updateData);
            expect(db.query).toHaveBeenCalledWith('UPDATE devices SET name = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', ['Updated Device', '123e4567-e89b-12d3-a456-426614174000']);
        });
        it('should update only description when name not provided', async () => {
            const updateData = { description: 'Updated Description' };
            const mockRow = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Original Device',
                description: 'Updated Description',
                createdat: '2023-01-01T00:00:00Z',
                updatedat: '2023-01-02T00:00:00Z'
            };
            db.query.mockResolvedValue({ rows: [mockRow] });
            await DeviceService.updateDevice('123e4567-e89b-12d3-a456-426614174000', updateData);
            expect(db.query).toHaveBeenCalledWith('UPDATE devices SET description = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', ['Updated Description', '123e4567-e89b-12d3-a456-426614174000']);
        });
        it('should return null when device not found', async () => {
            const updateData = { name: 'Updated Device' };
            db.query.mockResolvedValue({ rows: [] });
            const result = await DeviceService.updateDevice('nonexistent-id', updateData);
            expect(result).toBeNull();
        });
        it('should throw validation error for missing ID', async () => {
            const updateData = { name: 'Updated Device' };
            await expect(DeviceService.updateDevice(null, updateData)).rejects.toThrow('Validation failed: Device ID is required');
        });
        it('should throw validation error for no update fields', async () => {
            const updateData = {};
            await expect(DeviceService.updateDevice('test-id', updateData)).rejects.toThrow('Validation failed: No valid fields provided for update');
        });
        it('should throw validation error for invalid update data', async () => {
            const updateData = { name: '' };
            await expect(DeviceService.updateDevice('test-id', updateData)).rejects.toThrow('Validation failed: Device name is required');
        });
        it('should handle duplicate name error', async () => {
            const updateData = { name: 'Existing Device' };
            const dbError = new Error('Duplicate key');
            dbError.code = '23505';
            db.query.mockRejectedValue(dbError);
            await expect(DeviceService.updateDevice('test-id', updateData)).rejects.toThrow('Device name already exists');
        });
    });
    describe('deleteDevice', () => {
        it('should delete existing device', async () => {
            const mockRow = { id: '123e4567-e89b-12d3-a456-426614174000' };
            db.query.mockResolvedValue({ rows: [mockRow] });
            const result = await DeviceService.deleteDevice('123e4567-e89b-12d3-a456-426614174000');
            expect(db.query).toHaveBeenCalledWith('DELETE FROM devices WHERE id = $1 RETURNING *', ['123e4567-e89b-12d3-a456-426614174000']);
            expect(result).toBe(true);
        });
        it('should return false when device not found', async () => {
            db.query.mockResolvedValue({ rows: [] });
            const result = await DeviceService.deleteDevice('nonexistent-id');
            expect(result).toBe(false);
        });
        it('should throw validation error for missing ID', async () => {
            await expect(DeviceService.deleteDevice()).rejects.toThrow('Validation failed: Device ID is required');
        });
        it('should handle foreign key constraint error', async () => {
            const dbError = new Error('Foreign key constraint');
            dbError.code = '23503';
            db.query.mockRejectedValue(dbError);
            await expect(DeviceService.deleteDevice('test-id')).rejects.toThrow('Cannot delete device: it is referenced by other records');
        });
    });
    describe('formatDevice', () => {
        it('should format device data correctly', () => {
            const dbRow = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Device',
                description: 'Test Description',
                createdat: '2023-01-01T00:00:00Z',
                updatedat: '2023-01-01T00:00:00Z'
            };
            const result = DeviceService.formatDevice(dbRow);
            expect(result).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Test Device',
                description: 'Test Description',
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z'
            });
        });
        it('should return null for null input', () => {
            const result = DeviceService.formatDevice(null);
            expect(result).toBeNull();
        });
        it('should handle undefined input', () => {
            const result = DeviceService.formatDevice(undefined);
            expect(result).toBeNull();
        });
    });
    describe('error handling utilities', () => {
        describe('createValidationError', () => {
            it('should create validation error with correct properties', () => {
                const errors = ['Error 1', 'Error 2'];
                const error = DeviceService.createValidationError(errors);
                expect(error.message).toBe('Validation failed: Error 1, Error 2');
                expect(error.code).toBe('VALIDATION_ERROR');
                expect(error.details).toEqual(errors);
            });
        });
        describe('createDatabaseError', () => {
            it('should create duplicate name error', () => {
                const originalError = { code: '23505' };
                const error = DeviceService.createDatabaseError(originalError, 'test operation');
                expect(error.message).toBe('Device name already exists');
                expect(error.code).toBe('DUPLICATE_NAME');
                expect(error.originalError).toBe(originalError);
            });
            it('should create foreign key violation error', () => {
                const originalError = { code: '23503' };
                const error = DeviceService.createDatabaseError(originalError, 'test operation');
                expect(error.message).toBe('Cannot delete device: it is referenced by other records');
                expect(error.code).toBe('FOREIGN_KEY_VIOLATION');
            });
            it('should create data too long error', () => {
                const originalError = { code: '22001' };
                const error = DeviceService.createDatabaseError(originalError, 'test operation');
                expect(error.message).toBe('Input data exceeds maximum length');
                expect(error.code).toBe('DATA_TOO_LONG');
            });
            it('should create generic database error', () => {
                const originalError = { code: 'UNKNOWN' };
                const error = DeviceService.createDatabaseError(originalError, 'test operation');
                expect(error.message).toBe('Database error during test operation');
                expect(error.code).toBe('DATABASE_ERROR');
            });
        });
    });
});
//# sourceMappingURL=deviceService.test.js.map