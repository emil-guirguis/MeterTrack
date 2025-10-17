"use strict";
const express = require('express');
const DeviceService = require('../services/deviceService');
const router = express.Router();
/**
 * Standardized error response handler
 */
function handleError(res, error) {
    console.error('Device API Error:', error);
    // Handle validation errors
    if (error.code === 'VALIDATION_ERROR') {
        return res.status(400).json({
            success: false,
            error: error.message,
            code: 'VALIDATION_ERROR',
            details: error.details
        });
    }
    // Handle duplicate name errors
    if (error.code === 'DUPLICATE_NAME') {
        return res.status(409).json({
            success: false,
            error: error.message,
            code: 'DUPLICATE_NAME'
        });
    }
    // Handle foreign key constraint violations
    if (error.code === 'FOREIGN_KEY_VIOLATION') {
        return res.status(409).json({
            success: false,
            error: error.message,
            code: 'FOREIGN_KEY_VIOLATION'
        });
    }
    // Handle data too long errors
    if (error.code === 'DATA_TOO_LONG') {
        return res.status(400).json({
            success: false,
            error: error.message,
            code: 'DATA_TOO_LONG'
        });
    }
    // Handle database errors
    if (error.code === 'DATABASE_ERROR') {
        return res.status(500).json({
            success: false,
            error: error.message,
            code: 'DATABASE_ERROR'
        });
    }
    // Handle generic errors
    return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
    });
}
// Get all devices
router.get('/', async (req, res) => {
    try {
        const devices = await DeviceService.getAllDevices();
        res.json({
            success: true,
            data: devices,
            count: devices.length
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
// Create a new device
router.post('/', async (req, res) => {
    try {
        const device = await DeviceService.createDevice(req.body);
        res.status(201).json({
            success: true,
            data: device,
            message: 'Device created successfully'
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
// Get device by ID
router.get('/:id', async (req, res) => {
    try {
        const device = await DeviceService.getDeviceById(req.params.id);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found',
                code: 'NOT_FOUND'
            });
        }
        res.json({ success: true, data: device });
    }
    catch (error) {
        handleError(res, error);
    }
});
// Update a device
router.put('/:id', async (req, res) => {
    try {
        const device = await DeviceService.updateDevice(req.params.id, req.body);
        if (!device) {
            return res.status(404).json({
                success: false,
                error: 'Device not found',
                code: 'NOT_FOUND'
            });
        }
        res.json({
            success: true,
            data: device,
            message: 'Device updated successfully'
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
// Delete a device
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await DeviceService.deleteDevice(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Device not found',
                code: 'NOT_FOUND'
            });
        }
        res.json({
            success: true,
            message: 'Device deleted successfully'
        });
    }
    catch (error) {
        handleError(res, error);
    }
});
module.exports = router;
//# sourceMappingURL=devices.js.map