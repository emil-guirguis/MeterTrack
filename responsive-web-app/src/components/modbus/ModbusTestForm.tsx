import React, { useState, useEffect } from 'react';
import { useModbus } from '../../services/modbusService';
import type { ModbusConfig } from '../../services/modbusService';
import './ModbusTestForm.css';

interface ModbusTestFormProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

const ModbusTestForm: React.FC<ModbusTestFormProps> = ({ onSuccess, onError }) => {
  const { loading, error, testConnection, readMeterData, getMeterTypes } = useModbus();
  
  const [config, setConfig] = useState<ModbusConfig>({
    deviceIP: '192.168.1.100',
    port: 502,
    slaveId: 1,
    meterType: 'generic'
  });
  
  const [meterTypes, setMeterTypes] = useState<any>({});
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'failed'>('idle');
  const [lastReading, setLastReading] = useState<any>(null);

  // Load meter types on component mount
  useEffect(() => {
    const loadMeterTypes = async () => {
      const result = await getMeterTypes();
      if (result.success && result.data) {
        setMeterTypes(result.data);
      }
    };
    loadMeterTypes();
  }, [getMeterTypes]);

  const handleInputChange = (field: keyof ModbusConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestConnection = async () => {
    const result = await testConnection(config);
    
    if (result.success && result.data?.connected) {
      setConnectionStatus('connected');
      onSuccess?.(result.data);
    } else {
      setConnectionStatus('failed');
      onError?.(result.error || 'Connection failed');
    }
  };

  const handleReadMeter = async () => {
    const result = await readMeterData(config);
    
    if (result.success && result.data) {
      setLastReading(result.data);
      onSuccess?.(result.data);
    } else {
      onError?.(result.error || 'Failed to read meter data');
    }
  };

  return (
    <div className="modbus-test-form">
      <h3>Modbus Device Configuration</h3>
      
      {error && (
        <div className="modbus-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="form-section">
        <h4>Connection Settings</h4>
        
        <div className="form-row">
          <div className="form-field">
            <label>Device IP Address</label>
            <input
              type="text"
              value={config.deviceIP}
              onChange={(e) => handleInputChange('deviceIP', e.target.value)}
              placeholder="192.168.1.100"
              disabled={loading}
            />
          </div>
          
          <div className="form-field">
            <label>Port</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
              min={1}
              max={65535}
              disabled={loading}
              title="Modbus TCP Port"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Slave ID</label>
            <input
              type="number"
              value={config.slaveId}
              onChange={(e) => handleInputChange('slaveId', parseInt(e.target.value))}
              min={1}
              max={255}
              disabled={loading}
              title="Modbus Slave ID"
            />
          </div>
          
          <div className="form-field">
            <label>Meter Type</label>
            <select
              value={config.meterType}
              onChange={(e) => handleInputChange('meterType', e.target.value)}
              disabled={loading}
              title="Select Meter Type"
            >
              {Object.entries(meterTypes).map(([key, type]: [string, any]) => (
                <option key={key} value={key}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={loading || !config.deviceIP}
          className={`test-btn ${connectionStatus === 'connected' ? 'success' : connectionStatus === 'failed' ? 'error' : ''}`}
        >
          {loading ? '🔄 Testing...' : connectionStatus === 'connected' ? '✅ Connected' : connectionStatus === 'failed' ? '❌ Failed' : '🔌 Test Connection'}
        </button>
        
        <button
          type="button"
          onClick={handleReadMeter}
          disabled={loading || !config.deviceIP || connectionStatus !== 'connected'}
          className="read-btn"
        >
          {loading ? '🔄 Reading...' : '📊 Read Meter Data'}
        </button>
      </div>

      {connectionStatus === 'connected' && (
        <div className="connection-success">
          <h4>✅ Connection Successful</h4>
          <p>Device at {config.deviceIP}:{config.port} is responding</p>
        </div>
      )}

      {lastReading && (
        <div className="reading-results">
          <h4>📊 Latest Reading</h4>
          <div className="reading-grid">
            {lastReading.rawData && Object.entries(lastReading.rawData).map(([key, value]: [string, any]) => (
              <div key={key} className="reading-item">
                <span className="reading-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className="reading-value">
                  {value !== null ? (typeof value === 'number' ? value.toFixed(2) : value) : 'N/A'}
                </span>
              </div>
            ))}
          </div>
          <div className="reading-timestamp">
            Last updated: {new Date(lastReading.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {config.meterType && meterTypes[config.meterType] && (
        <div className="meter-info">
          <h4>📋 Meter Information</h4>
          <p><strong>{meterTypes[config.meterType].name}</strong></p>
          <p>{meterTypes[config.meterType].description}</p>
          
          <div className="register-map">
            <h5>Register Map:</h5>
            {Object.entries(meterTypes[config.meterType].registers || {}).map(([key, reg]: [string, any]) => (
              <div key={key} className="register-item">
                <span className="register-name">{key}</span>
                <span className="register-address">Address: {reg.address}</span>
                <span className="register-desc">{reg.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModbusTestForm;