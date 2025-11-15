import React, { useState } from 'react';
import { directModbusService } from '../../services/directModbusService';
import './MeterDataRetriever.css';



interface MeterDataPoint {
  name: string;
  value: string | number;
  unit?: string;
  address?: number;
  type?: string;
}

interface MeterDataGridProps {
  data: MeterDataPoint[];
}

const MeterDataGrid: React.FC<MeterDataGridProps> = ({ data }) => {
  return (
    <div className="meter-data-grid">
      <div className="meter-data-grid__header">
        <div className="meter-data-grid__header-cell">Parameter</div>
        <div className="meter-data-grid__header-cell">Value</div>
        <div className="meter-data-grid__header-cell">Unit</div>
        <div className="meter-data-grid__header-cell">Address</div>
        <div className="meter-data-grid__header-cell">Type</div>
      </div>
      <div className="meter-data-grid__body">
        {data.map((item, index) => (
          <div key={index} className="meter-data-grid__row">
            <div className="meter-data-grid__cell meter-data-grid__cell--name" data-label="Parameter">
              {item.name}
            </div>
            <div className="meter-data-grid__cell meter-data-grid__cell--value" data-label="Value">
              {typeof item.value === 'number' ? item.value.toFixed(3) : item.value}
            </div>
            <div className="meter-data-grid__cell meter-data-grid__cell--unit" data-label="Unit">
              {item.unit || '-'}
            </div>
            <div className="meter-data-grid__cell meter-data-grid__cell--address" data-label="Address">
              {item.address !== undefined ? item.address : '-'}
            </div>
            <div className="meter-data-grid__cell meter-data-grid__cell--type" data-label="Type">
              {item.type || '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MeterDataRetriever: React.FC = () => {
  const [meterData, setMeterData] = useState<MeterDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleGetMeterData = async () => {
    // Clear existing data first
    setMeterData([]);
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔌 Connecting directly to meter at 10.10.10.11:502...');
      
      // Connect directly to meter using the same logic as MCP agent
      const reading = await directModbusService.connectAndReadMeter();
      
  console.log('✅ REAL meter data received:', reading);
      
      // Convert real meter data to display format
      const realDataPoints: MeterDataPoint[] = [
        { name: 'Voltage', value: reading.voltage.toFixed(2), unit: 'V', address: 5, type: 'Real' },
        { name: 'Current', value: reading.current.toFixed(2), unit: 'A', address: 6, type: 'Real' },
        { name: 'Power', value: reading.power.toFixed(0), unit: 'W', address: 7, type: 'Real' },
        { name: 'Energy Rate', value: (reading.power / 1000).toFixed(2), unit: 'kW', type: 'Calculated' },
        { name: 'Frequency', value: reading.frequency.toFixed(1), unit: 'Hz', address: 0, type: 'Real' },
        { name: 'Power Factor', value: reading.powerFactor.toFixed(3), unit: '', address: 9, type: 'Real' },
        
        // Add calculated values
        { name: 'Apparent Power', value: (reading.voltage * reading.current).toFixed(0), unit: 'VA', type: 'Calculated' },
        { name: 'Energy Estimate', value: reading.energy.toFixed(3), unit: 'kWh', type: 'Calculated' },
        
        // Device info
        { name: 'Device IP', value: reading.deviceIP || reading.ip || '—', unit: '', type: 'Info' },
        { name: 'Modbus Port', value: (reading.port as any) || '—', unit: '', type: 'Info' },
        { name: 'Slave ID', value: (reading.slaveId as any) || '—', unit: '', type: 'Info' },
        { name: 'Connection Type', value: 'Backend API', unit: '', type: 'Info' },
        { name: 'Data Source', value: 'Latest Reading (DB)', unit: '', type: 'Info' },
        { name: 'Timestamp', value: reading.timestamp.toLocaleTimeString(), unit: '', type: 'Info' },
      ];
      
      setMeterData(realDataPoints);
  setError(`✅ REAL meter data | ${reading.voltage.toFixed(1)}V | ${reading.current.toFixed(1)}A | ${(reading.power/1000).toFixed(2)}kW`);
      setLastUpdate(new Date());
      console.log(`✅ Successfully loaded ${realDataPoints.length} REAL data points from meter`);
      
    } catch (error) {
      console.error('❌ Direct meter connection failed:', error);
      setError(`❌ Failed to load latest meter data - ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meter-data-retriever">
      <div className="meter-data-retriever__header">
        <h2>Meter Data Retriever</h2>
        <button 
          onClick={handleGetMeterData}
          disabled={loading}
          className="meter-data-retriever__button"
        >
          {loading ? 'Getting Meter Data...' : 'Get Meter Data'}
        </button>
      </div>
      
      {error && (
        <div className={`meter-data-retriever__message ${error.includes('✅') ? 'meter-data-retriever__message--success' : 'meter-data-retriever__message--error'}`}>
          {error}
        </div>
      )}
      
      {lastUpdate && (
        <div className="meter-data-retriever__timestamp">
          Last updated: {lastUpdate.toLocaleString()}
        </div>
      )}
      
      {loading && (
        <div className="meter-data-retriever__loading">
          <div className="meter-data-retriever__spinner"></div>
          <span>Connecting to meter and retrieving data...</span>
        </div>
      )}
      
      {meterData.length > 0 && (
        <div className="meter-data-retriever__results">
          <div className="meter-data-retriever__summary">
            <span>Total Parameters: {meterData.length}</span>
          </div>
          <MeterDataGrid data={meterData} />
        </div>
      )}
    </div>
  );
};

export default MeterDataRetriever;