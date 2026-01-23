/**
 * DTO for batch upload request
 */
export interface BatchUploadRequestDto {
  readings: Array<{
    meter_id: number;
    meter_element_id?: number | null;
    active_energy?: number | null;
    active_energy_export?: number | null;
    apparent_energy?: number | null;
    apparent_energy_export?: number | null;
    apparent_power?: number | null;
    apparent_power_phase_a?: number | null;
    apparent_power_phase_b?: number | null;
    apparent_power_phase_c?: number | null;
    current?: number | null;
    current_line_a?: number | null;
    current_line_b?: number | null;
    current_line_c?: number | null;
    frequency?: number | null;
    maximum_demand_real?: number | null;
    power?: number | null;
    power_factor?: number | null;
    power_factor_phase_a?: number | null;
    power_factor_phase_b?: number | null;
    power_factor_phase_c?: number | null;
    power_phase_a?: number | null;
    power_phase_b?: number | null;
    power_phase_c?: number | null;
    reactive_energy?: number | null;
    reactive_energy_export?: number | null;
    reactive_power?: number | null;
    reactive_power_phase_a?: number | null;
    reactive_power_phase_b?: number | null;
    reactive_power_phase_c?: number | null;
    voltage_a_b?: number | null;
    voltage_a_n?: number | null;
    voltage_b_c?: number | null;
    voltage_b_n?: number | null;
    voltage_c_a?: number | null;
    voltage_c_n?: number | null;
    voltage_p_n?: number | null;
    voltage_p_p?: number | null;
    voltage_thd?: number | null;
    voltage_thd_phase_a?: number | null;
    voltage_thd_phase_b?: number | null;
    voltage_thd_phase_c?: number | null;
  }>;
}
