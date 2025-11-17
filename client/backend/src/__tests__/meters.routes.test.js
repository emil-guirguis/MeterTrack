/**
 * Integration tests for Meters routes with BaseModel
 * 
 * These tests verify that the routes work correctly with the new BaseModel-based Meter model
 */

const request = require('supertest');
const express = require('express');
const metersRouter = require('../routes/meters');
const Meter = require('../models/Meter');
const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyError,
  NotFoundError
} = require('../../../../framework/backend/api/base/errors');

// Create a test app
const app = express();
app.use(express.json());

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, permissions: ['meter:read', 'meter:create', 'meter:update', 'meter:delete'] };
    next();
  },
  requirePermission: (permission) => (req, res, next) => {
    if (req.user && req.user.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Forbidden' });
    }
  }
}));

// Mock DeviceService
jest.mock('../services/deviceService', () => ({
  getAllDevices: jest.fn(),
  createDevice: jest.fn()
}));

app.use('/api/meters', metersRouter);

describe('Meters Routes with BaseModel', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/meters', () => {
    it('should fetch all meters with pagination and relationships', async () => {
      // Mock BaseModel's findAll method
      const mockResult = {
        rows: [
          {
            id: 1,
            meterid: 'M001',
            serial_number: 'SN001',
            type: 'electric',
            status: 'active',
            device_name: 'Test Device',
            device_description: 'Test Model',
            created_at: new Date(),
            updated_at: new Date(),
            fullLocation: 'Building A, Floor 1'
          }
        ],
        pagination: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          pageSize: 20
        }
      };

      jest.spyOn(Meter, 'findAll').mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/meters')
        .query({ page: 1, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].meterId).toBe('M001');
      expect(Meter.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: ['device', 'location'],
          limit: 20,
          offset: 0
        })
      );
    });

    it('should handle filtering by status', async () => {
      const mockResult = {
        rows: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: 1, pageSize: 20 }
      };

      jest.spyOn(Meter, 'findAll').mockResolvedValue(mockResult);

      await request(app)
        .get('/api/meters')
        .query({ 'filter.status': 'active' });

      expect(Meter.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' }
        })
      );
    });
  });

  describe('GET /api/meters/:id', () => {
    it('should fetch a meter by ID with relationships', async () => {
      const mockMeter = {
        id: 1,
        meterid: 'M001',
        serial_number: 'SN001',
        type: 'electric',
        status: 'active',
        device_name: 'Test Device',
        device_description: 'Test Model',
        created_at: new Date(),
        updated_at: new Date(),
        fullLocation: 'Building A, Floor 1'
      };

      jest.spyOn(Meter, 'findById').mockResolvedValue(mockMeter);

      const response = await request(app).get('/api/meters/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.meterId).toBe('M001');
      expect(Meter.findById).toHaveBeenCalledWith('1', {
        include: ['device', 'location']
      });
    });

    it('should return 404 when meter not found', async () => {
      jest.spyOn(Meter, 'findById').mockResolvedValue(null);

      const response = await request(app).get('/api/meters/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Meter not found');
    });
  });

  describe('POST /api/meters', () => {
    it('should create a new meter', async () => {
      const mockMeter = {
        id: 1,
        meterid: 'M001',
        serial_number: 'SN001',
        type: 'electric',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        fullLocation: ''
      };

      jest.spyOn(Meter, 'create').mockResolvedValue(mockMeter);

      const response = await request(app)
        .post('/api/meters')
        .send({
          meterId: 'M001',
          serialNumber: 'SN001',
          type: 'electric',
          status: 'active'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.meterId).toBe('M001');
    });

    it('should handle unique constraint violations', async () => {
      const error = new UniqueConstraintError('Meter ID already exists', {
        field: 'meterid',
        value: 'M001'
      });

      jest.spyOn(Meter, 'create').mockRejectedValue(error);

      const response = await request(app)
        .post('/api/meters')
        .send({
          meterId: 'M001',
          type: 'electric'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should handle foreign key violations', async () => {
      const error = new ForeignKeyError('Referenced device does not exist', {
        field: 'device_id',
        value: 999
      });

      jest.spyOn(Meter, 'create').mockRejectedValue(error);

      const response = await request(app)
        .post('/api/meters')
        .send({
          meterId: 'M002',
          device_id: 999,
          type: 'electric'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/meters/:id', () => {
    it('should update a meter', async () => {
      const mockMeter = {
        id: 1,
        meterid: 'M001',
        update: jest.fn().mockResolvedValue({
          id: 1,
          meterid: 'M001',
          serial_number: 'SN001-UPDATED',
          status: 'inactive',
          created_at: new Date(),
          updated_at: new Date(),
          fullLocation: ''
        })
      };

      jest.spyOn(Meter, 'findById').mockResolvedValue(mockMeter);

      const response = await request(app)
        .put('/api/meters/1')
        .send({
          serialNumber: 'SN001-UPDATED',
          status: 'inactive'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockMeter.update).toHaveBeenCalled();
    });

    it('should return 404 when updating non-existent meter', async () => {
      jest.spyOn(Meter, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .put('/api/meters/999')
        .send({ status: 'inactive' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/meters/:id', () => {
    it('should delete a meter', async () => {
      const mockMeter = {
        id: 1,
        meterid: 'M001',
        delete: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(Meter, 'findById').mockResolvedValue(mockMeter);

      const response = await request(app).delete('/api/meters/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockMeter.delete).toHaveBeenCalled();
    });

    it('should handle foreign key constraint on delete', async () => {
      const mockMeter = {
        id: 1,
        meterid: 'M001',
        delete: jest.fn().mockRejectedValue(
          new ForeignKeyError('Cannot delete meter: it is referenced by other records')
        )
      };

      jest.spyOn(Meter, 'findById').mockResolvedValue(mockMeter);

      const response = await request(app).delete('/api/meters/1');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('referenced by other records');
    });
  });
});
