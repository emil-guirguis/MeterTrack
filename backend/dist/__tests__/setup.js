"use strict";
// Test setup file
const db = require('../config/database');
// Mock database for tests
jest.mock('../config/database', () => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
}));
// Global test setup
beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
});
afterAll(async () => {
    // Clean up after all tests
    if (db.end) {
        await db.end();
    }
});
// Add a dummy test to prevent "no tests" error
describe('Test Setup', () => {
    it('should setup test environment', () => {
        expect(true).toBe(true);
    });
});
//# sourceMappingURL=setup.js.map