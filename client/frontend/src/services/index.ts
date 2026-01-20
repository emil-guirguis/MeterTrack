// Export all services from this file
export { default as authService } from './authService';
export { meterReadingService } from './meterReadingService';
export { modbusService } from './modbusService';
export { mcpService } from './mcpService';
export { templateService } from './templateService';
export { dashboardService } from './dashboardService';

// Note: contactService, deviceService, locationService, meterService, and userService
// have been moved to their respective feature folders:
// - client/frontend/src/features/contacts/contactsStore.ts
// - client/frontend/src/features/devices/devicesStore.ts
// - client/frontend/src/features/locations/locationsStore.ts
// - client/frontend/src/features/meters/meterService.ts
// - client/frontend/src/features/users/userService.ts
