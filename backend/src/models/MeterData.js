const mongoose = require('mongoose');

// Meter dashboard data (simple latest snapshot metrics per meter)
const meterDataSchema = new mongoose.Schema(
  {
    meterid: { type: String, required: true, index: true, trim: true },
    ip: { type: String, trim: true },
    port: { type: Number },

    // Energy and demand metrics
    kVARh: { type: Number }, // kVAR Hour Net
    kVAh: { type: Number },  // kVA Hour Net
    A: { type: Number },     // Current (Amps)
    kWh: { type: Number },   // Watt-Hour Meter
    dPF: { type: Number },   // Displacement Power Factor
    dPFchannel: { type: String, trim: true }, // Displacement Power Factor Channel
    V: { type: Number },     // Volts
    kW: { type: Number },    // Watt Demand
    kWpeak: { type: Number } // Demand kW Peak
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeterData', meterDataSchema);
