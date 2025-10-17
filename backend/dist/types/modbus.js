/**
 * TypeScript interfaces and type definitions for Modbus operations
 * Supporting both modbus-serial (current) and jsmodbus (new) libraries
 */
// Error types
export var ModbusErrorType;
(function (ModbusErrorType) {
    ModbusErrorType["CONNECTION_FAILED"] = "CONNECTION_FAILED";
    ModbusErrorType["TIMEOUT"] = "TIMEOUT";
    ModbusErrorType["PROTOCOL_ERROR"] = "PROTOCOL_ERROR";
    ModbusErrorType["INVALID_ADDRESS"] = "INVALID_ADDRESS";
    ModbusErrorType["INVALID_REGISTER"] = "INVALID_REGISTER";
    ModbusErrorType["DEVICE_BUSY"] = "DEVICE_BUSY";
    ModbusErrorType["POOL_EXHAUSTED"] = "POOL_EXHAUSTED";
    ModbusErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ModbusErrorType || (ModbusErrorType = {}));
export class ModbusError extends Error {
    constructor(message, type, deviceId, address) {
        super(message);
        this.name = 'ModbusError';
        this.type = type;
        this.deviceId = deviceId;
        this.address = address;
    }
}
