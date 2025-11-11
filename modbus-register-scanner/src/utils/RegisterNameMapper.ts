/**
 * Common Modbus register mappings for various devices
 * This includes typical registers found in power meters, PLCs, and other industrial devices
 */

export interface RegisterMapping {
    address: number;
    functionCode: number;
    name: string;
    description: string;
    unit?: string;
    dataType?: 'uint16' | 'int16' | 'uint32' | 'int32' | 'float32' | 'bool';
}

/**
 * Common register mappings for various Modbus devices
 */
const COMMON_REGISTER_MAPPINGS: RegisterMapping[] = [
    // Power Meter Registers (Common addresses)
    { address: 1, functionCode: 3, name: 'Voltage_L1', description: 'Line 1 Voltage', unit: 'V' },
    { address: 2, functionCode: 3, name: 'Voltage_L2', description: 'Line 2 Voltage', unit: 'V' },
    { address: 3, functionCode: 3, name: 'Voltage_L3', description: 'Line 3 Voltage', unit: 'V' },
    { address: 4, functionCode: 3, name: 'Current_L1', description: 'Line 1 Current', unit: 'A' },
    { address: 5, functionCode: 3, name: 'Current_L2', description: 'Line 2 Current', unit: 'A' },
    { address: 6, functionCode: 3, name: 'Current_L3', description: 'Line 3 Current', unit: 'A' },
    { address: 7, functionCode: 3, name: 'Power_Total', description: 'Total Active Power', unit: 'kW' },
    { address: 8, functionCode: 3, name: 'Power_L1', description: 'Line 1 Active Power', unit: 'kW' },
    { address: 9, functionCode: 3, name: 'Power_L2', description: 'Line 2 Active Power', unit: 'kW' },
    { address: 10, functionCode: 3, name: 'Power_L3', description: 'Line 3 Active Power', unit: 'kW' },
    { address: 11, functionCode: 3, name: 'Reactive_Power', description: 'Total Reactive Power', unit: 'kVAR' },
    { address: 12, functionCode: 3, name: 'Apparent_Power', description: 'Total Apparent Power', unit: 'kVA' },
    { address: 13, functionCode: 3, name: 'Power_Factor', description: 'Power Factor', unit: '' },
    { address: 14, functionCode: 3, name: 'Frequency', description: 'System Frequency', unit: 'Hz' },
    { address: 15, functionCode: 3, name: 'Energy_Total', description: 'Total Energy', unit: 'kWh' },
    { address: 16, functionCode: 3, name: 'Demand_Current', description: 'Current Demand', unit: 'kW' },
    { address: 17, functionCode: 3, name: 'Demand_Peak', description: 'Peak Demand', unit: 'kW' },

    // Temperature and Environmental
    { address: 100, functionCode: 3, name: 'Temperature_1', description: 'Temperature Sensor 1', unit: '°C' },
    { address: 101, functionCode: 3, name: 'Temperature_2', description: 'Temperature Sensor 2', unit: '°C' },
    { address: 102, functionCode: 3, name: 'Humidity', description: 'Relative Humidity', unit: '%' },
    { address: 103, functionCode: 3, name: 'Pressure', description: 'Pressure Sensor', unit: 'bar' },

    // Flow and Level
    { address: 200, functionCode: 3, name: 'Flow_Rate', description: 'Flow Rate', unit: 'L/min' },
    { address: 201, functionCode: 3, name: 'Flow_Total', description: 'Total Flow', unit: 'L' },
    { address: 202, functionCode: 3, name: 'Level_Tank1', description: 'Tank 1 Level', unit: '%' },
    { address: 203, functionCode: 3, name: 'Level_Tank2', description: 'Tank 2 Level', unit: '%' },

    // Motor and Drive Parameters
    { address: 300, functionCode: 3, name: 'Motor_Speed', description: 'Motor Speed', unit: 'RPM' },
    { address: 301, functionCode: 3, name: 'Motor_Torque', description: 'Motor Torque', unit: 'Nm' },
    { address: 302, functionCode: 3, name: 'Motor_Current', description: 'Motor Current', unit: 'A' },
    { address: 303, functionCode: 3, name: 'Motor_Voltage', description: 'Motor Voltage', unit: 'V' },
    { address: 304, functionCode: 3, name: 'Motor_Power', description: 'Motor Power', unit: 'kW' },
    { address: 305, functionCode: 3, name: 'Motor_Temp', description: 'Motor Temperature', unit: '°C' },

    // Digital I/O (Coils and Discrete Inputs)
    { address: 1, functionCode: 1, name: 'Pump_1_Start', description: 'Pump 1 Start Command', unit: '' },
    { address: 2, functionCode: 1, name: 'Pump_2_Start', description: 'Pump 2 Start Command', unit: '' },
    { address: 3, functionCode: 1, name: 'Fan_1_Start', description: 'Fan 1 Start Command', unit: '' },
    { address: 4, functionCode: 1, name: 'Fan_2_Start', description: 'Fan 2 Start Command', unit: '' },
    { address: 5, functionCode: 1, name: 'Alarm_Reset', description: 'Alarm Reset Command', unit: '' },
    { address: 6, functionCode: 1, name: 'Emergency_Stop', description: 'Emergency Stop', unit: '' },

    { address: 1, functionCode: 2, name: 'Pump_1_Status', description: 'Pump 1 Running Status', unit: '' },
    { address: 2, functionCode: 2, name: 'Pump_2_Status', description: 'Pump 2 Running Status', unit: '' },
    { address: 3, functionCode: 2, name: 'High_Level_Alarm', description: 'High Level Alarm', unit: '' },
    { address: 4, functionCode: 2, name: 'Low_Level_Alarm', description: 'Low Level Alarm', unit: '' },
    { address: 5, functionCode: 2, name: 'Pressure_Alarm', description: 'Pressure Alarm', unit: '' },
    { address: 6, functionCode: 2, name: 'Temperature_Alarm', description: 'Temperature Alarm', unit: '' },

    // System Status and Configuration
    { address: 1000, functionCode: 3, name: 'Device_ID', description: 'Device Identification', unit: '' },
    { address: 1001, functionCode: 3, name: 'Firmware_Version', description: 'Firmware Version', unit: '' },
    { address: 1002, functionCode: 3, name: 'Serial_Number_H', description: 'Serial Number High', unit: '' },
    { address: 1003, functionCode: 3, name: 'Serial_Number_L', description: 'Serial Number Low', unit: '' },
    { address: 1004, functionCode: 3, name: 'Uptime_Hours', description: 'System Uptime', unit: 'hours' },
    { address: 1005, functionCode: 3, name: 'Error_Code', description: 'Current Error Code', unit: '' },
    { address: 1006, functionCode: 3, name: 'Status_Word', description: 'System Status Word', unit: '' },

    // Schneider Electric Power Meters (Common addresses)
    { address: 2999, functionCode: 4, name: 'Voltage_AN', description: 'Voltage A-N', unit: 'V' },
    { address: 3001, functionCode: 4, name: 'Voltage_BN', description: 'Voltage B-N', unit: 'V' },
    { address: 3003, functionCode: 4, name: 'Voltage_CN', description: 'Voltage C-N', unit: 'V' },
    { address: 3019, functionCode: 4, name: 'Current_A', description: 'Current Phase A', unit: 'A' },
    { address: 3021, functionCode: 4, name: 'Current_B', description: 'Current Phase B', unit: 'A' },
    { address: 3023, functionCode: 4, name: 'Current_C', description: 'Current Phase C', unit: 'A' },
    { address: 3053, functionCode: 4, name: 'Power_kW_Total', description: 'Total kW', unit: 'kW' },
    { address: 3059, functionCode: 4, name: 'Power_kVAR_Total', description: 'Total kVAR', unit: 'kVAR' },
    { address: 3061, functionCode: 4, name: 'Power_kVA_Total', description: 'Total kVA', unit: 'kVA' },
    { address: 3109, functionCode: 4, name: 'Power_Factor_Total', description: 'Total Power Factor', unit: '' },
    { address: 3110, functionCode: 4, name: 'Frequency_Hz', description: 'Frequency', unit: 'Hz' },

    // ABB Drives (Common addresses)
    { address: 40001, functionCode: 3, name: 'Drive_Speed_Ref', description: 'Speed Reference', unit: 'RPM' },
    { address: 40002, functionCode: 3, name: 'Drive_Speed_Act', description: 'Actual Speed', unit: 'RPM' },
    { address: 40003, functionCode: 3, name: 'Drive_Current', description: 'Output Current', unit: 'A' },
    { address: 40004, functionCode: 3, name: 'Drive_Voltage', description: 'Output Voltage', unit: 'V' },
    { address: 40005, functionCode: 3, name: 'Drive_Power', description: 'Output Power', unit: 'kW' },
    { address: 40006, functionCode: 3, name: 'Drive_Torque', description: 'Output Torque', unit: '%' },

    // DENT PowerScout Meters (Standard addresses)
    { address: 1001, functionCode: 4, name: 'Voltage_A', description: 'Phase A Voltage', unit: 'V' },
    { address: 1003, functionCode: 4, name: 'Voltage_B', description: 'Phase B Voltage', unit: 'V' },
    { address: 1005, functionCode: 4, name: 'Voltage_C', description: 'Phase C Voltage', unit: 'V' },
    { address: 1007, functionCode: 4, name: 'Voltage_AB', description: 'Line Voltage A-B', unit: 'V' },
    { address: 1009, functionCode: 4, name: 'Voltage_BC', description: 'Line Voltage B-C', unit: 'V' },
    { address: 1011, functionCode: 4, name: 'Voltage_CA', description: 'Line Voltage C-A', unit: 'V' },

    { address: 1013, functionCode: 4, name: 'Current_A', description: 'Phase A Current', unit: 'A' },
    { address: 1015, functionCode: 4, name: 'Current_B', description: 'Phase B Current', unit: 'A' },
    { address: 1017, functionCode: 4, name: 'Current_C', description: 'Phase C Current', unit: 'A' },
    { address: 1019, functionCode: 4, name: 'Current_N', description: 'Neutral Current', unit: 'A' },

    { address: 1021, functionCode: 4, name: 'Power_A', description: 'Phase A Real Power', unit: 'kW' },
    { address: 1023, functionCode: 4, name: 'Power_B', description: 'Phase B Real Power', unit: 'kW' },
    { address: 1025, functionCode: 4, name: 'Power_C', description: 'Phase C Real Power', unit: 'kW' },
    { address: 1027, functionCode: 4, name: 'Power_Total', description: 'Total Real Power', unit: 'kW' },

    { address: 1029, functionCode: 4, name: 'Reactive_A', description: 'Phase A Reactive Power', unit: 'kVAR' },
    { address: 1031, functionCode: 4, name: 'Reactive_B', description: 'Phase B Reactive Power', unit: 'kVAR' },
    { address: 1033, functionCode: 4, name: 'Reactive_C', description: 'Phase C Reactive Power', unit: 'kVAR' },
    { address: 1035, functionCode: 4, name: 'Reactive_Total', description: 'Total Reactive Power', unit: 'kVAR' },

    { address: 1037, functionCode: 4, name: 'Apparent_A', description: 'Phase A Apparent Power', unit: 'kVA' },
    { address: 1039, functionCode: 4, name: 'Apparent_B', description: 'Phase B Apparent Power', unit: 'kVA' },
    { address: 1041, functionCode: 4, name: 'Apparent_C', description: 'Phase C Apparent Power', unit: 'kVA' },
    { address: 1043, functionCode: 4, name: 'Apparent_Total', description: 'Total Apparent Power', unit: 'kVA' },

    { address: 1045, functionCode: 4, name: 'PF_A', description: 'Phase A Power Factor', unit: '' },
    { address: 1047, functionCode: 4, name: 'PF_B', description: 'Phase B Power Factor', unit: '' },
    { address: 1049, functionCode: 4, name: 'PF_C', description: 'Phase C Power Factor', unit: '' },
    { address: 1051, functionCode: 4, name: 'PF_Total', description: 'Total Power Factor', unit: '' },

    { address: 1053, functionCode: 4, name: 'Frequency', description: 'System Frequency', unit: 'Hz' },

    // DENT Energy Registers
    { address: 1101, functionCode: 4, name: 'Energy_A_Pos', description: 'Phase A Positive Energy', unit: 'kWh' },
    { address: 1103, functionCode: 4, name: 'Energy_B_Pos', description: 'Phase B Positive Energy', unit: 'kWh' },
    { address: 1105, functionCode: 4, name: 'Energy_C_Pos', description: 'Phase C Positive Energy', unit: 'kWh' },
    { address: 1107, functionCode: 4, name: 'Energy_Total_Pos', description: 'Total Positive Energy', unit: 'kWh' },

    // DENT Demand Registers
    { address: 1201, functionCode: 4, name: 'Demand_A', description: 'Phase A Demand', unit: 'kW' },
    { address: 1203, functionCode: 4, name: 'Demand_B', description: 'Phase B Demand', unit: 'kW' },
    { address: 1205, functionCode: 4, name: 'Demand_C', description: 'Phase C Demand', unit: 'kW' },
    { address: 1207, functionCode: 4, name: 'Demand_Total', description: 'Total Demand', unit: 'kW' },

    // Siemens S7 PLC (Common addresses)
    { address: 0, functionCode: 4, name: 'PLC_Status', description: 'PLC Status Word', unit: '' },
    { address: 1, functionCode: 4, name: 'Cycle_Time', description: 'PLC Cycle Time', unit: 'ms' },
    { address: 2, functionCode: 4, name: 'CPU_Load', description: 'CPU Load', unit: '%' },
    { address: 10, functionCode: 4, name: 'Analog_Input_1', description: 'Analog Input 1', unit: '' },
    { address: 11, functionCode: 4, name: 'Analog_Input_2', description: 'Analog Input 2', unit: '' },
    { address: 12, functionCode: 4, name: 'Analog_Input_3', description: 'Analog Input 3', unit: '' },
    { address: 13, functionCode: 4, name: 'Analog_Input_4', description: 'Analog Input 4', unit: '' },
];

/**
 * RegisterNameMapper provides register name resolution for common Modbus devices
 */
export class RegisterNameMapper {
    private registerMap: Map<string, RegisterMapping>;

    constructor() {
        this.registerMap = new Map();
        this.loadCommonMappings();
    }

    /**
     * Load common register mappings into the map
     */
    private loadCommonMappings(): void {
        COMMON_REGISTER_MAPPINGS.forEach(mapping => {
            const key = `${mapping.functionCode}_${mapping.address}`;
            this.registerMap.set(key, mapping);
        });
    }

    /**
     * Get register name and description for a given address and function code
     */
    public getRegisterInfo(address: number, functionCode: number): { name: string; description: string; unit?: string } | null {
        const key = `${functionCode}_${address}`;
        const mapping = this.registerMap.get(key);

        if (mapping) {
            return {
                name: mapping.name,
                description: mapping.description,
                unit: mapping.unit
            };
        }

        // Try to guess based on common patterns
        return this.guessRegisterName(address, functionCode);
    }

    /**
     * Guess register name based on common address patterns
     */
    private guessRegisterName(address: number, functionCode: number): { name: string; description: string; unit?: string } | null {
        // Power meter patterns
        if (functionCode === 3 || functionCode === 4) {
            if (address >= 1 && address <= 20) {
                if (address <= 3) return { name: `Voltage_L${address}`, description: `Line ${address} Voltage`, unit: 'V' };
                if (address >= 4 && address <= 6) return { name: `Current_L${address - 3}`, description: `Line ${address - 3} Current`, unit: 'A' };
                if (address === 7) return { name: 'Power_Total', description: 'Total Active Power', unit: 'kW' };
                if (address >= 8 && address <= 10) return { name: `Power_L${address - 7}`, description: `Line ${address - 7} Power`, unit: 'kW' };
                if (address === 14) return { name: 'Frequency', description: 'System Frequency', unit: 'Hz' };
                if (address === 16) return { name: 'Demand', description: 'Power Demand', unit: 'kW' };
            }

            // Temperature range
            if (address >= 100 && address <= 199) {
                return { name: `Temperature_${address - 99}`, description: `Temperature Sensor ${address - 99}`, unit: '°C' };
            }

            // Flow/Level range
            if (address >= 200 && address <= 299) {
                if (address === 200) return { name: 'Flow_Rate', description: 'Flow Rate', unit: 'L/min' };
                if (address === 201) return { name: 'Flow_Total', description: 'Total Flow', unit: 'L' };
                if (address >= 202 && address <= 210) return { name: `Level_${address - 201}`, description: `Tank ${address - 201} Level`, unit: '%' };
            }

            // Motor parameters
            if (address >= 300 && address <= 399) {
                if (address === 300) return { name: 'Motor_Speed', description: 'Motor Speed', unit: 'RPM' };
                if (address === 301) return { name: 'Motor_Torque', description: 'Motor Torque', unit: 'Nm' };
                if (address === 302) return { name: 'Motor_Current', description: 'Motor Current', unit: 'A' };
                if (address === 303) return { name: 'Motor_Voltage', description: 'Motor Voltage', unit: 'V' };
                if (address === 304) return { name: 'Motor_Power', description: 'Motor Power', unit: 'kW' };
            }

            // System info range
            if (address >= 1000 && address <= 1099) {
                if (address === 1000) return { name: 'Device_ID', description: 'Device ID', unit: '' };
                if (address === 1001) return { name: 'Firmware_Ver', description: 'Firmware Version', unit: '' };
                if (address === 1004) return { name: 'Uptime', description: 'System Uptime', unit: 'hours' };
                if (address === 1005) return { name: 'Error_Code', description: 'Error Code', unit: '' };
            }
        }

        // Digital I/O patterns
        if (functionCode === 1) { // Coils
            if (address >= 1 && address <= 10) {
                return { name: `Coil_${address}`, description: `Digital Output ${address}`, unit: '' };
            }
        }

        if (functionCode === 2) { // Discrete Inputs
            if (address >= 1 && address <= 10) {
                return { name: `Input_${address}`, description: `Digital Input ${address}`, unit: '' };
            }
        }

        return null;
    }

    /**
     * Add custom register mapping
     */
    public addCustomMapping(mapping: RegisterMapping): void {
        const key = `${mapping.functionCode}_${mapping.address}`;
        this.registerMap.set(key, mapping);
    }

    /**
     * Load custom mappings from a configuration object
     */
    public loadCustomMappings(mappings: RegisterMapping[]): void {
        mappings.forEach(mapping => this.addCustomMapping(mapping));
    }

    /**
     * Get all known register mappings
     */
    public getAllMappings(): RegisterMapping[] {
        return Array.from(this.registerMap.values());
    }

    /**
     * Clear all mappings
     */
    public clearMappings(): void {
        this.registerMap.clear();
    }

    /**
     * Get register count by type
     */
    public getRegisterStats(): { [key: string]: number } {
        const stats: { [key: string]: number } = {};

        this.registerMap.forEach(mapping => {
            const type = this.getFunctionCodeName(mapping.functionCode);
            stats[type] = (stats[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Get function code name
     */
    private getFunctionCodeName(functionCode: number): string {
        switch (functionCode) {
            case 1: return 'Coils';
            case 2: return 'Discrete Inputs';
            case 3: return 'Holding Registers';
            case 4: return 'Input Registers';
            default: return `FC${functionCode}`;
        }
    }
}